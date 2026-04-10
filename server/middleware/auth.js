// ============================================================
// Rakshak AI - Auth Middleware
// JWT verification — looks up users from MongoDB
// ============================================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const tokenBlacklist = require('../utils/tokenBlacklist');

const JWT_SECRET = process.env.JWT_SECRET || 'rakshak-ai-sovereign-secret-256bit-key-change-in-prod';

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No authorization token provided' });
  }

  const token = authHeader.split(' ')[1];

  if (tokenBlacklist && tokenBlacklist.has(token)) {
    return res.status(401).json({ success: false, message: 'Token has been invalidated. Please login again.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ user_id: decoded.userId });
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

module.exports = { authMiddleware, JWT_SECRET };

