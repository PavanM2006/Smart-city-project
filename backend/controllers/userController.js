const db = require('../config/db');

// GET /api/users (Access restricted to Administrators)
exports.getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'administrator') {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden. Only administrators can view the user registry.' 
      });
    }

    const [users] = await db.query(
      'SELECT id, name, email, role, phone, avatar, created_at FROM users ORDER BY name ASC'
    );

    return res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (err) {
    console.error('[User Controller Error] Fetch failed:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while retrieving user records.', 
      error: err.message 
    });
  }
};

// PUT /api/users/:id (Users can update their own details, admins can edit anyone)
exports.updateUser = async (req, res) => {
  const userId = parseInt(req.params.id);
  const { name, phone, avatar, role } = req.body;

  try {
    if (req.user.role !== 'administrator' && req.user.id !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden. You do not have permission to modify this profile.' 
      });
    }

    const [existing] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    const user = existing[0];
    const newName = name || user.name;
    const newPhone = phone !== undefined ? phone : user.phone;
    const newAvatar = avatar || user.avatar;
    
    let newRole = user.role;
    if (role && req.user.role === 'administrator') {
      if (['citizen', 'department_officer', 'administrator'].includes(role)) {
        newRole = role;
      } else {
        return res.status(400).json({ success: false, message: 'Invalid role assignment.' });
      }
    }

    await db.query(
      'UPDATE users SET name = ?, phone = ?, avatar = ?, role = ? WHERE id = ?',
      [newName, newPhone, newAvatar, newRole, userId]
    );

    // Log Activity
    await db.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'user_updated', `User profile ID ${userId} updated. Name: ${newName}, Role: ${newRole}`]
    );

    console.log(`[User Controller] User ID ${userId} updated. Name: ${newName}, Role: ${newRole}`);

    return res.status(200).json({
      success: true,
      message: 'User profile updated successfully!',
      user: {
        id: userId,
        name: newName,
        email: user.email,
        role: newRole,
        phone: newPhone,
        avatar: newAvatar
      }
    });
  } catch (err) {
    console.error('[User Controller Error] Update failed:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during user update.', 
      error: err.message 
    });
  }
};
