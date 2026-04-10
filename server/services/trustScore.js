// ============================================================
// Rakshak AI - Trust Score Service
// Dynamic trust score calculation and updates
// ============================================================

const store = require('../data/store');

const TRUST_STATUS_MAP = [
  { min: 90, label: 'EXTREME SECURITY', color: '#22c55e' },
  { min: 70, label: 'HIGH SECURITY', color: '#86efac' },
  { min: 50, label: 'MODERATE SECURITY', color: '#facc15' },
  { min: 30, label: 'AT RISK', color: '#f97316' },
  { min: 0, label: 'CRITICAL RISK', color: '#ef4444' },
];

function getTrustStatus(score) {
  const entry = TRUST_STATUS_MAP.find(s => score >= s.min);
  return entry || TRUST_STATUS_MAP[TRUST_STATUS_MAP.length - 1];
}

function updateTrustScoreAfterTransaction(userId, decision, isManualReview = false) {
  const user = store.findUserById(userId);
  if (!user) return;

  let delta = 0;

  if (decision === 'APPROVED') {
    delta = +2; // slight positive for each approved
  } else if (decision === 'REVIEW') {
    delta = -5;
  } else if (decision === 'BLOCKED') {
    delta = -15;
  }

  if (isManualReview && decision === 'APPROVED') {
    delta = +5; // approved by manual review
  }

  const newScore = Math.min(100, Math.max(0, user.trustScore + delta));
  const statusInfo = getTrustStatus(newScore);

  store.updateUser(userId, {
    trustScore: newScore,
    trustStatus: statusInfo.label,
  });

  return newScore;
}

module.exports = { getTrustStatus, updateTrustScoreAfterTransaction };
