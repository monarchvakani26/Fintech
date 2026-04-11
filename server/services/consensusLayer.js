// ============================================================
// Rakshak AI — AI Consensus Layer v2
// 5 Specialized Nodes → Voting/Consensus → Decision Engine
// Consumes rich signals from friend's data collection module
// ============================================================

'use strict';

// ================================================================
// NODE DEFINITIONS — 5 Specialized AI Agents
// ================================================================
const AI_NODES = [
  {
    id: 'node-1',
    name: 'Device-focused',
    icon: '📱',
    specialty: 'device',
    description: 'Hardware fingerprinting, device trust verification, device-location correlation',
    weights: { amountRisk: 0.4, deviceRisk: 2.4, locationRisk: 0.9, behaviorRisk: 0.5, velocityRisk: 0.4, recipientRisk: 0.4 },
    richSignalBonuses: {
      vpnDetected: +18, torDetected: +28, emulatorDetected: +25,
      isKnownDevice: -12, biometricOverridden: +15, deviceTrustAbove80: -10,
    },
    specialtyThreshold: 12,
    sensitivity: 'HIGH',
    falsePositiveBias: 0.82,
  },
  {
    id: 'node-2',
    name: 'Behavior-focused',
    icon: '🧠',
    specialty: 'behavior',
    description: 'Transaction timing, velocity patterns, recipient history, behavioral anomalies',
    weights: { amountRisk: 0.5, deviceRisk: 0.4, locationRisk: 0.7, behaviorRisk: 2.5, velocityRisk: 1.9, recipientRisk: 1.3 },
    richSignalBonuses: {
      unusualHour: +12, dayOfWeekAnomaly: +8,
      velocityLast1hAbove3: +20, velocityLast24hAbove10: +15,
      recipientIsNew: +10, recipientSeenBefore: -8, biometricFailed: +18,
    },
    specialtyThreshold: 8,
    sensitivity: 'HIGH',
    falsePositiveBias: 0.78,
  },
  {
    id: 'node-3',
    name: 'Risk-conservative',
    icon: '🛡️',
    specialty: 'overall',
    description: 'Conservative evaluator — prioritizes avoiding financial loss over throughput',
    weights: { amountRisk: 1.9, deviceRisk: 1.3, locationRisk: 1.7, behaviorRisk: 1.2, velocityRisk: 1.5, recipientRisk: 1.7 },
    richSignalBonuses: {
      previousFraudFlags: +20, kycNotVerified: +15, isNewCard: +10,
      cardCountryMismatch: +18, internationalCard: +8, geoVelocityFlag: +22, documentNotVerified: +12,
    },
    specialtyThreshold: 3,
    sensitivity: 'VERY_HIGH',
    falsePositiveBias: 0.96,
  },
  {
    id: 'node-4',
    name: 'Adaptive',
    icon: '⚡',
    specialty: 'contextual',
    description: 'Dynamically adjusts weights by trust history, account age, biometric confidence',
    weights: { amountRisk: 1.0, deviceRisk: 1.0, locationRisk: 1.0, behaviorRisk: 1.0, velocityRisk: 1.0, recipientRisk: 1.0 },
    richSignalBonuses: {
      biometricVerifiedHighConfidence: -15, kycVerifiedOldAccount: -12,
      identityMatchAbove90: -10, biometricAttemptsTooMany: +14,
      accountTooNew: +12, biometricOverridden: +18,
    },
    specialtyThreshold: 20,
    sensitivity: 'ADAPTIVE',
    falsePositiveBias: 0.68,
  },
  {
    id: 'node-5',
    name: 'Amount-focused',
    icon: '💰',
    specialty: 'amount',
    description: 'Transaction value anomalies, variance from user patterns, card-amount consistency',
    weights: { amountRisk: 2.6, deviceRisk: 0.3, locationRisk: 0.4, behaviorRisk: 0.5, velocityRisk: 1.0, recipientRisk: 0.8 },
    richSignalBonuses: {
      prepaidCard: +12, cardAgeBelow3Months: +8,
      cardUsageTooLow: +10, cardCountryMismatch: +15,
    },
    specialtyThreshold: 8,
    sensitivity: 'MEDIUM',
    falsePositiveBias: 0.88,
  },
];

// ================================================================
// SINGLE NODE RUNNER
// ================================================================
function runNode(node, breakdown, riskEngineOutput, userContext) {
  const {
    trustScore = 50,
    transactionCount = 0,
    averageAmount = 10000,
    amount = 0,
  } = userContext;

  const {
    identitySignals = {},
    deviceIntelligence = {},
    cardSignals = {},
    locationSignals = {},
    behaviorSignals = {},
    biometricSignals = {},
  } = riskEngineOutput;

  // ── STEP 1: Weighted base score ──
  const rawScore =
    (breakdown.amountRisk    || 0) * node.weights.amountRisk +
    (breakdown.deviceRisk    || 0) * node.weights.deviceRisk +
    (breakdown.locationRisk  || 0) * node.weights.locationRisk +
    (breakdown.behaviorRisk  || 0) * node.weights.behaviorRisk +
    (breakdown.velocityRisk  || 0) * node.weights.velocityRisk +
    (breakdown.recipientRisk || 0) * node.weights.recipientRisk;

  // ── STEP 2: Normalize to 0–100 ──
  const maxPossible =
    50  * node.weights.amountRisk +
    30  * node.weights.deviceRisk +
    50  * node.weights.locationRisk +
    40  * node.weights.behaviorRisk +
    25  * node.weights.velocityRisk +
    35  * node.weights.recipientRisk;

  let score = Math.min(100, (rawScore / maxPossible) * 100);

  // ── STEP 3: Rich signal bonuses per node specialty ──
  let richBonus = 0;

  if (node.name === 'Device-focused') {
    if (deviceIntelligence.vpnDetected)       richBonus += node.richSignalBonuses.vpnDetected;
    if (deviceIntelligence.torDetected)       richBonus += node.richSignalBonuses.torDetected;
    if (deviceIntelligence.emulatorDetected)  richBonus += node.richSignalBonuses.emulatorDetected;
    if (deviceIntelligence.isKnownDevice)     richBonus += node.richSignalBonuses.isKnownDevice;
    if (biometricSignals.biometricOverridden) richBonus += node.richSignalBonuses.biometricOverridden;
    if ((deviceIntelligence.deviceTrustScore || 0) >= 80)
                                              richBonus += node.richSignalBonuses.deviceTrustAbove80;
  }

  if (node.name === 'Behavior-focused') {
    if (!behaviorSignals.isUsualHour)         richBonus += node.richSignalBonuses.unusualHour;
    if (behaviorSignals.dayOfWeekAnomaly)     richBonus += node.richSignalBonuses.dayOfWeekAnomaly;
    if ((behaviorSignals.velocityLast1h || 0) > 3)
                                              richBonus += node.richSignalBonuses.velocityLast1hAbove3;
    if ((behaviorSignals.velocityLast24h || 0) > 10)
                                              richBonus += node.richSignalBonuses.velocityLast24hAbove10;
    if (behaviorSignals.recipientIsNew)       richBonus += node.richSignalBonuses.recipientIsNew;
    if (!behaviorSignals.recipientIsNew && (behaviorSignals.recipientTransactionCount || 0) > 3)
                                              richBonus += node.richSignalBonuses.recipientSeenBefore;
    if ((biometricSignals.biometricAttempts || 1) > 2)
                                              richBonus += node.richSignalBonuses.biometricFailed;
  }

  if (node.name === 'Risk-conservative') {
    if ((identitySignals.previousFraudFlags || 0) > 0)
                                              richBonus += node.richSignalBonuses.previousFraudFlags;
    if (!identitySignals.kycVerified)         richBonus += node.richSignalBonuses.kycNotVerified;
    if (cardSignals.isNewCard)                richBonus += node.richSignalBonuses.isNewCard;
    if (!cardSignals.cardCountryMatch)        richBonus += node.richSignalBonuses.cardCountryMismatch;
    if (cardSignals.internationalCard)        richBonus += node.richSignalBonuses.internationalCard;
    if (!identitySignals.documentVerified)    richBonus += node.richSignalBonuses.documentNotVerified;
    const tooFast = (locationSignals.geoVelocityFlagMinutes || 9999) < 10 &&
                    (locationSignals.distanceFromLastTxnKm || 0) > 500;
    if (tooFast)                              richBonus += node.richSignalBonuses.geoVelocityFlag;
  }

  if (node.name === 'Adaptive') {
    if (biometricSignals.biometricVerified && (biometricSignals.biometricConfidence || 0) >= 85)
                                              richBonus += node.richSignalBonuses.biometricVerifiedHighConfidence;
    if (identitySignals.kycVerified && (identitySignals.accountAgeMonths || 0) > 12)
                                              richBonus += node.richSignalBonuses.kycVerifiedOldAccount;
    if ((identitySignals.identityMatchScore || 0) >= 90)
                                              richBonus += node.richSignalBonuses.identityMatchAbove90;
    if ((biometricSignals.biometricAttempts || 1) > 3)
                                              richBonus += node.richSignalBonuses.biometricAttemptsTooMany;
    if ((identitySignals.accountAgeMonths || 999) < 3)
                                              richBonus += node.richSignalBonuses.accountTooNew;
    if (biometricSignals.biometricOverridden) richBonus += node.richSignalBonuses.biometricOverridden;
  }

  if (node.name === 'Amount-focused') {
    if (cardSignals.cardType === 'prepaid')   richBonus += node.richSignalBonuses.prepaidCard;
    if ((cardSignals.cardAgeMonths || 999) < 3)
                                              richBonus += node.richSignalBonuses.cardAgeBelow3Months;
    if ((cardSignals.cardUsageFrequency || 99) < 2)
                                              richBonus += node.richSignalBonuses.cardUsageTooLow;
    if (!cardSignals.cardCountryMatch)        richBonus += node.richSignalBonuses.cardCountryMismatch;
  }

  score = Math.min(100, score + richBonus);

  // ── STEP 4: Adaptive node — dynamic trust scaling ──
  if (node.sensitivity === 'ADAPTIVE') {
    if (trustScore >= 85)      score *= 0.50;
    else if (trustScore >= 70) score *= 0.68;
    else if (trustScore >= 55) score *= 0.85;
    else if (trustScore <= 30) score *= 1.35;
    else if (trustScore <= 45) score *= 1.18;
  }

  // ── STEP 5: False positive protection for high-trust users ──
  if (node.sensitivity !== 'VERY_HIGH' && trustScore >= 80 && transactionCount >= 20) {
    score *= node.falsePositiveBias;
  }

  // ── STEP 6: Specialty confidence check ──
  const specialtyScore = breakdown[`${node.specialty}Risk`] || 0;
  let confidence = 'HIGH';
  if (node.specialty !== 'overall' && node.specialty !== 'contextual') {
    if (specialtyScore < node.specialtyThreshold && richBonus < 10) {
      score *= 0.72;
      confidence = 'LOW';
    }
  }

  // ── STEP 7: Amount variance boost ──
  const variancePct = averageAmount > 0 ? ((amount - averageAmount) / averageAmount) * 100 : 0;
  if (variancePct > 400)       score = Math.min(100, score * 1.28);
  else if (variancePct < -60)  score *= 0.82;

  // ── STEP 8: High-confidence biometric cross-node trust signal ──
  if (biometricSignals.biometricVerified &&
      (biometricSignals.biometricConfidence || 0) >= 90 &&
      (biometricSignals.biometricAttempts || 1) === 1) {
    score *= 0.88;
  }

  // ── STEP 9: Final clamp ──
  score = Math.min(100, Math.max(0, score));

  // ── STEP 10: Decision ──
  let decision;
  if (score <= 28)      decision = 'APPROVED';
  else if (score <= 65) decision = 'REVIEW';
  else                  decision = 'BLOCKED';

  // ── STEP 11: Reasoning for Explainable AI ──
  const reasoning = buildReasoning(node.name, breakdown, score, variancePct, riskEngineOutput);

  return {
    nodeId: node.id,
    nodeName: node.name,
    nodeIcon: node.icon,
    specialty: node.specialty,
    score: Math.round(score),
    decision,
    confidence,
    reasoning,
    richBonusApplied: richBonus !== 0,
    richBonusAmount: Math.round(richBonus),
  };
}

// ================================================================
// EXPLAINABLE AI — PER-NODE REASONING GENERATOR
// ================================================================
function buildReasoning(nodeName, breakdown, score, variancePct, riskEngineOutput) {
  const {
    identitySignals = {},
    deviceIntelligence = {},
    cardSignals = {},
    locationSignals = {},
    behaviorSignals = {},
    biometricSignals = {},
  } = riskEngineOutput;

  const reasons = [];

  if (nodeName === 'Device-focused') {
    if (deviceIntelligence.torDetected)
      reasons.push('Tor network detected — high anonymization risk');
    else if (deviceIntelligence.vpnDetected)
      reasons.push('VPN usage detected — masking true location');
    else if (deviceIntelligence.emulatorDetected)
      reasons.push('Virtual/emulated device detected');
    else if (deviceIntelligence.isKnownDevice)
      reasons.push('Device fingerprint verified in trusted registry');
    else
      reasons.push('Unknown device — not in trusted device registry');
    if (breakdown.locationRisk >= 20)
      reasons.push('Device location inconsistent with account home region');
    if (biometricSignals.biometricOverridden)
      reasons.push('User bypassed biometric verification on this device');
  }

  if (nodeName === 'Behavior-focused') {
    if ((behaviorSignals.velocityLast1h || 0) > 3)
      reasons.push(`Rapid transaction velocity: ${behaviorSignals.velocityLast1h} txns in past hour`);
    if (!behaviorSignals.isUsualHour)
      reasons.push("Transaction outside user's normal activity window");
    if (behaviorSignals.dayOfWeekAnomaly)
      reasons.push('Unusual day-of-week activity pattern detected');
    if (behaviorSignals.recipientIsNew)
      reasons.push('First-time transaction to this recipient');
    else if ((behaviorSignals.recipientTransactionCount || 0) > 3)
      reasons.push(`Recipient verified — ${behaviorSignals.recipientTransactionCount} prior transactions`);
    if (reasons.length === 0)
      reasons.push('Behavioral pattern within normal parameters');
  }

  if (nodeName === 'Risk-conservative') {
    if ((identitySignals.previousFraudFlags || 0) > 0)
      reasons.push(`Account has ${identitySignals.previousFraudFlags} historical fraud flag(s)`);
    if (!identitySignals.kycVerified)
      reasons.push('KYC verification incomplete');
    else
      reasons.push('KYC verified and account in good standing');
    if (!cardSignals.cardCountryMatch)
      reasons.push('Card country does not match transaction country');
    if (breakdown.recipientRisk >= 15)
      reasons.push('Recipient flagged in Sovereign Watchlist');
    if (reasons.length < 2)
      reasons.push(`Conservative threshold applied — aggregate score ${Math.round(score)}/100`);
  }

  if (nodeName === 'Adaptive') {
    if (biometricSignals.biometricVerified && (biometricSignals.biometricConfidence || 0) >= 85)
      reasons.push(`Biometric verified with ${biometricSignals.biometricConfidence}% confidence`);
    if ((identitySignals.accountAgeMonths || 0) > 12 && identitySignals.kycVerified)
      reasons.push(`Established account — ${identitySignals.accountAgeMonths} months old, KYC verified`);
    else if ((identitySignals.accountAgeMonths || 999) < 3)
      reasons.push('Recently created account — elevated caution applied');
    if (score <= 28)
      reasons.push('User trust history strongly supports this transaction');
    else if (score <= 65)
      reasons.push('Contextual risk slightly above user baseline — manual check advised');
    else
      reasons.push('Transaction context deviates significantly from established user profile');
  }

  if (nodeName === 'Amount-focused') {
    if (Math.abs(variancePct) > 400)
      reasons.push(`Extreme amount variance: ${variancePct > 0 ? '+' : ''}${Math.round(variancePct)}% from user average`);
    else if (Math.abs(variancePct) > 150)
      reasons.push(`Notable amount deviation: ${variancePct > 0 ? '+' : ''}${Math.round(variancePct)}%`);
    else
      reasons.push('Amount within acceptable range of user transaction history');
    if (cardSignals.cardType === 'prepaid')
      reasons.push('Prepaid card — higher risk card type for large transactions');
    if ((cardSignals.cardUsageFrequency || 99) < 2 && breakdown.amountRisk >= 20)
      reasons.push('Low-frequency card used for high-value transaction');
  }

  return reasons.slice(0, 3).join('. ') + '.';
}

// ================================================================
// VOTING / CONSENSUS ENGINE
// ================================================================
function runConsensus(nodeResults, userContext) {
  const { trustScore = 50 } = userContext;

  const voteCounts = { APPROVED: 0, REVIEW: 0, BLOCKED: 0 };
  nodeResults.forEach(n => voteCounts[n.decision]++);

  const sorted = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
  const majorityDecision = sorted[0][0];
  const majorityCount = sorted[0][1];

  let consensusStrength, consensusLabel;
  if (majorityCount === 5) {
    consensusStrength = 'UNANIMOUS';
    consensusLabel = 'All 5 nodes in perfect agreement';
  } else if (majorityCount === 4) {
    consensusStrength = 'STRONG';
    consensusLabel = '4 of 5 nodes in agreement';
  } else if (majorityCount === 3) {
    consensusStrength = 'MODERATE';
    consensusLabel = '3 of 5 nodes in agreement';
  } else {
    consensusStrength = 'WEAK';
    consensusLabel = 'No clear majority — escalating to review';
  }

  let finalDecision = majorityDecision;

  // Rule 1: Weak consensus → REVIEW
  if (consensusStrength === 'WEAK') finalDecision = 'REVIEW';

  // Rule 2: Conservative + 2 others vote BLOCKED → force BLOCKED
  const conservativeNode = nodeResults.find(n => n.nodeName === 'Risk-conservative');
  if (conservativeNode?.decision === 'BLOCKED' && voteCounts['BLOCKED'] >= 3) {
    finalDecision = 'BLOCKED';
    if (consensusStrength === 'WEAK') consensusStrength = 'MODERATE';
  }

  // Rule 3: False positive protection — Adaptive says APPROVED + high trust
  const adaptiveNode = nodeResults.find(n => n.nodeName === 'Adaptive');
  const falsePositiveProtectionApplied = !!(
    adaptiveNode?.decision === 'APPROVED' &&
    adaptiveNode?.confidence === 'HIGH' &&
    trustScore >= 75 &&
    voteCounts['BLOCKED'] <= 1 &&
    finalDecision === 'BLOCKED'
  );
  if (falsePositiveProtectionApplied) {
    finalDecision = 'REVIEW';
    consensusLabel += ' — downgraded: trusted user (false positive protection active)';
  }

  // Rule 4: Low confidence overload → downgrade BLOCKED to REVIEW
  const lowConfidenceCount = nodeResults.filter(n => n.confidence === 'LOW').length;
  if (lowConfidenceCount >= 4 && finalDecision === 'BLOCKED') {
    finalDecision = 'REVIEW';
    consensusLabel += ' — insufficient confidence to block';
  }

  // Weighted score
  const totalWeight = nodeResults.reduce((s, n) => s + (n.confidence === 'HIGH' ? 1.0 : 0.55), 0);
  const weightedScore = nodeResults.reduce((s, n) => s + n.score * (n.confidence === 'HIGH' ? 1.0 : 0.55), 0) / totalWeight;

  const dissenters = nodeResults.filter(n => n.decision !== finalDecision).map(n => n.nodeName);

  const decisionVerb = {
    APPROVED: 'approved this transaction as safe',
    REVIEW:   'flagged this transaction for manual review',
    BLOCKED:  'voted to block this transaction',
  };

  const summary = `${majorityCount} of 5 AI nodes ${decisionVerb[finalDecision]}. ${
    dissenters.length > 0 ? `Dissenting nodes: ${dissenters.join(', ')}.` : 'Full consensus reached.'
  } Strength: ${consensusStrength}.`;

  return {
    finalDecision,
    consensusStrength,
    consensusLabel,
    summary,
    voteCounts,
    majorityCount,
    totalNodes: 5,
    weightedConsensusScore: Math.round(weightedScore),
    dissenters,
    falsePositiveProtectionApplied,
    nodeDecisions:   nodeResults.map(n => n.decision),
    nodeNames:       nodeResults.map(n => n.nodeName),
    nodeIcons:       nodeResults.map(n => n.nodeIcon),
    nodeScores:      nodeResults.map(n => n.score),
    nodeConfidences: nodeResults.map(n => n.confidence),
    nodeReasonings:  nodeResults.map(n => n.reasoning),
    richBonusFlags:  nodeResults.map(n => n.richBonusApplied),
  };
}

// ================================================================
// MAIN ENTRY POINT
// ================================================================
/**
 * runConsensusLayer
 * @param {Object} breakdown          - 6 risk scores from the fraud engine
 * @param {Object} riskEngineOutput   - rich signals (identity, device, card, location, behavior, biometric)
 * @param {Object} userContext        - { trustScore, transactionCount, averageAmount, amount }
 * @returns {Object}                  - full consensus + explainableAI result
 */
function runConsensusLayer(breakdown, riskEngineOutput, userContext) {
  const nodeResults = AI_NODES.map(node =>
    runNode(node, breakdown, riskEngineOutput, userContext)
  );

  const consensus = runConsensus(nodeResults, userContext);

  return {
    ...consensus,
    nodes: nodeResults,
    breakdown,
  };
}

module.exports = { runConsensusLayer, AI_NODES };
