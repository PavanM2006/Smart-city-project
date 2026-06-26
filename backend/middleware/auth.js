const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware to verify the JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access Denied. Authorization token required. Please log in.' 
    });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key_2026');
    req.user = verified; // Payload contains: id, name, email, role
    next();
  } catch (err) {
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired authorization token.' 
    });
  }
};

// Middleware to enforce specific role permissions
const authorizeRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const userRole = req.user.role;

    // Check against authorized roles: citizen, department_officer, administrator
    if (userRole !== requiredRole) {
      return res.status(403).json({ 
        success: false, 
        message: `Forbidden. This action requires '${requiredRole}' permissions. Your role: '${userRole}'` 
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRole
};
