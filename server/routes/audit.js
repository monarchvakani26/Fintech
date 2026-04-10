// ============================================================
// Rakshak AI - Audit Trail Routes
// Full audit with filtering, metrics, CSV export
// ============================================================

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const store = require('../data/store');

// GET /api/audit
router.get('/', authMiddleware, (req, res) => {
  const { page = 1, limit = 15, status, riskLevel, search, dateFrom, dateTo, minAmount, maxAmount, sortBy, sortOrder } = req.query;

  const allTxns = store.getTransactions(req.user.id, {
    status: status && status !== 'ALL' ? status : undefined,
    search,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount,
    riskLevel: riskLevel && riskLevel !== 'ALL' ? riskLevel : undefined,
    sortBy: sortBy || 'createdAt',
    sortOrder: sortOrder || 'desc',
  });

  const total = allTxns.length;
  const totalPages = Math.ceil(total / Number(limit));
  const start = (Number(page) - 1) * Number(limit);
  const paginated = allTxns.slice(start, start + Number(limit));

  const allUserTxns = store.getTransactions(req.user.id);
  const riskFlagged = allUserTxns.filter(t => t.status === 'REVIEW' || t.status === 'BLOCKED').length;

  res.json({
    success: true,
    transactions: paginated,
    pagination: { page: Number(page), limit: Number(limit), total, totalPages },
    metrics: {
      totalMonitored: allUserTxns.length,
      riskFlagged,
      systemHealth: 'Sovereign Active',
    },
  });
});

// GET /api/audit/export
router.get('/export', authMiddleware, (req, res) => {
  const { format = 'csv', status, search } = req.query;

  const txns = store.getTransactions(req.user.id, {
    status: status && status !== 'ALL' ? status : undefined,
    search,
  });

  if (format === 'csv') {
    const headers = ['Reference', 'Date', 'Recipient', 'Type', 'Amount (INR)', 'Status', 'Risk Score', 'Risk Factors', 'Transaction Hash'];
    const rows = txns.map(t => [
      t.reference,
      new Date(t.createdAt).toISOString(),
      t.recipient.name,
      t.type,
      t.amount,
      t.status,
      t.riskAnalysis?.riskScore || 0,
      (t.riskAnalysis?.riskFactors || []).join('; '),
      t.transactionHash || '',
    ]);

    const csv = [headers, ...rows].map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="rakshak-audit-trail.csv"');
    res.send(csv);
  } else {
    res.status(400).json({ success: false, message: 'Only CSV export is supported in demo mode' });
  }
});

module.exports = router;
