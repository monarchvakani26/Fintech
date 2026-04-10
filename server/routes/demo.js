// ============================================================
// Rakshak AI - Demo Mode Routes
// 3 pre-configured scenarios for hackathon demo
// ============================================================

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { authMiddleware } = require('../middleware/auth');
const store = require('../data/store');
const { analyzeFraud } = require('../services/fraudEngine');
const { updateTrustScoreAfterTransaction } = require('../services/trustScore');

async function createDemoTransaction(user, config) {
  const txnId = uuidv4();
  const reference = store.genRef();
  const now = new Date();

  const transaction = {
    id: txnId,
    userId: user.id,
    reference,
    recipient: config.recipient,
    type: config.type || 'External Transfer',
    amount: config.amount,
    currency: 'INR',
    note: config.note || 'Demo transaction',
    status: 'PENDING',
    riskAnalysis: null,
    transactionHash: null,
    metadata: {
      userTrustScoreAtTime: user.trustScore,
      userBalanceAtTime: user.balance,
      sessionId: uuidv4(),
      transactionHour: config.hour !== undefined ? config.hour : now.getHours(),
      isDemo: true,
    },
    createdAt: config.hour !== undefined
      ? new Date(new Date().setHours(config.hour, 30, 0, 0))
      : now,
    processedAt: null,
  };

  store.addTransaction(transaction);

  // Run analysis with demo params
  const analysis = await analyzeFraud({
    userId: user.id,
    amount: config.amount,
    recipientVPA: config.recipient.vpa,
    recipientName: config.recipient.name,
    deviceFingerprint: config.deviceFingerprint,
    userAgent: config.userAgent || 'Mozilla/5.0 Demo Browser',
    platform: config.platform || 'Demo',
    ip: config.ip || '103.21.58.1',
    country: config.country || 'India',
    city: config.city || 'Mumbai',
  });

  // Override risk score for demo determinism
  const overriddenAnalysis = {
    ...analysis,
    riskScore: config.expectedRiskScore,
    decision: config.expectedDecision,
    riskFactors: config.riskFactors || analysis.riskFactors,
    aiConsensus: {
      ...analysis.aiConsensus,
      summary: config.consensusSummary || analysis.aiConsensus.summary,
    },
  };

  const transactionHash = store.generateTxHash({
    id: txnId, nonce: uuidv4(), amount: config.amount, ts: now.toISOString(),
  });

  store.updateTransaction(txnId, {
    status: config.expectedDecision,
    riskAnalysis: overriddenAnalysis,
    transactionHash,
    processedAt: new Date(),
  });

  updateTrustScoreAfterTransaction(user.id, config.expectedDecision);

  return { transactionId: txnId, reference, analysis: overriddenAnalysis, transactionHash };
}

// POST /api/demo/safe-transaction
router.post('/safe-transaction', authMiddleware, async (req, res) => {
  try {
    const result = await createDemoTransaction(req.user, {
      amount: 5000,
      recipient: { vpa: 'rajesh.kumar@okaxis', name: 'Rajesh Kumar', icon: '👤', onWatchlist: false },
      type: 'External Transfer',
      note: 'Demo: Safe transaction',
      deviceFingerprint: 'trusted-device-001', // known trusted device
      ip: '103.21.58.1',
      country: 'India',
      city: 'Mumbai',
      hour: 14,
      expectedRiskScore: 12,
      expectedDecision: 'APPROVED',
      riskFactors: [],
      consensusSummary: '5 out of 5 AI nodes approved this transaction as safe',
    });
    res.json({ success: true, message: 'Demo safe transaction created', ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Demo transaction failed' });
  }
});

// POST /api/demo/suspicious-transaction
router.post('/suspicious-transaction', authMiddleware, async (req, res) => {
  try {
    const result = await createDemoTransaction(req.user, {
      amount: 75000,
      recipient: { vpa: 'new.vendor@ybl', name: 'New Vendor Co.', icon: '🏢', onWatchlist: false },
      type: 'SWIFT Transfer',
      note: 'Demo: Suspicious transaction',
      deviceFingerprint: 'brand-new-unknown-device-xyz-' + Date.now(), // new device
      ip: '49.36.10.1',
      country: 'India',
      city: 'Jaipur', // different city
      hour: 3, // 3:30 AM
      expectedRiskScore: 58,
      expectedDecision: 'REVIEW',
      riskFactors: [
        'New Device Fingerprint Detected',
        'Unusual Time of Transaction (Late Night)',
        'High Transaction Amount',
        'First Transaction to New Recipient',
        'Unusual Location Detected (Jaipur)',
      ],
      consensusSummary: '3 out of 5 AI nodes suggested cautionary review based on behavioral drift analysis',
    });
    res.json({ success: true, message: 'Demo suspicious transaction created', ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Demo transaction failed' });
  }
});

// POST /api/demo/fraud-transaction
router.post('/fraud-transaction', authMiddleware, async (req, res) => {
  try {
    const result = await createDemoTransaction(req.user, {
      amount: 215000,
      recipient: { vpa: 'fraud001@darkweb', name: 'Anonymous Entity', icon: '🚫', onWatchlist: true },
      type: 'Wire Transfer',
      note: 'Demo: Fraud transaction',
      deviceFingerprint: 'completely-unknown-device-fraud-' + Date.now(),
      ip: '185.220.101.45', // blacklisted VPN IP
      country: 'Netherlands',
      city: 'Amsterdam',
      hour: 3,
      expectedRiskScore: 94,
      expectedDecision: 'BLOCKED',
      riskFactors: [
        'Location Mismatch: Transaction from Netherlands (usual: India)',
        'VPN/Proxy Connection Detected',
        'IP Blacklisted on Global Fraud Registry (GF-Tier 1)',
        'Extreme Amount Variance (+892% from user average)',
        'Recipient on Sovereign Watchlist',
        'Rapid Transaction Velocity (>3 in 1 hour)',
        'New Device Fingerprint Detected',
      ],
      consensusSummary: '4 out of 5 AI nodes flagged this transaction for immediate blocking',
    });
    res.json({ success: true, message: 'Demo fraud transaction created', ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Demo transaction failed' });
  }
});

module.exports = router;
