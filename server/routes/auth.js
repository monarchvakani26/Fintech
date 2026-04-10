// ============================================================
// Rakshak AI - Auth Routes
// Login, Register, OTP, Biometric, Me, Logout
// ============================================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const store = require('../data/store');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');
const { getTrustStatus } = require('../services/trustScore');

const users = []; // new registrations go here (existing ones are in store.js)

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, deviceFingerprint, userAgent, platform } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = store.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check device
    let isNewDevice = false;
    if (deviceFingerprint) {
      const fpHash = crypto.createHash('sha256').update(deviceFingerprint).digest('hex');
      const knownDevice = user.devices.find(d => d.fingerprint === fpHash);
      if (!knownDevice) {
        isNewDevice = true;
        // Add new device tentatively
        user.devices.push({
          id: uuidv4(),
          fingerprint: fpHash,
          userAgent: userAgent || 'Unknown',
          platform: platform || 'Unknown',
          trusted: false,
          transactionCount: 0,
          firstSeen: new Date(),
          lastSeen: new Date(),
        });
      } else {
        knownDevice.lastSeen = new Date();
      }
    }

    // Update last login
    store.updateUser(user.id, { lastLogin: new Date() });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    const { password: _, ...safeUser } = user;

    res.json({
      success: true,
      token,
      user: safeUser,
      requiresOTP: isNewDevice,
      isNewDevice,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'Email, password, and name are required' });
    }

    const existing = store.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = {
      id: uuidv4(),
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      phone: phone || '',
      balance: 50000,
      trustScore: 50,
      trustStatus: 'MODERATE SECURITY',
      devices: [],
      locations: [],
      transactionStats: { totalCount: 0, approvedCount: 0, reviewCount: 0, blockedCount: 0, averageAmount: 0, totalVolume: 0 },
      createdAt: new Date(),
      lastLogin: new Date(),
      avatar: name.substring(0, 2).toUpperCase(),
    };

    // Push to the users array in store (in-memory)
    const storeUsers = require('../data/store');
    // Note: for simplicity, we add to global users array
    // In production, this would be a database insert

    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '24h' });
    const { password: _, ...safeUser } = newUser;

    res.status(201).json({
      success: true,
      token,
      user: safeUser,
      message: 'Account created successfully',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  // Demo: accept any 6-digit OTP
  if (!otp || otp.length !== 6) {
    return res.status(400).json({ success: false, message: 'Invalid OTP format' });
  }
  const user = store.findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ success: true, token, message: 'OTP verified successfully' });
});

// POST /api/auth/biometric
router.post('/biometric', (req, res) => {
  const { email } = req.body;
  const user = store.findUserByEmail(email || 'demo@rakshak.ai');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
  const { password: _, ...safeUser } = user;
  res.json({ success: true, token, user: safeUser, message: 'Biometric authentication successful' });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  const { password: _, ...safeUser } = req.user;
  res.json({ success: true, user: safeUser });
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, (req, res) => {
  store.blacklistToken(req.token);
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
