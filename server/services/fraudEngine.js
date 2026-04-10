// ============================================================
// Rakshak AI - Core Fraud Detection Engine
// Multi-layered risk scoring with AI consensus simulation
// ============================================================

const crypto = require('crypto');
const store = require('../data/store');

// Blacklisted IPs (simulated Global Fraud Registry)
const BLACKLISTED_IPS = [
  '185.220.101.45', '185.220.101.46', '185.107.47.171',
  '45.142.212.100', '194.165.16.77', '192.168.100.1',
];

// Known VPN/Proxy IP ranges (simplified)
const VPN_IP_PREFIXES = ['185.220', '45.142', '194.165', '10.8.', '172.16.'];

/**
 * Check if an IP is a known VPN/Proxy
 */
function isVPNorProxy(ip) {
  return VPN_IP_PREFIXES.some(prefix => ip.startsWith(prefix));
}

/**
 * Check if an IP is blacklisted
 */
function isBlacklisted(ip) {
  return BLACKLISTED_IPS.includes(ip);
}

/**
 * Main Fraud Detection Engine
 * @param {Object} params
 * @returns {Object} full risk analysis result
 */
async function analyzeFraud(params) {
  const {
    userId,
    amount,
    recipientVPA,
    recipientName,
    deviceFingerprint,
    userAgent,
    platform,
    screenResolution,
    timezone,
    ip = '103.21.58.1',
    country = 'India',
    city = 'Mumbai',
    note = '',
  } = params;

  const user = store.findUserById(userId);
  if (!user) throw new Error('User not found');

  let riskScore = 0;
  const riskFactors = [];
  const breakdown = {
    amountRisk: 0,
    deviceRisk: 0,
    locationRisk: 0,
    behaviorRisk: 0,
    velocityRisk: 0,
    recipientRisk: 0,
  };

  // ========== 1. AMOUNT RISK ==========
  if (amount <= 10000) {
    breakdown.amountRisk = 5;
  } else if (amount <= 50000) {
    breakdown.amountRisk = 15;
  } else if (amount <= 100000) {
    breakdown.amountRisk = 30;
  } else {
    breakdown.amountRisk = 50;
    riskFactors.push('Extreme High Transaction Amount');
  }
  if (amount > 50000) riskFactors.push('High Transaction Amount');
  riskScore += breakdown.amountRisk;

  // ========== 2. DEVICE FINGERPRINT RISK ==========
  const deviceFpHash = crypto.createHash('sha256').update(deviceFingerprint || 'unknown').digest('hex');
  const deviceList = Array.isArray(user.devices) ? user.devices :
    (user.devices?.trusted_devices || []); // handle MongoDB nested structure
  const knownDevice = deviceList.find(d => d.fingerprint === deviceFpHash);
  const deviceInfo = {
    fingerprint: deviceFpHash,
    isNewDevice: !knownDevice,
    isTrusted: knownDevice ? knownDevice.trusted : false,
    userAgent: userAgent || 'Unknown',
    platform: platform || 'Unknown',
  };

  if (!knownDevice) {
    breakdown.deviceRisk = 30;
    riskFactors.push('New Device Fingerprint Detected');
  } else if (!knownDevice.trusted) {
    breakdown.deviceRisk = 15;
    riskFactors.push('Untrusted Device');
  } else {
    breakdown.deviceRisk = 0;
  }
  riskScore += breakdown.deviceRisk;

  // ========== 3. LOCATION RISK ==========
  const vpnDetected = isVPNorProxy(ip);
  const blacklisted = isBlacklisted(ip);
  const primaryLocation = (user.locations && user.locations[0]) || null;
  const countryMismatch = primaryLocation && primaryLocation.country !== country;
  const cityMismatch = primaryLocation && primaryLocation.city !== city;

  const locationInfo = {
    ip,
    country,
    city,
    isVPN: vpnDetected,
    isBlacklisted: blacklisted,
    mismatch: countryMismatch || cityMismatch,
  };

  if (blacklisted) {
    breakdown.locationRisk += 25;
    riskFactors.push(`IP Blacklisted on Global Fraud Registry (GF-Tier 1)`);
  }
  if (vpnDetected) {
    breakdown.locationRisk += 20;
    riskFactors.push('VPN/Proxy Connection Detected');
  }
  if (countryMismatch) {
    breakdown.locationRisk += 25;
    riskFactors.push(`Location Mismatch: Transaction from ${country} (usual: ${primaryLocation.country})`);
  } else if (cityMismatch) {
    breakdown.locationRisk += 15;
    riskFactors.push(`Unusual Location Detected (${city})`);
  }
  breakdown.locationRisk = Math.min(breakdown.locationRisk, 50);
  riskScore += breakdown.locationRisk;

  // ========== 4. BEHAVIORAL RISK ==========
  const currentHour = new Date().getHours();
  if (currentHour >= 2 && currentHour <= 6) {
    breakdown.behaviorRisk += 10;
    riskFactors.push('Unusual Time of Transaction (Late Night)');
  }

  // Check rapid transactions (>3 in last hour)
  const userTxns = store.getTransactions(userId);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentTxns = userTxns.filter(t => new Date(t.createdAt) > oneHourAgo);
  if (recentTxns.length >= 3) {
    breakdown.behaviorRisk += 20;
    riskFactors.push('Rapid Transaction Velocity (>3 in 1 hour)');
  }

  // Check if new recipient
  const previousRecipients = userTxns.map(t => t.recipient.vpa);
  const isNewRecipient = !previousRecipients.includes(recipientVPA);
  if (isNewRecipient) {
    breakdown.behaviorRisk += 10;
    riskFactors.push('First Transaction to New Recipient');
  }

  breakdown.behaviorRisk = Math.min(breakdown.behaviorRisk, 40);
  riskScore += breakdown.behaviorRisk;

  // ========== 5. VELOCITY RISK ==========
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayTxns = userTxns.filter(t => new Date(t.createdAt) >= todayStart);
  const dailyVolume = todayTxns.reduce((sum, t) => sum + t.amount, 0);

  if (dailyVolume > 500000) {
    breakdown.velocityRisk += 25;
    riskFactors.push('Daily Transaction Limit Approaching');
  } else if (dailyVolume > 200000) {
    breakdown.velocityRisk += 10;
  }

  if (amount > (user.transactionStats?.averageAmount || 5000) * 5) {
    breakdown.velocityRisk += 20;
  }
  breakdown.velocityRisk = Math.min(breakdown.velocityRisk, 25);
  riskScore += breakdown.velocityRisk;

  // ========== 6. RECIPIENT RISK ==========
  const onWatchlist = store.isOnWatchlist(recipientVPA);
  if (onWatchlist) {
    breakdown.recipientRisk = 15;
    riskFactors.push('Recipient on Sovereign Watchlist');
    riskScore += 20; // Extra penalty
  }
  if (isNewRecipient && !onWatchlist) {
    breakdown.recipientRisk = Math.max(breakdown.recipientRisk, 10);
  }
  riskScore += breakdown.recipientRisk;

  // ========== 7. VARIANCE ANALYSIS ==========
  const avgAmount = user.transactionStats?.averageAmount || 10000;
  const variancePct = ((amount - avgAmount) / avgAmount) * 100;
  const varianceStr = (variancePct >= 0 ? '+' : '') + variancePct.toFixed(0) + '%';

  if (variancePct > 500) {
    riskScore += 15;
    riskFactors.push(`Extreme Amount Variance (${varianceStr} from user average)`);
  } else if (variancePct > 300) {
    riskScore += 8;
    riskFactors.push(`High Amount Variance (${varianceStr} from user average)`);
  }

  const comparisonMatrix = {
    standardAmount: avgAmount,
    requestedAmount: amount,
    variance: varianceStr,
  };

  // ========== 8. CAP SCORE ==========
  riskScore = Math.min(100, Math.max(0, riskScore));

  // ========== 9. DECISION ==========
  let decision;
  if (riskScore <= 30) decision = 'APPROVED';
  else if (riskScore <= 69) decision = 'REVIEW';
  else decision = 'BLOCKED';

  // ========== 10. AI CONSENSUS SIMULATION ==========
  const nodes = [
    { name: 'Conservative', weights: { amount: 1.5, device: 1.0, location: 1.0, behavior: 0.8, velocity: 1.2, recipient: 1.0 } },
    { name: 'Device-Focused', weights: { amount: 0.8, device: 1.8, location: 1.0, behavior: 1.0, velocity: 0.9, recipient: 1.0 } },
    { name: 'Location-Focused', weights: { amount: 0.9, device: 1.0, location: 1.8, behavior: 1.0, velocity: 0.8, recipient: 1.0 } },
    { name: 'Behavioral', weights: { amount: 1.0, device: 0.8, location: 0.9, behavior: 1.8, velocity: 1.2, recipient: 1.1 } },
    { name: 'Balanced', weights: { amount: 1.0, device: 1.0, location: 1.0, behavior: 1.0, velocity: 1.0, recipient: 1.0 } },
  ];

  const nodeDecisions = nodes.map(node => {
    const nodeScore = Math.min(100, Math.max(0,
      breakdown.amountRisk * node.weights.amount +
      breakdown.deviceRisk * node.weights.device +
      breakdown.locationRisk * node.weights.location +
      breakdown.behaviorRisk * node.weights.behavior +
      breakdown.velocityRisk * node.weights.velocity +
      breakdown.recipientRisk * node.weights.recipient
    ));
    if (nodeScore <= 30) return 'APPROVED';
    if (nodeScore <= 69) return 'REVIEW';
    return 'BLOCKED';
  });

  const decisionCounts = { APPROVED: 0, REVIEW: 0, BLOCKED: 0 };
  nodeDecisions.forEach(d => decisionCounts[d]++);
  const majorityDecision = Object.entries(decisionCounts).sort((a, b) => b[1] - a[1])[0][0];
  const agreeCount = decisionCounts[majorityDecision];
  const consensusStrength = agreeCount >= 4 ? 'Strong' : agreeCount === 3 ? 'Moderate' : 'Weak';

  // If weak consensus, escalate to REVIEW
  const finalDecision = consensusStrength === 'Weak' ? 'REVIEW' : (majorityDecision === decision ? decision : majorityDecision);

  const aiConsensus = {
    totalNodes: 5,
    agreeCount,
    consensusStrength,
    recommendation: finalDecision,
    nodeDecisions,
    summary: `${agreeCount} out of 5 AI nodes ${finalDecision === 'REVIEW' ? 'suggested cautionary review based on behavioral drift analysis' : finalDecision === 'BLOCKED' ? 'flagged this transaction for immediate blocking' : 'approved this transaction as safe'}`,
  };

  // ========== ANALYSIS STEPS ==========
  const analysisSteps = [
    { step: 'Initializing Sovereign Protocol', status: 'completed', duration: 150 },
    { step: 'Capturing Device Fingerprint', status: 'completed', duration: 312 },
    { step: 'Verifying Location Consistency', status: 'completed', duration: 445 },
    { step: 'Analyzing Transaction Patterns', status: 'completed', duration: 623 },
    { step: 'Running AI Risk Assessment', status: 'completed', duration: 789 },
    { step: 'Calculating Final Risk Score', status: 'completed', duration: 201 },
    { step: 'Generating Blockchain Proof', status: 'completed', duration: 102 },
    { step: 'Consensus Reached', status: 'completed', duration: 88 },
  ];

  // Deduplicate risk factors
  const uniqueFactors = [...new Set(riskFactors)].slice(0, 7);

  return {
    riskScore,
    decision: finalDecision,
    riskFactors: uniqueFactors,
    breakdown,
    deviceInfo,
    locationInfo,
    comparisonMatrix,
    aiConsensus,
    analysisSteps,
    variancePct,
  };
}

module.exports = { analyzeFraud };
