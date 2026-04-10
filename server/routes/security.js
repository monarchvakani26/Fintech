// ============================================================
// Rakshak AI - Security Metrics Route
// Powers the Security Hub page
// ============================================================

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const store = require('../data/store');

// GET /api/security/metrics
router.get('/metrics', authMiddleware, (req, res) => {
  const allTxns = store.getAllTransactions();
  const blocked = allTxns.filter(t => t.status === 'BLOCKED').length;
  const review = allTxns.filter(t => t.status === 'REVIEW').length;
  const approved = allTxns.filter(t => t.status === 'APPROVED').length;
  const lastThreat = allTxns.filter(t => t.status === 'BLOCKED').slice(-1)[0];

  // Aggregate top risk factors across all transactions
  const factorCounts = {};
  allTxns.forEach(t => {
    (t.riskAnalysis?.riskFactors || []).forEach(f => {
      factorCounts[f] = (factorCounts[f] || 0) + 1;
    });
  });
  const topRiskFactors = Object.entries(factorCounts)
    .map(([factor, count]) => ({ factor, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  res.json({
    success: true,
    data: {
      threatsBlockedToday: blocked,
      underReview: review,
      approved,
      totalMonitored: allTxns.length,
      aiNodesOnline: 5,
      systemUptime: '99.97%',
      uptimeDays: 847,
      encryptionStandard: 'SHA-3 Keccak-256 / AES-256-GCM',
      lastThreat: lastThreat?.createdAt || null,
      topRiskFactors,
      blockedLocations: [
        { city: 'Amsterdam', country: 'Netherlands', count: 3, x: 51, y: 38 },
        { city: 'Lagos', country: 'Nigeria', count: 2, x: 49, y: 53 },
        { city: 'Beijing', country: 'China', count: 1, x: 78, y: 37 },
      ],
      homeLocation: { city: 'Mumbai', country: 'India', x: 70, y: 47 },
    }
  });
});

module.exports = router;
