// ============================================================
// Rakshak AI — Risk Engine
// Recalculates trust score whenever user data changes.
// ============================================================

'use strict';

/**
 * Recalculate trust score based on current user document.
 * Returns { trust_score, risk_level, factors }
 */
function recalculateRisk(user) {
  let score = 50; // Start at neutral
  const factors = [];

  // ── Financial completeness ──────────────────────────────
  if (user.financial) {
    if (user.financial.card_last4) { score += 3; }
    if (user.financial.bank_name) { score += 3; }
    if (user.financial.avg_balance > 50000) { score += 5; }
    else if (user.financial.avg_balance > 10000) { score += 2; }
  }

  // ── Device trust ────────────────────────────────────────
  if (user.devices) {
    const trustedCount = (user.devices.trusted_devices || []).filter(d => d.trusted).length;
    if (trustedCount >= 2) { score += 8; factors.push('Multiple trusted devices'); }
    else if (trustedCount === 1) { score += 4; }
    if (trustedCount === 0) { score -= 5; factors.push('No trusted devices'); }
  }

  // ── Location intelligence ───────────────────────────────
  if (user.location) {
    if (user.location.home_location?.city) { score += 5; }
    if (user.location.usual_locations?.length >= 2) { score += 3; }

    // Distance anomaly check
    if (user.location.home_location?.lat && user.location.last_location?.lat) {
      const dist = haversine(
        user.location.home_location.lat, user.location.home_location.lng,
        user.location.last_location.lat, user.location.last_location.lng
      );
      if (dist > 1000) { score -= 10; factors.push('Location > 1000km from home'); }
      else if (dist > 500) { score -= 5; factors.push('Location > 500km from home'); }
    }
  }

  // ── Behavioral baseline ─────────────────────────────────
  if (user.behavioral) {
    if (user.behavioral.typing_speed_avg > 0) { score += 3; }
    if (user.behavioral.session_duration_avg > 60) { score += 2; }
    if (user.behavioral.failed_attempts_avg > 3) { score -= 8; factors.push('High failed auth attempts'); }
  }

  // ── Biometric ───────────────────────────────────────────
  if (user.biometric?.enabled && user.biometric.face_embedding?.length > 0) {
    score += 10;
    if (user.biometric.verification_confidence >= 0.9) { score += 5; }
  }

  // ── Security ────────────────────────────────────────────
  if (user.security) {
    if (user.security.two_factor_enabled) { score += 5; }
    if (user.security.biometric_enabled) { score += 3; }
    if (user.security.failed_login_count > 5) { score -= 10; factors.push('Multiple failed logins'); }
  }

  // Clamp
  score = Math.max(0, Math.min(100, score));

  // Derive risk level
  let risk_level;
  if (score >= 80) risk_level = 'LOW';
  else if (score >= 55) risk_level = 'MEDIUM';
  else if (score >= 30) risk_level = 'HIGH';
  else risk_level = 'CRITICAL';

  return { trust_score: score, risk_level, factors };
}

/**
 * Haversine distance in km between two lat/lng pairs.
 */
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = { recalculateRisk, haversine };
