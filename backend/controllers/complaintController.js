const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const { sendMail, templates } = require('../services/emailService');
const { createSystemNotification, notifyUserPush, notifyRolePush } = require('../services/notificationService');

// ==========================================
// 1. Multer Configuration for Image Uploads
// ==========================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only images (JPEG, JPG, PNG, WEBP) are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB Limit
  fileFilter: fileFilter
}).single('image');

// ==========================================
// 2. REST API Actions
// ==========================================

// POST /api/complaints (Citizen submits grievance)
exports.createComplaint = (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: `Multer upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    const { title, description, category, latitude, longitude, address, priority } = req.body;
    const userId = req.user.id;

    if (!title || !description || !category || !latitude || !longitude || !address) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields. Please supply: title, description, category, coordinates (latitude, longitude), and address.'
      });
    }

    // Validate category
    const validCategories = ['Water Supply', 'Electricity', 'Road Damage', 'Garbage', 'Drainage', 'Street Light', 'Other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid complaint category specified.' });
    }

    // Generate unique complaint ID: CC-YYYY-XXXX
    const year = new Date().getFullYear();
    const uniqueNum = Math.floor(1000 + Math.random() * 9000);
    const complaintId = `CC-${year}-${uniqueNum}`;
    const imagePath = req.file ? `uploads/${req.file.filename}` : null;

    try {
      // 1. Insert into MySQL (Uses: latitude, longitude, address)
      await db.query(
        `INSERT INTO complaints (complaint_id, user_id, title, description, category, image, latitude, longitude, address, status, priority, remarks) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', ?, 'Grievance submitted successfully.')`,
        [complaintId, userId, title, description, category, imagePath, latitude, longitude, address, priority || 'Medium']
      );

      // 2. Log System Activity
      await db.query(
        'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
        [userId, 'complaint_created', `Complaint ${complaintId} successfully registered.`]
      );

      // 3. Create System Notification record
      await createSystemNotification(userId, `Your complaint "${title}" has been successfully logged! (ID: ${complaintId})`, 'success');

      // 4. Dispatch FCM Push Notification (Simulated/Real) to Citizen
      await notifyUserPush(
        userId, 
        'Grievance Registered', 
        `Your report ${complaintId} has been successfully logged. Reviewing is underway.`,
        { complaint_id: complaintId }
      );

      // 5. Dispatch FCM Push to all administrators / officers
      await notifyRolePush(
        'administrator',
        'New Civic Grievance Logged',
        `A new report has been logged: "${title}" (ID: ${complaintId}).`,
        { complaint_id: complaintId }
      );

      // 6. Nodemailer Email Dispatch
      const [users] = await db.query('SELECT name, email FROM users WHERE id = ?', [userId]);
      if (users.length > 0) {
        const citizen = users[0];
        try {
          const emailHtml = templates.submission(citizen.name, complaintId, title, category);
          await sendMail(citizen.email, `SmartCity Complaint Registered - ${complaintId}`, emailHtml);
        } catch (mailErr) {
          console.warn('[Nodemailer Submission Warning] Failed email relay:', mailErr.message);
        }
      }

      console.log(`[Complaint Controller] Created complaint ${complaintId} for User ${userId}`);

      return res.status(201).json({
        success: true,
        message: 'Complaint submitted successfully!',
        complaint_id: complaintId,
        image_url: imagePath
      });
    } catch (dbErr) {
      console.error('[Complaint Controller Error] DB Insert failed:', dbErr);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error: Failed to record complaint in database.', 
        error: dbErr.message 
      });
    }
  });
};

// GET /api/complaints (Retrieve complaints based on roles and filters)
exports.getComplaints = async (req, res) => {
  const { status, category, priority } = req.query;
  const { id, role } = req.user;

  try {
    let query = `
      SELECT c.*, u.name AS citizen_name, u.email AS citizen_email, d.department_name 
      FROM complaints c 
      JOIN users u ON c.user_id = u.id 
      LEFT JOIN departments d ON c.department_id = d.department_id
    `;
    const queryParams = [];

    // Role filtering
    if (role === 'citizen') {
      query += ' WHERE c.user_id = ?';
      queryParams.push(id);
    } else {
      query += ' WHERE 1=1';
    }

    if (status) {
      query += ' AND c.status = ?';
      queryParams.push(status);
    }
    if (category) {
      query += ' AND c.category = ?';
      queryParams.push(category);
    }
    if (priority) {
      query += ' AND c.priority = ?';
      queryParams.push(priority);
    }

    query += ' ORDER BY c.created_at DESC';

    const [complaints] = await db.query(query, queryParams);

    return res.status(200).json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (err) {
    console.error('[Complaint Controller Error] Fetch failed:', err);
    return res.status(500).json({ success: false, message: 'Server error while retrieving complaints.' });
  }
};

// GET /api/complaints/:id (Get detailed complaint with comment threads)
exports.getComplaintById = async (req, res) => {
  const complaintId = req.params.id;
  const { id, role } = req.user;

  try {
    const [complaints] = await db.query(
      `SELECT c.*, u.name AS citizen_name, u.email AS citizen_email, u.phone AS citizen_phone, d.department_name, d.head_officer, d.contact AS department_contact
       FROM complaints c 
       JOIN users u ON c.user_id = u.id 
       LEFT JOIN departments d ON c.department_id = d.department_id
       WHERE c.complaint_id = ?`,
      [complaintId]
    );

    if (complaints.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const complaint = complaints[0];

    // Citizen access check
    if (role === 'citizen' && complaint.user_id !== id) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this complaint.' });
    }

    // Retrieve comment threads
    const [comments] = await db.query(
      `SELECT cc.*, u.name AS author_name, u.role AS author_role, u.avatar AS author_avatar 
       FROM complaint_comments cc
       JOIN users u ON cc.user_id = u.id
       WHERE cc.complaint_id = ? 
       ORDER BY cc.created_at ASC`,
      [complaintId]
    );

    return res.status(200).json({
      success: true,
      complaint,
      comments
    });
  } catch (err) {
    console.error('[Complaint Controller Error] Fetch by ID failed:', err);
    return res.status(500).json({ success: false, message: 'Server error while retrieving complaint details.' });
  }
};

// PUT /api/complaints/:id (Update status/department/priority/remarks)
exports.updateComplaint = async (req, res) => {
  const complaintId = req.params.id;
  const { status, department_id, remarks, priority } = req.body;
  const { role, id: updaterId } = req.user;

  if (role === 'citizen') {
    return res.status(403).json({ success: false, message: 'Forbidden. Citizens are not permitted to edit complaint states.' });
  }

  try {
    const [complaints] = await db.query(
      'SELECT c.*, u.email, u.name, u.id AS citizen_id FROM complaints c JOIN users u ON c.user_id = u.id WHERE c.complaint_id = ?',
      [complaintId]
    );

    if (complaints.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const complaint = complaints[0];

    const newStatus = status || complaint.status;
    const newDept = department_id !== undefined ? department_id : complaint.department_id;
    const newRemarks = remarks || complaint.remarks;
    const newPriority = priority || complaint.priority;

    // Update in DB
    await db.query(
      `UPDATE complaints 
       SET status = ?, department_id = ?, remarks = ?, priority = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE complaint_id = ?`,
      [newStatus, newDept, newRemarks, newPriority, complaintId]
    );

    // Log Activity
    await db.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [updaterId, 'complaint_updated', `Complaint ${complaintId} status changed to ${newStatus}.`]
    );

    // Create system notification for reporting citizen
    const alertMsg = `Update on Complaint ${complaintId}: Status is now [${newStatus.toUpperCase()}]. Remarks: ${newRemarks.substring(0, 80)}`;
    await createSystemNotification(complaint.citizen_id, alertMsg, newStatus === 'Resolved' ? 'success' : 'info');

    // Trigger FCM background push notification to citizen
    await notifyUserPush(
      complaint.citizen_id, 
      'Complaint Status Updated', 
      `Your complaint ${complaintId} has been updated to: ${newStatus}.`,
      { complaint_id: complaintId }
    );

    // Send email alert via Nodemailer SMTP
    try {
      const emailHtml = templates.statusUpdate(complaint.name, complaintId, complaint.title, newStatus, newRemarks);
      await sendMail(complaint.email, `[Update] SmartCity Complaint ${complaintId} - ${newStatus}`, emailHtml);
    } catch (mailErr) {
      console.warn('[Nodemailer Status Update Warning] Failed email relay:', mailErr.message);
    }

    console.log(`[Complaint Controller] Updated complaint ${complaintId} to Status: ${newStatus}`);

    return res.status(200).json({
      success: true,
      message: 'Complaint updated and notifications dispatched successfully!',
      updated_data: {
        complaint_id: complaintId,
        status: newStatus,
        department_id: newDept,
        remarks: newRemarks,
        priority: newPriority
      }
    });
  } catch (err) {
    console.error('[Complaint Controller Error] Update failed:', err);
    return res.status(500).json({ success: false, message: 'Server error while updating complaint.', error: err.message });
  }
};

// DELETE /api/complaints/:id (Delete complaint record)
exports.deleteComplaint = async (req, res) => {
  const complaintId = req.params.id;
  const { role, id: adminId } = req.user;

  if (role !== 'administrator') {
    return res.status(403).json({ success: false, message: 'Forbidden. Admin access required.' });
  }

  try {
    const [result] = await db.query('DELETE FROM complaints WHERE complaint_id = ?', [complaintId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    // Log Activity
    await db.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [adminId, 'complaint_deleted', `Complaint ${complaintId} deleted from database.`]
    );

    console.log(`[Complaint Controller] Admin deleted complaint ${complaintId}`);

    return res.status(200).json({
      success: true,
      message: `Complaint ${complaintId} successfully deleted from archive.`
    });
  } catch (err) {
    console.error('[Complaint Controller Error] Delete failed:', err);
    return res.status(500).json({ success: false, message: 'Server error while deleting complaint.' });
  }
};

// POST /api/complaints/:id/comments (Add direct comments)
exports.addComment = async (req, res) => {
  const complaintId = req.params.id;
  const { comment } = req.body;
  const userId = req.user.id;

  if (!comment || !comment.trim()) {
    return res.status(400).json({ success: false, message: 'Please write a comment message.' });
  }

  try {
    // Insert comment into MySQL
    const [result] = await db.query(
      'INSERT INTO complaint_comments (complaint_id, user_id, comment) VALUES (?, ?, ?)',
      [complaintId, userId, comment]
    );

    console.log(`[Complaint Comments] Added comment ID ${result.insertId} on case ${complaintId}`);

    // Retrieve inserted comment with author details
    const [newComment] = await db.query(
      `SELECT cc.*, u.name AS author_name, u.role AS author_role, u.avatar AS author_avatar 
       FROM complaint_comments cc
       JOIN users u ON cc.user_id = u.id
       WHERE cc.comment_id = ?`,
      [result.insertId]
    );

    return res.status(251).json({
      success: true,
      message: 'Comment posted successfully.',
      comment: newComment[0]
    });
  } catch (err) {
    console.error('[Complaint Comments Error] Insertion failed:', err);
    return res.status(500).json({ success: false, message: 'Server error while posting comment.' });
  }
};

// GET /api/complaints/:id/comments (Get direct comments thread)
exports.getComments = async (req, res) => {
  const complaintId = req.params.id;

  try {
    const [comments] = await db.query(
      `SELECT cc.*, u.name AS author_name, u.role AS author_role, u.avatar AS author_avatar 
       FROM complaint_comments cc
       JOIN users u ON cc.user_id = u.id
       WHERE cc.complaint_id = ? 
       ORDER BY cc.created_at ASC`,
      [complaintId]
    );

    return res.status(200).json({
      success: true,
      comments
    });
  } catch (err) {
    console.error('[Complaint Comments Error] Fetch failed:', err);
    return res.status(500).json({ success: false, message: 'Server error while retrieving comments thread.' });
  }
};
