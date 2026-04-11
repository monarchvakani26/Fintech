// ============================================================
// Rakshak AI — Socket.IO Real-Time Engine
// Broadcasts user data changes to all connected dashboards.
// ============================================================

'use strict';

const { Server } = require('socket.io');

let io = null;

/**
 * Initialize Socket.IO on an existing HTTP server.
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Client joins a user-specific room for targeted updates
    socket.on('join-user-room', (userId) => {
      socket.join(`user:${userId}`);
      console.log(`[Socket.IO] ${socket.id} joined room user:${userId}`);
    });

    // Client joins the dashboard room for global broadcasts
    socket.on('join-dashboard', () => {
      socket.join('dashboard');
      console.log(`[Socket.IO] ${socket.id} joined dashboard room`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id} — ${reason}`);
    });
  });

  console.log('[Socket.IO] Real-time engine initialized');
  return io;
}

/**
 * Get the Socket.IO instance (throws if not initialized).
 */
function getIO() {
  if (!io) throw new Error('[Socket.IO] Not initialized — call initSocket() first');
  return io;
}

/**
 * Emit a user-data-updated event to the dashboard and user-specific room.
 * @param {string} userId
 * @param {string} section - which section changed (profile, financial, location, device, behavior, biometric, risk)
 * @param {object} data   - the updated data payload
 */
function emitUserUpdate(userId, section, data) {
  if (!io) return;
  const payload = {
    userId,
    section,
    data,
    timestamp: new Date().toISOString(),
  };
  io.to(`user:${userId}`).emit('user-data-updated', payload);
  io.to('dashboard').emit('user-data-updated', payload);
}

/**
 * Emit a risk-score-changed event.
 */
function emitRiskUpdate(userId, riskData) {
  if (!io) return;
  const payload = {
    userId,
    ...riskData,
    timestamp: new Date().toISOString(),
  };
  io.to(`user:${userId}`).emit('risk-score-changed', payload);
  io.to('dashboard').emit('risk-score-changed', payload);
}

/**
 * Emit a new-transaction event to the user's room and dashboard room.
 * @param {string} userId
 * @param {object} transaction - the completed transaction object
 */
function emitTransactionUpdate(userId, transaction) {
  if (!io) return;
  const payload = {
    userId,
    transaction,
    timestamp: new Date().toISOString(),
  };
  io.to(`user:${userId}`).emit('transaction-update', payload);
  io.to('dashboard').emit('transaction-update', payload);
}

module.exports = { initSocket, getIO, emitUserUpdate, emitRiskUpdate, emitTransactionUpdate };
