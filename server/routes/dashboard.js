// ============================================================
// Rakshak AI - Dashboard Routes
// Aggregated metrics, balance trend, trust score
// ============================================================

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const store = require('../data/store');

// GET /api/dashboard
router.get('/', authMiddleware, (req, res) => {
  const user = req.user;
  const allTxns = store.getTransactions(user.id);

  // Balance trend (last 7 days simulated data)
  const balanceTrend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('en-IN', { weekday: 'short' });
    // Simulate balance changes
    const variance = (Math.random() - 0.3) * 500000;
    balanceTrend.push({
      day: label,
      balance: Math.max(0, user.balance + variance),
      amount: Math.floor(Math.random() * 2000000) + 100000,
    });
  }

  // Recent transactions (last 4)
  const recentTransactions = allTxns
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);

  // Stats
  const approvedCount = allTxns.filter(t => t.status === 'APPROVED').length;
  const reviewCount = allTxns.filter(t => t.status === 'REVIEW').length;
  const blockedCount = allTxns.filter(t => t.status === 'BLOCKED').length;
  const totalCount = allTxns.length;

  res.json({
    success: true,
    data: {
      balance: user.balance,
      balanceChange: '+12.5',
      balanceTrend,
      trustScore: user.trustScore,
      trustStatus: user.trustStatus,
      anomalyCount: reviewCount + blockedCount,
      portfolioVariance: '99.9%',
      recentTransactions,
      totalTransactions: totalCount,
      approvedCount,
      reviewCount,
      blockedCount,
      userName: user.name,
      userAvatar: user.avatar,
    },
  });
});

module.exports = router;
