// ============================================================
// Rakshak AI - Analytics Routes (Bonus)
// Fraud trends, risk distribution, top risk factors
// ============================================================

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const store = require('../data/store');

// GET /api/analytics/fraud-trends
router.get('/fraud-trends', authMiddleware, (req, res) => {
  const txns = store.getTransactions(req.user.id);
  const days = 7;
  const dates = [];
  const approvedCount = [];
  const reviewCount = [];
  const blockedCount = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);

    const dayTxns = txns.filter(t => {
      const ct = new Date(t.createdAt);
      return ct >= d && ct < nextDay;
    });

    dates.push(d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));
    approvedCount.push(dayTxns.filter(t => t.status === 'APPROVED').length);
    reviewCount.push(dayTxns.filter(t => t.status === 'REVIEW').length);
    blockedCount.push(dayTxns.filter(t => t.status === 'BLOCKED').length);
  }

  res.json({ success: true, data: { dates, approvedCount, reviewCount, blockedCount } });
});

// GET /api/analytics/risk-distribution
router.get('/risk-distribution', authMiddleware, (req, res) => {
  const txns = store.getTransactions(req.user.id);
  const low = txns.filter(t => (t.riskAnalysis?.riskScore || 0) <= 30).length;
  const medium = txns.filter(t => (t.riskAnalysis?.riskScore || 0) > 30 && (t.riskAnalysis?.riskScore || 0) < 70).length;
  const high = txns.filter(t => (t.riskAnalysis?.riskScore || 0) >= 70).length;
  res.json({ success: true, data: { low, medium, high } });
});

// GET /api/analytics/top-risk-factors
router.get('/top-risk-factors', authMiddleware, (req, res) => {
  const txns = store.getTransactions(req.user.id);
  const factorCounts = {};
  txns.forEach(t => {
    (t.riskAnalysis?.riskFactors || []).forEach(f => {
      factorCounts[f] = (factorCounts[f] || 0) + 1;
    });
  });
  const sorted = Object.entries(factorCounts)
    .map(([factor, count]) => ({ factor, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  res.json({ success: true, data: sorted });
});

module.exports = router;
