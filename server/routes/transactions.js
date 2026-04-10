// ============================================================
// Rakshak AI - Transactions Routes
// List, Get, Approve, Block
// ============================================================

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const store = require('../data/store');
const { updateTrustScoreAfterTransaction } = require('../services/trustScore');

// GET /api/transactions
router.get('/', authMiddleware, (req, res) => {
  const { page = 1, limit = 15, status, search, dateFrom, dateTo, minAmount, maxAmount, riskLevel, sortBy, sortOrder } = req.query;

  const allTxns = store.getTransactions(req.user.id, {
    status: status !== 'ALL' ? status : undefined,
    search,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount,
    riskLevel: riskLevel !== 'ALL' ? riskLevel : undefined,
    sortBy,
    sortOrder,
  });

  const total = allTxns.length;
  const totalPages = Math.ceil(total / Number(limit));
  const start = (Number(page) - 1) * Number(limit);
  const paginated = allTxns.slice(start, start + Number(limit));

  res.json({
    success: true,
    transactions: paginated,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages,
    },
  });
});

// GET /api/transactions/:id
router.get('/:id', authMiddleware, (req, res) => {
  const txn = store.findTransactionById(req.params.id);
  if (!txn) return res.status(404).json({ success: false, message: 'Transaction not found' });
  if (txn.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Unauthorized' });
  res.json({ success: true, transaction: txn });
});

// PATCH /api/transactions/:id/approve
router.patch('/:id/approve', authMiddleware, (req, res) => {
  const txn = store.findTransactionById(req.params.id);
  if (!txn) return res.status(404).json({ success: false, message: 'Transaction not found' });
  if (txn.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Unauthorized' });
  if (txn.status !== 'REVIEW') return res.status(400).json({ success: false, message: 'Only REVIEW transactions can be manually approved' });

  const { approverNote } = req.body;
  const updated = store.updateTransaction(req.params.id, {
    status: 'APPROVED',
    reviewInfo: {
      reviewedAt: new Date(),
      reviewNote: approverNote || 'Manually approved',
      manualDecision: 'APPROVED',
    },
  });

  // Update trust score positively for manual approve
  updateTrustScoreAfterTransaction(req.user.id, 'APPROVED', true);

  res.json({ success: true, transaction: updated, message: 'Transaction approved successfully' });
});

// PATCH /api/transactions/:id/block
router.patch('/:id/block', authMiddleware, (req, res) => {
  const txn = store.findTransactionById(req.params.id);
  if (!txn) return res.status(404).json({ success: false, message: 'Transaction not found' });
  if (txn.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Unauthorized' });
  if (txn.status !== 'REVIEW') return res.status(400).json({ success: false, message: 'Only REVIEW transactions can be manually blocked' });

  const { blockReason } = req.body;

  // Add recipient to watchlist if not already there
  if (!store.isOnWatchlist(txn.recipient.vpa)) {
    store.addToWatchlist({
      vpa: txn.recipient.vpa,
      reason: blockReason || 'Manually blocked by account holder',
      reportCount: 1,
      severity: 'MEDIUM',
    });
  }

  const updated = store.updateTransaction(req.params.id, {
    status: 'BLOCKED',
    blockInfo: {
      blockReason: blockReason || 'Manually blocked',
      blockedBy: 'manual',
      blockedAt: new Date(),
    },
  });

  updateTrustScoreAfterTransaction(req.user.id, 'BLOCKED');

  res.json({ success: true, transaction: updated, message: 'Transaction blocked and recipient added to watchlist' });
});

module.exports = router;
