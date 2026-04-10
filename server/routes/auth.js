// ============================================================
// Rakshak AI - Auth Routes
// Login, Register, OTP, Biometric, Me, Logout
// Backed by MongoDB via Mongoose User model
// ============================================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const User = require('../models/User');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');
const tokenBlacklist = require('../utils/tokenBlacklist');

// ─── helpers ────────────────────────────────────────────────

function safeUser(user) {
  const obj = user.toObject({ virtuals: true });
  delete obj.password_hash;
  if (obj.biometric) delete obj.biometric.face_embedding; // never send embeddings over wire
  return obj;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'Email, password, and name are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const user = await User.create({
      user_id: uuidv4(),
      name,
      email: email.toLowerCase().trim(),
      phone: phone || undefined,
      password_hash,
      status: 'ACTIVE',
      risk: { trust_score: 50, risk_level: 'MEDIUM' },
    });

    const token = jwt.sign({ userId: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    return res.status(201).json({
      success: true,
      token,
      user: safeUser(user),
      message: 'Account created successfully',
    });
  } catch (err) {
    console.error('[auth/register]', err);
    return res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, deviceFingerprint, userAgent, platform } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findByEmailWithPassword(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: `Account is ${user.status}` });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      // Increment failed login counter
      await User.findByIdAndUpdate(user._id, {
        $inc: { 'security.failed_login_count': 1 },
      });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Device fingerprint handling
    let isNewDevice = false;
    if (deviceFingerprint) {
      const fpHash = crypto.createHash('sha256').update(deviceFingerprint).digest('hex');
      user.upsertTrustedDevice({
        device_id: uuidv4(),
        device_type: 'MOBILE',
        os: platform || 'Unknown',
        browser: userAgent || 'Unknown',
        fingerprint: fpHash,
        trusted: false,
      });
      isNewDevice = !user.devices.trusted_devices.some(d => d.fingerprint === fpHash);
    }

    // Update security metadata
    user.security.last_login_ip = req.ip || '';
    user.security.last_login_time = new Date();
    user.security.failed_login_count = 0;
    await user.save();

    const token = jwt.sign({ userId: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    return res.json({
      success: true,
      token,
      user: safeUser(user),
      requiresOTP: isNewDevice,
      isNewDevice,
    });
  } catch (err) {
    console.error('[auth/login]', err.message);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!otp || String(otp).length !== 6) {
    return res.status(400).json({ success: false, message: 'Invalid OTP format' });
  }
  const user = await User.findByEmail(email);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  const token = jwt.sign({ userId: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
  return res.json({ success: true, token, message: 'OTP verified successfully' });
});

// POST /api/auth/biometric
router.post('/biometric', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }
  const user = await User.findByEmail(email);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  if (!user.biometric?.enabled) {
    return res.status(403).json({ success: false, message: 'Biometric authentication not enabled for this account' });
  }
  const token = jwt.sign({ userId: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
  return res.json({ success: true, token, user: safeUser(user), message: 'Biometric authentication successful' });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  return res.json({ success: true, user: safeUser(req.user) });
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, (req, res) => {
  tokenBlacklist.add(req.token);
  return res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;

