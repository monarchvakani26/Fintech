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
  const userId = user.user_id || user.id; // support both MongoDB users and seed users
  const allTxns = store.getTransactions(userId);

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

  // For balance/trustScore, prefer store user (seed users), fall back to req.user (MongoDB)
  const storeUser = store.findUserById(userId);
  const balance = storeUser?.balance ?? user.financial?.estimated_balance ?? 500000;
  const trustScore = storeUser?.trustScore ?? user.risk?.trust_score ?? 70;
  const trustStatus = storeUser?.trustStatus ?? 'MODERATE';

  res.json({
    success: true,
    data: {
      balance,
      balanceChange: '+12.5',
      balanceTrend,
      trustScore,
      trustStatus,
      anomalyCount: reviewCount + blockedCount,
      portfolioVariance: '99.9%',
      recentTransactions,
      totalTransactions: totalCount,
      approvedCount,
      reviewCount,
      blockedCount,
      userName: user.name,
      userAvatar: user.avatar || (user.name ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'U'),
    },
  });
});

module.exports = router;
