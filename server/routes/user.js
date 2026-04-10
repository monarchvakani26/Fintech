// ============================================================
// Rakshak AI — User Data Collection Routes
// POST /api/user/create
// POST /api/user/update-profile
// POST /api/user/update-behavior
// POST /api/user/biometric-register
// GET  /api/user/dashboard-data/:userId
// ============================================================

'use strict';

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const User = require('../models/User');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');
const { recalculateRisk, haversine } = require('../services/riskEngine');
const { emitUserUpdate, emitRiskUpdate } = require('../socket');

// ─── Helper: safe user object for client ────────────────────
function safeUser(user) {
  const obj = user.toObject ? user.toObject({ virtuals: true }) : { ...user };
  delete obj.password_hash;
  if (obj.biometric) {
    obj.biometric = {
      enabled: obj.biometric.enabled,
      embedding_model: obj.biometric.embedding_model,
      last_verified: obj.biometric.last_verified,
      verification_confidence: obj.biometric.verification_confidence,
      has_embedding: !!(obj.biometric.face_embedding?.length > 0),
    };
  }
  return obj;
}

// ═══════════════════════════════════════════════════════════════
// POST /api/user/create  — Create a new user from form data
// ═══════════════════════════════════════════════════════════════
router.post('/create', async (req, res) => {
  try {
    const { name, email, phone, password, financial, location, device } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    // Build user document
    const userData = {
      user_id: userId,
      name,
      email: email.toLowerCase().trim(),
      phone: phone || undefined,
      password_hash,
      status: 'ACTIVE',
      risk: { trust_score: 50, risk_level: 'MEDIUM' },
    };

    // Financial profile
    if (financial) {
      userData.financial = {
        card_last4: financial.card_last4,
        card_type: financial.card_type,
        bank_name: financial.bank_name,
        avg_balance: financial.avg_balance || 0,
      };
    }

    // Location profile
    if (location) {
      userData.location = {
        home_location: {
          lat: location.lat,
          lng: location.lng,
          city: location.city,
          country: location.country || 'India',
          geo: {
            type: 'Point',
            coordinates: [location.lng || 0, location.lat || 0],
          },
        },
        last_location: {
          lat: location.lat,
          lng: location.lng,
          geo: {
            type: 'Point',
            coordinates: [location.lng || 0, location.lat || 0],
          },
          timestamp: new Date(),
        },
      };
    }

    // Device profile
    if (device) {
      const fpHash = crypto.createHash('sha256').update(device.fingerprint || device.userAgent || 'unknown').digest('hex');
      userData.devices = {
        trusted_devices: [{
          device_id: uuidv4(),
          device_type: device.platform?.includes('Win') ? 'DESKTOP' :
                       device.platform?.includes('Mac') ? 'DESKTOP' :
                       device.platform?.includes('iPhone') ? 'MOBILE' :
                       device.platform?.includes('Android') ? 'MOBILE' : 'OTHER',
          os: device.platform || 'Unknown',
          browser: device.browser || 'Unknown',
          fingerprint: fpHash,
          first_seen: new Date(),
          last_seen: new Date(),
          trusted: true,
        }],
        last_used_device: fpHash,
      };
    }

    const user = await User.create(userData);

    // Recalculate risk
    const riskResult = recalculateRisk(user);
    user.risk.trust_score = riskResult.trust_score;
    user.risk.risk_level = riskResult.risk_level;
    user.risk.score_updated_at = new Date();
    await user.save();

    const token = jwt.sign({ userId: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    // Emit real-time event
    emitUserUpdate(user.user_id, 'profile', safeUser(user));

    return res.status(201).json({
      success: true,
      token,
      user: safeUser(user),
      message: 'User created successfully',
    });
  } catch (err) {
    console.error('[user/create]', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/user/update-profile — Update user profile data
// Handles: basic info, financial, location, device updates
// ═══════════════════════════════════════════════════════════════
router.post('/update-profile', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { section, data } = req.body;

    if (!section || !data) {
      return res.status(400).json({ success: false, message: 'section and data are required' });
    }

    switch (section) {
      case 'basic': {
        if (data.name) user.name = data.name;
        if (data.phone) user.phone = data.phone;
        break;
      }

      case 'financial': {
        user.financial.card_last4 = data.card_last4 || user.financial.card_last4;
        user.financial.card_type = data.card_type || user.financial.card_type;
        user.financial.bank_name = data.bank_name || user.financial.bank_name;
        user.financial.avg_balance = data.avg_balance ?? user.financial.avg_balance;
        break;
      }

      case 'location': {
        if (data.lat !== undefined && data.lng !== undefined) {
          user.location.last_location = {
            lat: data.lat,
            lng: data.lng,
            geo: { type: 'Point', coordinates: [data.lng, data.lat] },
            timestamp: new Date(),
          };

          // If setting home location
          if (data.setAsHome) {
            user.location.home_location = {
              lat: data.lat,
              lng: data.lng,
              city: data.city || '',
              country: data.country || 'India',
              geo: { type: 'Point', coordinates: [data.lng, data.lat] },
            };
          }

          // Add city to usual locations
          if (data.city && !user.location.usual_locations.includes(data.city)) {
            user.location.usual_locations.push(data.city);
          }
        }
        break;
      }

      case 'device': {
        if (data.fingerprint) {
          const fpHash = crypto.createHash('sha256').update(data.fingerprint).digest('hex');
          user.upsertTrustedDevice({
            device_id: uuidv4(),
            device_type: data.platform?.includes('Win') ? 'DESKTOP' :
                         data.platform?.includes('Mac') ? 'DESKTOP' :
                         data.platform?.includes('iPhone') ? 'MOBILE' :
                         data.platform?.includes('Android') ? 'MOBILE' : 'OTHER',
            os: data.platform || 'Unknown',
            browser: data.browser || 'Unknown',
            fingerprint: fpHash,
            trusted: true,
          });
        }
        break;
      }

      default:
        return res.status(400).json({ success: false, message: `Unknown section: ${section}` });
    }

    // Recalculate risk
    const riskResult = recalculateRisk(user);
    user.risk.trust_score = riskResult.trust_score;
    user.risk.risk_level = riskResult.risk_level;
    user.risk.score_updated_at = new Date();

    await user.save();

    // Emit real-time updates
    emitUserUpdate(user.user_id, section, safeUser(user));
    emitRiskUpdate(user.user_id, {
      trust_score: riskResult.trust_score,
      risk_level: riskResult.risk_level,
      factors: riskResult.factors,
    });

    return res.json({
      success: true,
      user: safeUser(user),
      risk: riskResult,
      message: `${section} updated successfully`,
    });
  } catch (err) {
    console.error('[user/update-profile]', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/user/update-behavior — Update behavioral metrics
// ═══════════════════════════════════════════════════════════════
router.post('/update-behavior', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { typing_speed_avg, session_duration_avg, active_hours, time_of_activity } = req.body;

    if (typing_speed_avg !== undefined) {
      // Exponential moving average
      const prev = user.behavioral.typing_speed_avg || 0;
      user.behavioral.typing_speed_avg = prev === 0
        ? typing_speed_avg
        : prev * 0.7 + typing_speed_avg * 0.3;
    }

    if (session_duration_avg !== undefined) {
      const prev = user.behavioral.session_duration_avg || 0;
      user.behavioral.session_duration_avg = prev === 0
        ? session_duration_avg
        : prev * 0.7 + session_duration_avg * 0.3;
    }

    if (active_hours) {
      user.behavioral.usual_active_hours = {
        start: active_hours.start ?? user.behavioral.usual_active_hours.start,
        end: active_hours.end ?? user.behavioral.usual_active_hours.end,
      };
    }

    // Recalculate risk
    const riskResult = recalculateRisk(user);
    user.risk.trust_score = riskResult.trust_score;
    user.risk.risk_level = riskResult.risk_level;
    user.risk.score_updated_at = new Date();

    await user.save();

    // Emit real-time updates
    emitUserUpdate(user.user_id, 'behavior', safeUser(user));
    emitRiskUpdate(user.user_id, {
      trust_score: riskResult.trust_score,
      risk_level: riskResult.risk_level,
      factors: riskResult.factors,
    });

    return res.json({
      success: true,
      user: safeUser(user),
      risk: riskResult,
      message: 'Behavioral data updated',
    });
  } catch (err) {
    console.error('[user/update-behavior]', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/user/biometric-register — Register face embedding
// ═══════════════════════════════════════════════════════════════
router.post('/biometric-register', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { face_embedding, embedding_model, confidence } = req.body;

    if (!face_embedding || !Array.isArray(face_embedding)) {
      return res.status(400).json({ success: false, message: 'face_embedding array is required' });
    }
    if (![128, 512].includes(face_embedding.length)) {
      return res.status(400).json({
        success: false,
        message: `face_embedding must be 128 or 512 dimensions, got ${face_embedding.length}`,
      });
    }

    user.biometric = {
      enabled: true,
      face_embedding,
      embedding_model: embedding_model || 'face-api.js',
      last_verified: new Date(),
      verification_confidence: confidence || 0.95,
    };
    user.security.biometric_enabled = true;

    // Recalculate risk
    const riskResult = recalculateRisk(user);
    user.risk.trust_score = riskResult.trust_score;
    user.risk.risk_level = riskResult.risk_level;
    user.risk.score_updated_at = new Date();

    await user.save();

    // Emit real-time updates
    emitUserUpdate(user.user_id, 'biometric', safeUser(user));
    emitRiskUpdate(user.user_id, {
      trust_score: riskResult.trust_score,
      risk_level: riskResult.risk_level,
      factors: riskResult.factors,
    });

    return res.json({
      success: true,
      user: safeUser(user),
      risk: riskResult,
      message: 'Biometric data registered successfully',
    });
  } catch (err) {
    console.error('[user/biometric-register]', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/user/dashboard-data/:userId — Get full user data for dashboard
// ═══════════════════════════════════════════════════════════════
router.get('/dashboard-data/:userId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.params.userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Calculate distance from home
    let distanceFromHome = null;
    if (user.location?.home_location?.lat && user.location?.last_location?.lat) {
      distanceFromHome = haversine(
        user.location.home_location.lat, user.location.home_location.lng,
        user.location.last_location.lat, user.location.last_location.lng
      );
    }

    const dashboardData = {
      ...safeUser(user),
      computed: {
        distanceFromHome: distanceFromHome ? `${distanceFromHome.toFixed(1)} km` : 'N/A',
        trustedDeviceCount: (user.devices?.trusted_devices || []).filter(d => d.trusted).length,
        totalDevices: (user.devices?.trusted_devices || []).length,
        profileCompleteness: calculateCompleteness(user),
      },
    };

    return res.json({ success: true, data: dashboardData });
  } catch (err) {
    console.error('[user/dashboard-data]', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

// ─── Helper: profile completeness % ─────────────────────────
function calculateCompleteness(user) {
  let filled = 0;
  let total = 0;

  // Basic
  total += 3;
  if (user.name) filled++;
  if (user.email) filled++;
  if (user.phone) filled++;

  // Financial
  total += 4;
  if (user.financial?.card_last4) filled++;
  if (user.financial?.card_type) filled++;
  if (user.financial?.bank_name) filled++;
  if (user.financial?.avg_balance > 0) filled++;

  // Location
  total += 2;
  if (user.location?.home_location?.lat) filled++;
  if (user.location?.last_location?.lat) filled++;

  // Device
  total += 1;
  if (user.devices?.trusted_devices?.length > 0) filled++;

  // Biometric
  total += 1;
  if (user.biometric?.enabled) filled++;

  return Math.round((filled / total) * 100);
}

module.exports = router;
