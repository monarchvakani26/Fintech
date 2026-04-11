// ============================================================
// Rakshak AI - Payment Routes
// Initiate, Analyze, Result
// ============================================================

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../middleware/auth');
const store = require('../data/store');
const { analyzeFraud } = require('../services/fraudEngine');
const { updateTrustScoreAfterTransaction } = require('../services/trustScore');
const blockchain = require('../services/blockchain');
const User = require('../models/User');
const { emitTransactionUpdate, emitRiskUpdate } = require('../socket');

// In-memory OTP store { userId -> { otp, expiresAt } }
const otpStore = new Map();

// Cosine similarity for face embedding comparison
function cosineSimilarity(a, b) {
  if (a.length !== b.length) return 0;
  const dot = a.reduce((s, ai, i) => s + ai * b[i], 0);
  const magA = Math.sqrt(a.reduce((s, ai) => s + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((s, bi) => s + bi * bi, 0));
  if (!magA || !magB) return 0;
  return dot / (magA * magB);
}

// POST /api/payments/initiate
router.post('/initiate', authMiddleware, async (req, res) => {
  try {
    const { recipientVPA, amount, note, deviceFingerprint, location } = req.body;
    const user = req.user;
    const userId = user.user_id || user.id; // support both MongoDB and seed users

    // Validation
    if (!recipientVPA) return res.status(400).json({ success: false, message: 'Recipient VPA is required' });
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Valid amount is required' });

    // Check balance from store (seed user) or use a large default for MongoDB users
    const storeUser = store.findUserById(userId);
    if (storeUser && amount > storeUser.balance) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    // ── CARD VALIDATION — must have card details from DataCollection ──
    // For MongoDB users (non-seed), require card details to be set
    if (!storeUser) {
      const mongoUser = req.user; // already attached by authMiddleware
      const hasCard = mongoUser?.financial?.card_last4 && mongoUser?.financial?.card_type;
      if (!hasCard) {
        return res.status(400).json({
          success: false,
          message: 'Payment blocked: Please add your card details in the Data Collection page before making a payment.',
          code: 'CARD_NOT_REGISTERED',
        });
      }
    }

    // Create pending transaction
    const txnId = uuidv4();
    const reference = store.genRef();
    const transaction = {
      id: txnId,
      userId,
      reference,
      recipient: {
        vpa: recipientVPA,
        name: recipientVPA.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        icon: '👤',
        onWatchlist: store.isOnWatchlist(recipientVPA),
      },
      type: 'External Transfer',
      amount: Number(amount),
      currency: 'INR',
      note: note || '',
      status: 'PENDING',
      riskAnalysis: null,
      transactionHash: null,
      metadata: {
        userTrustScoreAtTime: storeUser?.trustScore || user.risk?.trust_score || 70,
        userBalanceAtTime: storeUser?.balance || 500000,
        sessionId: uuidv4(),
        transactionHour: new Date().getHours(),
      },
      createdAt: new Date(),
      processedAt: null,
    };

    store.addTransaction(transaction);

    res.json({
      success: true,
      transactionId: txnId,
      reference,
      status: 'PENDING_ANALYSIS',
      message: 'Transaction initiated. Running fraud analysis...',
    });
  } catch (err) {
    console.error('Payment initiate error:', err);
    res.status(500).json({ success: false, message: 'Failed to initiate transaction' });
  }
});

// POST /api/payments/analyze/:transactionId
router.post('/analyze/:transactionId', authMiddleware, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const user = req.user;
    const userId = user.user_id || user.id; // always use custom string ID
    const ip = req.ip || req.headers['x-forwarded-for'] || '103.21.58.1';

    const transaction = store.findTransactionById(transactionId);
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
    if (transaction.userId !== userId) return res.status(403).json({ success: false, message: 'Unauthorized' });

    const { deviceFingerprint, userAgent, platform, screenResolution, timezone, country, city, gateVerification } = req.body;

    // Run fraud analysis, passing gate verification results for accurate scoring
    const analysis = await analyzeFraud({
      userId,
      amount: transaction.amount,
      recipientVPA: transaction.recipient.vpa,
      recipientName: transaction.recipient.name,
      deviceFingerprint: deviceFingerprint || 'trusted-device-001',
      userAgent,
      platform,
      screenResolution,
      timezone,
      ip: ip === '::1' ? '103.21.58.1' : ip,
      country: country || 'India',
      city: city || 'Mumbai',
      gateVerification: gateVerification || {},
    });

    // Generate blockchain hash
    const transactionHash = store.generateTxHash({
      userId,
      recipientVPA: transaction.recipient.vpa,
      amount: transaction.amount,
      timestamp: transaction.createdAt.toISOString(),
      deviceFingerprint: analysis.deviceInfo.fingerprint,
      nonce: uuidv4(),
    });

    // Update transaction
    const updated = store.updateTransaction(transactionId, {
      status: analysis.decision,
      riskAnalysis: analysis,
      transactionHash,
      processedAt: new Date(),
      'recipient.onWatchlist': store.isOnWatchlist(transaction.recipient.vpa),
    });

    // Add to blockchain
    const blockchainBlock = blockchain.addBlock({
      transactionId: transactionId,
      amount: transaction.amount,
      sender: userId,
      receiver: transaction.recipient.vpa,
      status: analysis.decision,
      riskScore: analysis.riskScore,
      reference: transaction.reference,
      type: transaction.type,
    });

    // Update trust score
    updateTrustScoreAfterTransaction(userId, analysis.decision);

    // Update user balance if approved (only affects in-memory seed users)
    if (analysis.decision === 'APPROVED') {
      const updatedUser = store.findUserById(userId);
      if (updatedUser && updatedUser.balance !== undefined) {
        store.updateUser(userId, { balance: updatedUser.balance - transaction.amount });
      }
    }

    // Update user stats (only affects in-memory seed users)
    const currentUser = store.findUserById(userId);
    if (currentUser && currentUser.transactionStats) {
      const stats = currentUser.transactionStats;
      const newTotal = stats.totalCount + 1;
      const newAvg = ((stats.averageAmount * stats.totalCount) + transaction.amount) / newTotal;
      store.updateUser(userId, {
        transactionStats: {
          ...stats,
          totalCount: newTotal,
          approvedCount: stats.approvedCount + (analysis.decision === 'APPROVED' ? 1 : 0),
          reviewCount: stats.reviewCount + (analysis.decision === 'REVIEW' ? 1 : 0),
          blockedCount: stats.blockedCount + (analysis.decision === 'BLOCKED' ? 1 : 0),
          averageAmount: Math.round(newAvg),
          totalVolume: stats.totalVolume + transaction.amount,
        },
      });
    }

    // ── REAL-TIME: broadcast transaction to dashboard via Socket.IO ──
    try {
      emitTransactionUpdate(userId, updated);
      emitRiskUpdate(userId, {
        userId,
        decision: analysis.decision,
        riskScore: analysis.riskScore,
        amount: transaction.amount,
        reference: updated.reference,
      });
    } catch (e) {
      console.warn('[Socket] emit failed:', e.message);
    }

    res.json({
      success: true,
      decision: analysis.decision,
      riskScore: analysis.riskScore,
      riskFactors: analysis.riskFactors,
      analysisDetails: analysis.breakdown,
      aiConsensus: analysis.aiConsensus.summary,
      aiConsensusDetails: analysis.aiConsensus,
      explainableAI: analysis.explainableAI,
      transactionHash,
      comparisonMatrix: analysis.comparisonMatrix,
      deviceInfo: analysis.deviceInfo,
      locationInfo: analysis.locationInfo,
      analysisSteps: analysis.analysisSteps,
      transaction: updated,
    });
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ success: false, message: 'Fraud analysis failed' });
  }
});

// GET /api/payments/result/:transactionId
router.get('/result/:transactionId', authMiddleware, (req, res) => {
  const transaction = store.findTransactionById(req.params.transactionId);
  if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });

  // Support both MongoDB users (user_id) and in-memory seed users (id)
  const requestingUserId = req.user.user_id || req.user.id;
  if (transaction.userId !== requestingUserId) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  res.json({ success: true, transaction });
});

// ═══════════════════════════════════════════════════════════
// PAYMENT GATE ENDPOINTS
// ═══════════════════════════════════════════════════════════

// GET /api/payments/gate/biometric/status — check if user has a stored embedding (fresh from DB)
router.get('/gate/biometric/status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const mongoUser = await User.findOne({ user_id: userId }).select('biometric');
    const hasEmbedding = !!(mongoUser?.biometric?.enabled && mongoUser?.biometric?.face_embedding?.length > 0);
    console.log(`[Gate/BiometricStatus] userId=${userId} hasEmbedding=${hasEmbedding}`);
    return res.json({ success: true, hasEmbedding });
  } catch (err) {
    console.error('[gate/biometric/status]', err);
    return res.status(500).json({ success: false, hasEmbedding: false });
  }
});

// POST /api/payments/gate/biometric — compare face embedding server-side
router.post('/gate/biometric', authMiddleware, async (req, res) => {
  try {
    const { faceEmbedding } = req.body;
    const userId = req.user.user_id || req.user.id;

    if (!faceEmbedding || !Array.isArray(faceEmbedding)) {
      return res.status(400).json({ success: false, message: 'faceEmbedding array required' });
    }

    // Find stored embedding from MongoDB
    const mongoUser = await User.findOne({ user_id: userId });
    const storedEmbedding = mongoUser?.biometric?.face_embedding;

    if (!storedEmbedding || storedEmbedding.length === 0) {
      // No stored embedding — cannot compare, allow with flag
      return res.json({ success: true, passed: false, confidence: 0, reason: 'no_stored_embedding' });
    }

    const similarity = cosineSimilarity(faceEmbedding, storedEmbedding);
    // face-api.js: similarity > 0.6 = same person (Euclidean threshold ~0.6)
    const passed = similarity >= 0.60;

    console.log(`[Gate/Biometric] userId=${userId} similarity=${similarity.toFixed(3)} passed=${passed}`);
    return res.json({ success: true, passed, confidence: similarity });
  } catch (err) {
    console.error('[gate/biometric]', err);
    return res.status(500).json({ success: false, message: 'Biometric verification failed' });
  }
});

// POST /api/payments/gate/otp/request — generate OTP
router.post('/gate/otp/request', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    otpStore.set(userId, { otp, expiresAt });

    console.log(`[Gate/OTP] Generated for ${userId}: ${otp}`);

    // In production: send via SMS. In demo: return in response.
    return res.json({
      success: true,
      message: 'OTP generated',
      demoCode: otp, // remove in production — for demo only
      expiresInMinutes: 10,
    });
  } catch (err) {
    console.error('[gate/otp/request]', err);
    return res.status(500).json({ success: false, message: 'OTP generation failed' });
  }
});

// POST /api/payments/gate/otp/verify — verify OTP
router.post('/gate/otp/verify', authMiddleware, (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const { otp } = req.body;
    const stored = otpStore.get(userId);

    if (!stored) {
      return res.json({ success: false, passed: false, reason: 'no_otp_found' });
    }
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(userId);
      return res.json({ success: false, passed: false, reason: 'otp_expired' });
    }
    if (stored.otp !== String(otp)) {
      return res.json({ success: false, passed: false, reason: 'wrong_otp' });
    }

    otpStore.delete(userId); // single-use
    return res.json({ success: true, passed: true });
  } catch (err) {
    console.error('[gate/otp/verify]', err);
    return res.status(500).json({ success: false, message: 'OTP verification error' });
  }
});

module.exports = router;
