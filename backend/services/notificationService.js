const db = require('../config/db');
const { sendSinglePush, sendMulticastPush } = require('../config/firebase');

/**
 * Log a notification in the MySQL database (Notification History)
 * @param {number} userId - ID of target user
 * @param {string} message - Text body
 * @param {string} [type] - Alert category ('info', 'success', 'warning', 'alert')
 */
const logNotificationHistory = async (userId, message, type = 'info') => {
  try {
    const [result] = await db.query(
      'INSERT INTO notifications (user_id, message, type, is_read, created_at) VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)',
      [userId, message, type]
    );
    console.log(`[Notification DB] Registered alert ID ${result.insertId} for User ${userId}`);
    return result.insertId;
  } catch (err) {
    console.error('[Notification DB Error] Failed logging system notification:', err.message);
  }
};

/**
 * Register an FCM device token in the database
 * @param {number} userId - ID of user
 * @param {string} token - FCM Registration Token
 * @param {string} [platform] - Platform category ('web', 'android', 'ios')
 */
const registerDeviceToken = async (userId, token, platform = 'web') => {
  if (!userId || !token) return { success: false, message: 'Missing user_id or token.' };

  try {
    // Clean up if this token was already assigned to another user or exists
    await db.query('DELETE FROM device_tokens WHERE token = ?', [token]);

    // Insert new registration record
    await db.query(
      'INSERT INTO device_tokens (user_id, token, platform) VALUES (?, ?, ?)',
      [userId, token, platform]
    );

    console.log(`[FCM Database] Saved token for User ${userId} on platform: ${platform}`);
    return { success: true, message: 'FCM Token registered successfully.' };
  } catch (err) {
    console.error('[FCM Database Error] Registration failed:', err.message);
    throw err;
  }
};

/**
 * Remove/delete a registered device token (e.g. on user logout)
 * @param {string} token - FCM Token to delete
 */
const removeDeviceToken = async (token) => {
  try {
    const [result] = await db.query('DELETE FROM device_tokens WHERE token = ?', [token]);
    console.log(`[FCM Database] Removed token. Rows affected: ${result.affectedRows}`);
    return { success: true };
  } catch (err) {
    console.error('[FCM Database Error] Token removal failed:', err.message);
    throw err;
  }
};

/**
 * Fetch all active FCM device tokens for a specific user
 * @param {number} userId - ID of user
 */
const getUserTokens = async (userId) => {
  try {
    const [rows] = await db.query('SELECT token FROM device_tokens WHERE user_id = ?', [userId]);
    return rows.map(r => r.token);
  } catch (err) {
    console.error('[FCM Database Error] Token fetch failed:', err.message);
    return [];
  }
};

/**
 * Retrieve active tokens for a specific user role (e.g., all Admins or Officers)
 * @param {string} role - Role category
 */
const getRoleTokens = async (role) => {
  try {
    const [rows] = await db.query(
      'SELECT dt.token FROM device_tokens dt JOIN users u ON dt.user_id = u.id WHERE u.role = ?',
      [role]
    );
    return rows.map(r => r.token);
  } catch (err) {
    console.error(`[FCM Database Error] Role token fetch failed:`, err.message);
    return [];
  }
};

/**
 * Send target notifications to a citizen user (History Log + Push Notification)
 * @param {number} userId - Target User ID
 * @param {string} title - Push Title
 * @param {string} body - Push Body
 * @param {object} [extraData] - Optional metadata
 * @param {string} [type] - Notification type
 */
const notifyUser = async (userId, title, body, extraData = {}, type = 'info') => {
  try {
    // 1. Log in database history
    await logNotificationHistory(userId, body, type);

    // 2. Fetch target device tokens
    const tokens = await getUserTokens(userId);
    if (tokens.length === 0) {
      console.log(`[FCM Dispatch] User ${userId} has no active device tokens. Push skipped, logged to database.`);
      return;
    }

    // 3. Dispatch Push
    if (tokens.length === 1) {
      await sendSinglePush(tokens[0], title, body, extraData);
    } else {
      await sendMulticastPush(tokens, title, body, extraData);
    }
  } catch (err) {
    console.error('[Notification Service Error] Target notification failed:', err.message);
  }
};

/**
 * Send bulk notifications to a specific user role (e.g. all administrators)
 * @param {string} role - Role category
 * @param {string} title - Push Title
 * @param {string} body - Push Body
 * @param {object} [extraData] - Optional metadata
 */
const notifyRole = async (role, title, body, extraData = {}) => {
  try {
    // 1. Fetch all users under this role to log history
    const [users] = await db.query('SELECT id FROM users WHERE role = ?', [role]);
    for (const u of users) {
      await logNotificationHistory(u.id, body, 'info');
    }

    // 2. Fetch all role tokens
    const tokens = await getRoleTokens(role);
    if (tokens.length === 0) return;

    // 3. Dispatch multicast push
    await sendMulticastPush(tokens, title, body, extraData);
  } catch (err) {
    console.error(`[Notification Service Error] Role notification failed:`, err.message);
  }
};

module.exports = {
  logNotificationHistory,
  registerDeviceToken,
  removeDeviceToken,
  getUserTokens,
  notifyUser,
  notifyRole
};
