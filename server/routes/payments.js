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

    const { deviceFingerprint, userAgent, platform, screenResolution, timezone, country, city } = req.body;

    // Run fraud analysis
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

    res.json({
      success: true,
      decision: analysis.decision,
      riskScore: analysis.riskScore,
      riskFactors: analysis.riskFactors,
      analysisDetails: analysis.breakdown,
      aiConsensus: analysis.aiConsensus.summary,
      aiConsensusDetails: analysis.aiConsensus,
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
  if (transaction.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Unauthorized' });

  res.json({ success: true, transaction });
});

module.exports = router;
