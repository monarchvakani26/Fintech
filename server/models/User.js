// ============================================================
// Rakshak AI — User Schema (Production-Grade Mongoose Model)
// Designed for real-time fraud detection using behavioral,
// location, device, and biometric intelligence.
// ============================================================

'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

// ─────────────────────────────────────────────────────────────
// SUB-SCHEMA: Financial Profile
// Stores masked payment identifiers and spending baseline.
// Full card/account numbers are NEVER persisted here.
// ─────────────────────────────────────────────────────────────
const FinancialProfileSchema = new Schema(
  {
    account_number: {
      type: String,
      // Store only masked form, e.g. "XXXX-XXXX-XXXX-4321"
      match: [/^[X\d\-]+$/, 'account_number must be a masked account string'],
      trim: true,
    },
    credit_card_id: { type: String, trim: true },
    card_last4: {
      type: String,
      match: [/^\d{4}$/, 'card_last4 must be exactly 4 digits'],
      trim: true,
    },
    card_type: {
      type: String,
      enum: ['VISA', 'MASTERCARD', 'AMEX', 'RUPAY', 'DISCOVER'],
      uppercase: true,
    },
    bank_name: { type: String, trim: true },
    avg_balance: { type: Number, min: 0, default: 0 },
    currency: { type: String, default: 'INR', uppercase: true, trim: true },
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────
// SUB-SCHEMA: GeoPoint (reused by location fields)
// Supports MongoDB 2dsphere geospatial queries.
// ─────────────────────────────────────────────────────────────
const GeoPointSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude] — GeoJSON order
      validate: {
        validator: (v) => v.length === 2 && v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90,
        message: 'coordinates must be [longitude, latitude] within valid ranges',
      },
    },
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────
// SUB-SCHEMA: Location Profile
// Captures home base, habitual locations, and last seen coords.
// ─────────────────────────────────────────────────────────────
const LocationProfileSchema = new Schema(
  {
    home_location: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 },
      city: { type: String, trim: true },
      country: { type: String, trim: true, default: 'India' },
      geo: GeoPointSchema, // GeoJSON Point for $near queries
    },
    usual_locations: {
      type: [String],
      default: [],
      validate: {
        validator: (v) => v.length <= 50,
        message: 'usual_locations cannot exceed 50 entries',
      },
    },
    last_location: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 },
      geo: GeoPointSchema,
      timestamp: { type: Date, default: Date.now },
    },
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────
// SUB-SCHEMA: Trusted Device Entry
// Each device is fingerprinted and stored hashed.
// ─────────────────────────────────────────────────────────────
const TrustedDeviceSchema = new Schema(
  {
    device_id: { type: String, required: true, trim: true },
    device_type: {
      type: String,
      enum: ['MOBILE', 'TABLET', 'DESKTOP', 'SMARTWATCH', 'OTHER'],
      default: 'MOBILE',
    },
    os: { type: String, trim: true },           // e.g. "Android 14", "iOS 17"
    browser: { type: String, trim: true },       // e.g. "Chrome 124"
    fingerprint: {
      type: String,
      required: true,
      // Store SHA-256 hash of raw fingerprint — never the raw value
      match: [/^[a-f0-9]{64}$/, 'fingerprint must be a 64-char SHA-256 hex digest'],
      trim: true,
    },
    first_seen: { type: Date, default: Date.now },
    last_seen: { type: Date, default: Date.now },
    trusted: { type: Boolean, default: true },
  },
  { _id: true } // keep _id so individual devices can be targeted
);

// ─────────────────────────────────────────────────────────────
// SUB-SCHEMA: Device Profile
// ─────────────────────────────────────────────────────────────
const DeviceProfileSchema = new Schema(
  {
    trusted_devices: {
      type: [TrustedDeviceSchema],
      default: [],
      validate: {
        validator: (v) => v.length <= 20,
        message: 'A user may register at most 20 trusted devices',
      },
    },
    last_used_device: { type: String, trim: true }, // device_id reference
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────
// SUB-SCHEMA: Behavioral Profile
// Baseline metrics learned over time; used for anomaly scoring.
// ─────────────────────────────────────────────────────────────
const BehavioralProfileSchema = new Schema(
  {
    avg_transaction_amount: { type: Number, min: 0, default: 0 },
    max_transaction_amount: { type: Number, min: 0, default: 0 },
    avg_transactions_per_day: { type: Number, min: 0, default: 0 },
    usual_active_hours: {
      start: { type: Number, min: 0, max: 24, default: 9 },
      end: { type: Number, min: 0, max: 24, default: 22 },
    },
    typing_speed_avg: {
      // Characters per second — used for keystroke dynamics
      type: Number, min: 0, default: 0,
    },
    session_duration_avg: {
      // Seconds — average authenticated session length
      type: Number, min: 0, default: 0,
    },
    failed_attempts_avg: {
      // Daily average of failed auth attempts
      type: Number, min: 0, default: 0,
    },
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────
// SUB-SCHEMA: Transaction Pattern
// Spending habits used to detect merchant / category anomalies.
// ─────────────────────────────────────────────────────────────
const TransactionPatternSchema = new Schema(
  {
    common_merchants: {
      type: [String],
      default: [],
      validate: { validator: (v) => v.length <= 100, message: 'common_merchants limit is 100' },
    },
    common_categories: {
      type: [String],
      enum: [
        'FOOD', 'GROCERIES', 'FUEL', 'UTILITIES', 'RENT',
        'ENTERTAINMENT', 'TRAVEL', 'HEALTHCARE', 'EDUCATION',
        'SHOPPING', 'TRANSFER', 'INVESTMENT', 'OTHER',
      ],
      default: [],
    },
    avg_monthly_spend: { type: Number, min: 0, default: 0 },
    last_transaction_amount: { type: Number, min: 0, default: 0 },
    last_transaction_time: { type: Date },
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────
// SUB-SCHEMA: Risk Profile
// Live risk state maintained by the fraud engine.
// ─────────────────────────────────────────────────────────────
const RiskProfileSchema = new Schema(
  {
    trust_score: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    risk_level: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    last_risk_score: { type: Number, min: 0, max: 100, default: 50 },
    flags: {
      type: [String],
      default: [],
      validate: { validator: (v) => v.length <= 200, message: 'flags limit is 200' },
    },
    score_updated_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────
// SUB-SCHEMA: Blockchain Metadata
// Links the user's last on-chain transaction record.
// ─────────────────────────────────────────────────────────────
const BlockchainMetaSchema = new Schema(
  {
    last_transaction_hash: {
      type: String,
      trim: true,
      // SHA-256 hex (64 chars) or null
      match: [/^(0x)?[a-f0-9]{64}$|^$/, 'Invalid SHA-256 transaction hash'],
    },
    block_index: { type: Number, min: 0, default: null },
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────
// SUB-SCHEMA: Security Profile
// Authentication security controls and access metadata.
// ─────────────────────────────────────────────────────────────
const SecurityProfileSchema = new Schema(
  {
    two_factor_enabled: { type: Boolean, default: false },
    biometric_enabled: { type: Boolean, default: false },
    last_login_ip: {
      type: String,
      trim: true,
      // Accepts IPv4, IPv6, or empty
      match: [
        /^((\d{1,3}\.){3}\d{1,3}|([a-f0-9:]+))$|^$/,
        'last_login_ip must be a valid IPv4 or IPv6 address',
      ],
    },
    last_login_time: { type: Date },
    failed_login_count: { type: Number, min: 0, default: 0 },
    account_locked_until: { type: Date, default: null },
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────
// SUB-SCHEMA: Biometric Profile
// Stores ONLY the numeric embedding vector — never raw images.
// Face images must be discarded immediately after embedding extraction.
// ─────────────────────────────────────────────────────────────
const BiometricProfileSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    face_embedding: {
      type: [Number],
      default: [],
      validate: {
        // face-api.js produces 128-dim; FaceNet produces 512-dim
        validator: (v) => v.length === 0 || v.length === 128 || v.length === 512,
        message: 'face_embedding must be a 128 or 512-dimensional vector',
      },
    },
    embedding_model: {
      type: String,
      enum: ['face-api.js', 'facenet', 'arcface', 'deepface', 'insightface'],
      default: 'face-api.js',
    },
    last_verified: { type: Date, default: null },
    verification_confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────
// ROOT SCHEMA: User
// ─────────────────────────────────────────────────────────────
const UserSchema = new Schema(
  {
    // ── Identity ──────────────────────────────────────────────
    user_id: {
      type: String,
      required: [true, 'user_id is required'],
      unique: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'name is required'],
      trim: true,
      minlength: [2, 'name must be at least 2 characters'],
      maxlength: [120, 'name cannot exceed 120 characters'],
    },
    email: {
      type: String,
      required: [true, 'email is required'],
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'email must be a valid address'],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-]{7,20}$/, 'phone must be a valid number'],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'BLOCKED', 'SUSPENDED'],
      default: 'ACTIVE',
      index: true,
    },

    // ── Hashed Password ───────────────────────────────────────
    // Stored as bcrypt hash ($2b$); plaintext is NEVER persisted.
    password_hash: {
      type: String,
      required: [true, 'password_hash is required'],
      select: false, // excluded from queries by default
    },

    // ── Modular Sub-Documents ─────────────────────────────────
    financial:    { type: FinancialProfileSchema,    default: () => ({}) },
    location:     { type: LocationProfileSchema,     default: () => ({}) },
    devices:      { type: DeviceProfileSchema,       default: () => ({}) },
    behavioral:   { type: BehavioralProfileSchema,   default: () => ({}) },
    transactions: { type: TransactionPatternSchema,  default: () => ({}) },
    risk:         { type: RiskProfileSchema,         default: () => ({}) },
    blockchain:   { type: BlockchainMetaSchema,      default: () => ({}) },
    security:     { type: SecurityProfileSchema,     default: () => ({}) },
    biometric:    { type: BiometricProfileSchema,    default: () => ({}) },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'users',
    // Optimistic concurrency control for high-write fraud updates
    optimisticConcurrency: true,
  }
);

// ─────────────────────────────────────────────────────────────
// INDEXES
// ─────────────────────────────────────────────────────────────

// Compound: active users with high risk surface lots of fraud queries
UserSchema.index({ status: 1, 'risk.risk_level': 1 });

// Compound: fraud engine queries by trust score + status
UserSchema.index({ 'risk.trust_score': 1, status: 1 });

// Geospatial: proximity queries on last known location
UserSchema.index({ 'location.last_location.geo': '2dsphere' });
UserSchema.index({ 'location.home_location.geo': '2dsphere' });

// TTL-friendly: lookup by last transaction time for idle account detection
UserSchema.index({ 'transactions.last_transaction_time': -1 });

// Device fingerprint fast lookup
UserSchema.index({ 'devices.trusted_devices.fingerprint': 1 });

// Security: quick lockout checks
UserSchema.index({ 'security.account_locked_until': 1 }, { sparse: true });

// ─────────────────────────────────────────────────────────────
// VIRTUALS
// ─────────────────────────────────────────────────────────────

// Convenience: is the account currently accessible?
UserSchema.virtual('is_accessible').get(function () {
  if (this.status !== 'ACTIVE') return false;
  if (this.security?.account_locked_until && this.security.account_locked_until > new Date()) return false;
  return true;
});

// Convenience: has a verified biometric embedding?
UserSchema.virtual('has_biometric').get(function () {
  return !!(this.biometric?.enabled && this.biometric.face_embedding?.length > 0);
});

// ─────────────────────────────────────────────────────────────
// INSTANCE METHODS
// ─────────────────────────────────────────────────────────────

/**
 * Derive risk_level from trust_score so both fields stay consistent.
 * Call after any trust_score mutation before saving.
 */
UserSchema.methods.syncRiskLevel = function () {
  const score = this.risk?.trust_score ?? 50;
  if (score >= 80) this.risk.risk_level = 'LOW';
  else if (score >= 55) this.risk.risk_level = 'MEDIUM';
  else if (score >= 30) this.risk.risk_level = 'HIGH';
  else this.risk.risk_level = 'CRITICAL';
  this.risk.score_updated_at = new Date();
};

/**
 * Register a device as trusted, replacing any existing entry for the same
 * device_id and capping the list at 20.
 */
UserSchema.methods.upsertTrustedDevice = function (deviceData) {
  const list = this.devices.trusted_devices;
  const existing = list.findIndex((d) => d.device_id === deviceData.device_id);
  if (existing >= 0) {
    list[existing].last_seen = new Date();
    Object.assign(list[existing], deviceData);
  } else {
    if (list.length >= 20) list.shift(); // evict oldest
    list.push({ ...deviceData, first_seen: new Date(), last_seen: new Date() });
  }
  this.devices.last_used_device = deviceData.device_id;
};

// ─────────────────────────────────────────────────────────────
// PRE-SAVE HOOK: keep risk_level in sync whenever trust_score changes
// ─────────────────────────────────────────────────────────────
UserSchema.pre('save', function () {
  if (this.isModified('risk.trust_score')) {
    this.syncRiskLevel();
  }
});

// ─────────────────────────────────────────────────────────────
// STATIC METHODS
// ─────────────────────────────────────────────────────────────

/**
 * Find user by email — always excludes password_hash.
 */
UserSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

/**
 * Find user with password hash included (for auth flows only).
 */
UserSchema.statics.findByEmailWithPassword = function (email) {
  return this.findOne({ email: email.toLowerCase().trim() }).select('+password_hash');
};

/**
 * Fetch all HIGH / CRITICAL risk users for the fraud engine sweep.
 */
UserSchema.statics.findHighRiskUsers = function () {
  return this.find({
    status: 'ACTIVE',
    'risk.risk_level': { $in: ['HIGH', 'CRITICAL'] },
  }).select('user_id name email risk location.last_location');
};

// ─────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────
const User = mongoose.model('User', UserSchema);
module.exports = User;
