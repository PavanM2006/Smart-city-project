const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Import Controllers
const authController = require('../controllers/authController');
const complaintController = require('../controllers/complaintController');
const userController = require('../controllers/userController');
const departmentController = require('../controllers/departmentController');
const analyticsController = require('../controllers/analyticsController');

// Import Middlewares & Services
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { registerDeviceToken, notifyUser, notifyRole } = require('../services/notificationService');

// ==========================================
// 1. Authentication Endpoints
// ==========================================
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/logout', authenticateToken, authController.logout);
router.get('/auth/profile', authenticateToken, authController.getProfile);
router.put('/auth/profile', authenticateToken, authController.updateProfile);
router.post('/auth/change-password', authenticateToken, authController.changePassword);

// ==========================================
// 2. Complaints & Comments Endpoints
// ==========================================
router.post('/complaints', authenticateToken, complaintController.createComplaint);
router.get('/complaints', authenticateToken, complaintController.getComplaints);
router.get('/complaints/:id', authenticateToken, complaintController.getComplaintById);
router.put('/complaints/:id', authenticateToken, complaintController.updateComplaint);
router.delete('/complaints/:id', authenticateToken, authorizeRole('administrator'), complaintController.deleteComplaint);

router.post('/complaints/:id/comments', authenticateToken, complaintController.addComment);
router.get('/complaints/:id/comments', authenticateToken, complaintController.getComments);

// ==========================================
// 3. Departments Endpoints
// ==========================================
router.get('/departments', authenticateToken, departmentController.getAllDepartments);
router.post('/departments', authenticateToken, authorizeRole('administrator'), departmentController.createDepartment);
router.put('/departments/:id', authenticateToken, authorizeRole('administrator'), departmentController.updateDepartment);
router.delete('/departments/:id', authenticateToken, authorizeRole('administrator'), departmentController.deleteDepartment);

// ==========================================
// 4. Users Endpoints
// ==========================================
router.get('/users', authenticateToken, authorizeRole('administrator'), userController.getAllUsers);
router.put('/users/:id', authenticateToken, userController.updateUser);

// ==========================================
// 5. Notifications Endpoints
// ==========================================

// GET /api/notifications (Fetch notification history for citizen)
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT notification_id, message, type, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    return res.status(200).json({ success: true, notifications: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve notifications.', error: err.message });
  }
});

// POST /api/notifications/register-device
router.post('/notifications/register-device', authenticateToken, async (req, res) => {
  const { token, platform } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, message: 'FCM Token is required.' });
  }

  try {
    const result = await registerDeviceToken(req.user.id, token, platform || 'web');
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to register token.', error: err.message });
  }
});

// POST /api/notifications/send
router.post('/notifications/send', authenticateToken, async (req, res) => {
  const { user_id, title, body, data, type } = req.body;
  if (!user_id || !title || !body) {
    return res.status(400).json({ success: false, message: 'Missing user_id, title, or body.' });
  }

  try {
    await notifyUser(user_id, title, body, data || {}, type || 'info');
    return res.status(200).json({ success: true, message: 'Notification dispatched.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to dispatch notification.', error: err.message });
  }
});

// POST /api/notifications/send-bulk
router.post('/notifications/send-bulk', authenticateToken, authorizeRole('administrator'), async (req, res) => {
  const { role, title, body, data } = req.body;
  if (!role || !title || !body) {
    return res.status(400).json({ success: false, message: 'Missing role, title, or body.' });
  }

  try {
    await notifyRole(role, title, body, data || {});
    return res.status(200).json({ success: true, message: 'Bulk notifications dispatched.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to dispatch bulk notifications.', error: err.message });
  }
});

// PUT /api/notifications/:id/read
router.put('/notifications/:id/read', authenticateToken, async (req, res) => {
  const notificationId = req.params.id;
  try {
    const [result] = await db.query(
      'UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?',
      [notificationId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    return res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update notification.', error: err.message });
  }
});

// DELETE /api/notifications/:id
router.delete('/notifications/:id', authenticateToken, async (req, res) => {
  const notificationId = req.params.id;
  try {
    const [result] = await db.query(
      'DELETE FROM notifications WHERE notification_id = ? AND user_id = ?',
      [notificationId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    return res.status(200).json({ success: true, message: 'Notification deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete notification.', error: err.message });
  }
});

// ==========================================
// 6. Analytics Endpoints
// ==========================================
router.get('/analytics/dashboard', authenticateToken, analyticsController.getDashboardSummary);
router.get('/analytics/monthly', authenticateToken, analyticsController.getMonthlyTrends);
router.get('/analytics/categories', authenticateToken, analyticsController.getCategoryBreakdown);
router.get('/analytics/status', authenticateToken, analyticsController.getStatusBreakdown);

module.exports = router;
