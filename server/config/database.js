// ============================================================
// Rakshak AI — MongoDB Connection Manager
// Handles connect / disconnect with retry and event logging.
// Set MONGODB_URI in your .env file.
// ============================================================

'use strict';

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rakshak_ai';

const MONGOOSE_OPTIONS = {
  // Connection pool: tuned for a moderate-traffic fraud-detection API
  maxPoolSize: 20,
  minPoolSize: 5,
  serverSelectionTimeoutMS: 5000,  // fail fast if Mongo is unreachable
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  heartbeatFrequencyMS: 10000,

  // Retryable writes: safe for transaction upserts
  retryWrites: true,
  writeConcern: { w: 'majority' },
};

let isConnected = false;

/**
 * Connect to MongoDB.
 * Safe to call multiple times — subsequent calls are no-ops when
 * the connection is already established (useful in serverless envs).
 */
async function connectDB() {
  if (isConnected) return;

  try {
    await mongoose.connect(MONGO_URI, MONGOOSE_OPTIONS);
    isConnected = true;
    console.log(`[MongoDB] Connected → ${sanitizeUri(MONGO_URI)}`);
  } catch (err) {
    console.error('[MongoDB] Initial connection failed:', err.message);
    process.exit(1); // hard exit — app cannot function without DB
  }
}

/**
 * Gracefully close the connection (use in test teardown / shutdown hooks).
 */
async function disconnectDB() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('[MongoDB] Disconnected');
}

// ─── Connection event listeners ──────────────────────────────
mongoose.connection.on('connected', () => {
  isConnected = true;
  console.log('[MongoDB] Connection established');
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('[MongoDB] Connection lost — Mongoose will retry automatically');
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] Connection error:', err.message);
});

// Graceful shutdown on SIGINT / SIGTERM
async function gracefulShutdown(signal) {
  console.log(`[MongoDB] ${signal} received — closing connection`);
  await disconnectDB();
  process.exit(0);
}
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Strip credentials from a URI for safe logging.
 * mongodb+srv://user:pass@cluster → mongodb+srv://***@cluster
 */
function sanitizeUri(uri) {
  try {
    const u = new URL(uri);
    if (u.password) u.password = '***';
    if (u.username) u.username = '***';
    return u.toString();
  } catch {
    return '[invalid URI]';
  }
}

module.exports = { connectDB, disconnectDB, mongoose };
