const db = require('../config/db');

// GET /api/departments
exports.getAllDepartments = async (req, res) => {
  try {
    const [departments] = await db.query(
      'SELECT department_id, department_name, head_officer, contact FROM departments ORDER BY department_name ASC'
    );

    return res.status(200).json({
      success: true,
      count: departments.length,
      departments
    });
  } catch (err) {
    console.error('[Department Controller Error] Fetch failed:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while retrieving department records.',
      error: err.message
    });
  }
};

// POST /api/departments (Restricted to Administrators)
exports.createDepartment = async (req, res) => {
  const { department_name, head_officer, contact } = req.body;

  if (!department_name || !head_officer || !contact) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please provide all required fields: department_name, head_officer, and contact.' 
    });
  }

  try {
    if (req.user.role !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Forbidden. Admin access required.' });
    }

    const [existing] = await db.query(
      'SELECT department_id FROM departments WHERE department_name = ?', 
      [department_name]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'A department with this name already exists.' 
      });
    }

    const [result] = await db.query(
      'INSERT INTO departments (department_name, head_officer, contact) VALUES (?, ?, ?)',
      [department_name, head_officer, contact]
    );

    // Log Activity
    await db.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'department_created', `Department ${department_name} registered successfully.`]
    );

    console.log(`[Department Controller] Created department "${department_name}". ID: ${result.insertId}`);

    return res.status(201).json({
      success: true,
      message: 'Department created successfully!',
      department: {
        department_id: result.insertId,
        department_name,
        head_officer,
        contact
      }
    });
  } catch (err) {
    console.error('[Department Controller Error] Creation failed:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during department registration.',
      error: err.message
    });
  }
};

// PUT /api/departments/:id (Restricted to Administrators)
exports.updateDepartment = async (req, res) => {
  const deptId = req.params.id;
  const { department_name, head_officer, contact } = req.body;

  try {
    if (req.user.role !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Forbidden. Admin access required.' });
    }

    const [existing] = await db.query('SELECT * FROM departments WHERE department_id = ?', [deptId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    const dept = existing[0];
    const newName = department_name || dept.department_name;
    const newHead = head_officer || dept.head_officer;
    const newContact = contact || dept.contact;

    await db.query(
      'UPDATE departments SET department_name = ?, head_officer = ?, contact = ? WHERE department_id = ?',
      [newName, newHead, newContact, deptId]
    );

    // Log Activity
    await db.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'department_updated', `Department ${newName} updated.`]
    );

    return res.status(200).json({
      success: true,
      message: 'Department updated successfully!',
      department: {
        department_id: deptId,
        department_name: newName,
        head_officer: newHead,
        contact: newContact
      }
    });
  } catch (err) {
    console.error('[Department Controller Error] Update failed:', err);
    return res.status(500).json({ success: false, message: 'Server error during department update.' });
  }
};

// DELETE /api/departments/:id (Restricted to Administrators)
exports.deleteDepartment = async (req, res) => {
  const deptId = req.params.id;

  try {
    if (req.user.role !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Forbidden. Admin access required.' });
    }

    const [result] = await db.query('DELETE FROM departments WHERE department_id = ?', [deptId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    // Log Activity
    await db.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'department_deleted', `Department ID ${deptId} deleted.`]
    );

    return res.status(200).json({
      success: true,
      message: 'Department deleted successfully!'
    });
  } catch (err) {
    console.error('[Department Controller Error] Delete failed:', err);
    return res.status(500).json({ success: false, message: 'Server error during department deletion.' });
  }
};
