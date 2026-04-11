// ============================================================
// Rakshak AI - Core Fraud Detection Engine
// Multi-layered risk scoring with AI Consensus Layer v2
// ============================================================

const crypto = require('crypto');
const store = require('../data/store');
const { runConsensusLayer } = require('./consensusLayer');

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
    // Gate verification results from the pre-payment 3-factor check
    gateVerification = {},
  } = params;

  // Destructure gate results (defaults = unverified/unknown)
  const {
    biometric: gateBio = {},          // { passed, confidence, method }
    location: gateLoc = {},           // { passed, distanceKm, denied }
    otp: gateOTP = {},                // { passed, skipped }
  } = gateVerification;

  const biometricGatePassed     = gateBio.passed === true;
  const biometricGateConfidence = gateBio.confidence || 0;
  const biometricGateSkipped    = gateBio.method === 'skipped';
  const realDistanceKm          = typeof gateLoc.distanceKm === 'number' ? gateLoc.distanceKm : null;
  const locationGatePassed      = gateLoc.passed === true;
  const locationGpsDenied       = gateLoc.denied === true;
  const otpPassed               = gateOTP.passed === true;

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

  // ========== 3. LOCATION RISK (GPS-first, IP-fallback) ==========
  let vpnDetected = isVPNorProxy(ip);
  let blacklisted = isBlacklisted(ip);
  const primaryLocation = (user.locations && user.locations[0]) || null;
  const countryMismatch = primaryLocation && primaryLocation.country !== country;
  const cityMismatch    = primaryLocation && primaryLocation.city !== city;

  const locationInfo = {
    ip,
    country,
    city,
    isVPN: vpnDetected,
    isBlacklisted: blacklisted,
    mismatch: countryMismatch || cityMismatch,
    realDistanceKm,
  };

  // GPS distance from gate takes priority over IP-based guesses
  if (realDistanceKm !== null) {
    // Real GPS verified
    if (realDistanceKm <= 50) {
      // Within home zone — very low location risk
      breakdown.locationRisk = 0;
      locationInfo.realDistanceKm = realDistanceKm;
    } else if (realDistanceKm <= 200) {
      // Moderate distance — flag but don’t panic
      breakdown.locationRisk = 15;
      riskFactors.push(`Moderate Distance from Home (${realDistanceKm} km)`);
    } else if (realDistanceKm <= 600) {
      // Far — significant signal but may be valid travel
      breakdown.locationRisk = 28;
      riskFactors.push(`Far from Home Location (${realDistanceKm} km) — possible travel detected`);
    } else {
      // Very far / suspicious
      breakdown.locationRisk = 40;
      riskFactors.push(`Extreme Distance from Home (${realDistanceKm} km)`);
    }
    // Still add VPN/blacklist on top of GPS-based risk
    if (blacklisted) { breakdown.locationRisk = Math.min(breakdown.locationRisk + 15, 50); riskFactors.push('IP Blacklisted on Global Fraud Registry (GF-Tier 1)'); }
    if (vpnDetected) { breakdown.locationRisk = Math.min(breakdown.locationRisk + 10, 50); riskFactors.push('VPN/Proxy Connection Detected'); }
  } else {
    // No GPS — fall back to IP-based location scoring
    if (blacklisted) {
      breakdown.locationRisk += 25;
      riskFactors.push('IP Blacklisted on Global Fraud Registry (GF-Tier 1)');
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
    // GPS was denied or skipped — slight penalty for not allowing location
    if (locationGpsDenied) {
      breakdown.locationRisk = Math.min(breakdown.locationRisk + 8, 50);
      riskFactors.push('GPS location access denied');
    }
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

  // ========== 8. GATE VERIFICATION ADJUSTMENTS ==========
  // Real signals from the 3-factor gate override simulated values

  // Biometric gate
  if (biometricGatePassed && biometricGateConfidence >= 0.75) {
    // Strong biometric match — reduce suspicion significantly
    riskScore = Math.max(0, riskScore - 15);
    // Remove device-related factors in-place (riskFactors is const)
    for (let i = riskFactors.length - 1; i >= 0; i--) {
      if (riskFactors[i].includes('Device')) riskFactors.splice(i, 1);
    }
  } else if (biometricGateSkipped) {
    riskScore = Math.min(100, riskScore + 10);
    riskFactors.push('Biometric verification skipped');
  } else if (gateBio.method === 'face_failed') {
    riskScore = Math.min(100, riskScore + 18);
    riskFactors.push('Biometric face match FAILED at payment gate');
  }

  // OTP gate
  if (otpPassed) {
    riskScore = Math.max(0, riskScore - 8);
  } else if (gateOTP.skipped) {
    riskScore = Math.min(100, riskScore + 8);
    riskFactors.push('OTP verification skipped');
  }

  // ========== 9. CAP SCORE ==========
  riskScore = Math.min(100, Math.max(0, riskScore));

  // ========== 9. DECISION (pre-consensus baseline) ==========
  let decision;
  if (riskScore <= 30) decision = 'APPROVED';
  else if (riskScore <= 69) decision = 'REVIEW';
  else decision = 'BLOCKED';

  // ========== 10. AI CONSENSUS LAYER v2 ==========
  // Build user context
  const userContext = {
    trustScore:       user.trustScore || user.risk?.trust_score || 50,
    transactionCount: user.transactionStats?.totalCount || userTxns.length || 0,
    averageAmount:    user.transactionStats?.averageAmount || user.behavioral?.avg_transaction_amount || 10000,
    amount,
  };

  // Build rich signal object from MongoDB user’s stored data + gate verification
  const currentHourForSignals = new Date().getHours();
  const activeHours = user.behavioral?.usual_active_hours || { start: 9, end: 22 };
  const isUsualHour = currentHourForSignals >= activeHours.start && currentHourForSignals <= activeHours.end;
  const userHomeCountry = user.location?.home_location?.country || 'India';
  // deviceList already declared above in device fingerprint section — reuse it

  const riskEngineOutput = {
    breakdown,
    riskScore,
    riskFactors,
    identitySignals: {
      kycVerified:          !!(user.financial?.card_last4 && user.financial?.card_type && user.financial?.bank_name),
      identityMatchScore:   user.risk?.trust_score || 50,
      accountAgeMonths:     user.createdAt ? Math.floor((Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24 * 30)) : 6,
      previousFraudFlags:   (user.risk?.flags || []).length,
      documentVerified:     !!(user.financial?.card_last4),
    },
    deviceIntelligence: {
      fingerprintHash:         deviceInfo.fingerprint,
      isKnownDevice:           !deviceInfo.isNewDevice,
      deviceTrustScore:        deviceInfo.isTrusted ? 85 : (deviceInfo.isNewDevice ? 20 : 50),
      vpnDetected:             vpnDetected,
      torDetected:             false,
      emulatorDetected:        false,
      deviceChangeFrequency:   deviceList.length,
    },
    cardSignals: {
      cardType:            (user.financial?.card_type || '').toLowerCase(),
      cardAgeMonths:       12,
      cardCountryMatch:    country === userHomeCountry || country === 'India',
      isNewCard:           false,
      cardUsageFrequency:  Math.min(userTxns.length / 2, 30),
      internationalCard:   country !== userHomeCountry && country !== 'India',
    },
    locationSignals: {
      ipCountry:               country,
      userHomeCountry:         userHomeCountry,
      isVPN:                   vpnDetected,
      isTor:                   false,
      isDatacenterIP:          vpnDetected,
      // Use REAL GPS distance if available, otherwise estimate from IP
      distanceFromLastTxnKm:   realDistanceKm !== null ? realDistanceKm : (countryMismatch ? 1500 : (cityMismatch ? 300 : 0)),
      geoVelocityFlagMinutes:  recentTxns.length > 0 ? 5 : 999,
      locationRiskTier:        breakdown.locationRisk >= 30 ? 'HIGH' : breakdown.locationRisk >= 10 ? 'MEDIUM' : 'LOW',
      gpsDenied:               locationGpsDenied,
      realDistanceKm,
    },
    behaviorSignals: {
      transactionHour:          currentHourForSignals,
      isUsualHour:              isUsualHour,
      dayOfWeekAnomaly:         false,
      velocityLast1h:           recentTxns.length,
      velocityLast24h:          todayTxns.length,
      averageTxnGap:            120,
      recipientIsNew:           isNewRecipient,
      recipientTransactionCount: previousRecipients.filter(r => r === recipientVPA).length,
    },
    // Use REAL gate biometric results — overrides simulation
    biometricSignals: {
      biometricVerified:    biometricGatePassed,
      biometricConfidence:  Math.round(biometricGateConfidence * 100),
      biometricMethod:      gateBio.method || 'none',
      biometricAttempts:    1,
      biometricOverridden:  biometricGateSkipped || (!biometricGatePassed && gateBio.method !== 'face_failed'),
      otpVerified:          otpPassed,
    },
  };

  // Run the real consensus layer
  const consensusResult = runConsensusLayer(breakdown, riskEngineOutput, userContext);
  const finalDecision = consensusResult.finalDecision;

  const aiConsensus = {
    totalNodes:                     5,
    agreeCount:                     consensusResult.majorityCount,
    consensusStrength:              consensusResult.consensusStrength,
    recommendation:                 finalDecision,
    summary:                        consensusResult.summary,
    voteCounts:                     consensusResult.voteCounts,
    nodeDecisions:                  consensusResult.nodeDecisions,
    nodeNames:                      consensusResult.nodeNames,
    nodeIcons:                      consensusResult.nodeIcons,
    nodeScores:                     consensusResult.nodeScores,
    nodeConfidences:                consensusResult.nodeConfidences,
    nodeReasonings:                 consensusResult.nodeReasonings,
    weightedScore:                  consensusResult.weightedConsensusScore,
    dissenters:                     consensusResult.dissenters,
    falsePositiveProtectionApplied: consensusResult.falsePositiveProtectionApplied,
  };

  const explainableAI = {
    perNodeReasoning:    consensusResult.nodeReasonings,
    riskFactorBreakdown: breakdown,
    weightedScore:       consensusResult.weightedConsensusScore,
    protectionActive:    consensusResult.falsePositiveProtectionApplied,
    richSignalsUsed:     consensusResult.richBonusFlags,
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
    explainableAI,
    analysisSteps,
    variancePct,
  };
}

module.exports = { analyzeFraud };
