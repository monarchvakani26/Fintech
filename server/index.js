// ============================================================
// Rakshak AI - The Sovereign Archive
// Express.js Backend Server + WebSocket Live Threat Feed
// ============================================================

require('dotenv').config();
const express = require('express');
const { connectDB } = require('./config/database');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const http = require('http');

let WebSocketServer;
try { ({ WebSocketServer } = require('ws')); } catch (e) { WebSocketServer = null; }

const app = express();
const PORT = process.env.PORT || 5000;

// ========== SECURITY MIDDLEWARE ==========
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ========== BODY PARSING ==========
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ========== LOGGING ==========
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ========== HEALTH CHECK ==========
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    message: 'Rakshak AI Sovereign Archive - Online',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    websocket: WebSocketServer ? 'active' : 'unavailable',
  });
});

// ========== ROUTES ==========
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/demo', require('./routes/demo'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/blockchain', require('./routes/blockchain'));
app.use('/api/security', require('./routes/security'));

// ========== SEED BLOCKCHAIN FROM EXISTING DATA ==========
const store = require('./data/store');
const blockchain = require('./services/blockchain');
// Seed blockchain from all existing seed transactions (user-demo-001)
const seedTxns = store.getTransactions('user-demo-001');
blockchain.seedFromTransactions(seedTxns);

// ========== 404 HANDLER ==========
app.use('/{*splat}', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ========== GLOBAL ERROR HANDLER ==========
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// ========== WEBSOCKET LIVE THREAT FEED ==========
const server = http.createServer(app);

let broadcast = () => {};

if (WebSocketServer) {
  const wss = new WebSocketServer({ server });

  broadcast = (data) => {
    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify(data));
      }
    });
  };

  wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Rakshak AI Live Threat Feed Active' }));
  });

  const THREAT_EVENTS = [
    { eventStatus: 'BLOCKED', amount: 215000, recipient: 'fraud001@darkweb', score: 94, location: 'Amsterdam, NL', factor: 'VPN + Blacklisted IP' },
    { eventStatus: 'REVIEW',  amount: 75000,  recipient: 'new.vendor@ybl',   score: 58, location: 'Jaipur, IN',    factor: 'New Device + Late Night' },
    { eventStatus: 'BLOCKED', amount: 450000, recipient: 'scam@fakepay',     score: 89, location: 'Lagos, NG',     factor: 'Recipient Watchlisted' },
    { eventStatus: 'APPROVED',amount: 8500,   recipient: 'priya.sharma@upi', score: 8,  location: 'Bangalore, IN', factor: 'Trusted Pattern' },
    { eventStatus: 'BLOCKED', amount: 180000, recipient: 'cashout@upi',      score: 76, location: 'Beijing, CN',   factor: 'Country Mismatch + VPN' },
  ];

  let threatIdx = 0;
  const emitThreat = () => {
    const event = THREAT_EVENTS[threatIdx % THREAT_EVENTS.length];
    broadcast({
      type: 'THREAT_EVENT',
      ...event,
      reference: `TXN-${Math.floor(Math.random() * 90000) + 10000}`,
      timestamp: new Date().toISOString(),
    });
    threatIdx++;
    // Schedule next threat with random interval 12-20 seconds
    setTimeout(emitThreat, 12000 + Math.random() * 8000);
  };

  // Start threat feed after 5 seconds
  setTimeout(emitThreat, 5000);

  console.log('WebSocket Live Threat Feed: ACTIVE');
}

// ========== START SERVER ==========
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  RAKSHAK AI - THE SOVEREIGN ARCHIVE   ║');
    console.log('╠════════════════════════════════════════╣');
    console.log(`║  Server running on port ${PORT}           ║`);
    console.log('║  Status: SOVEREIGN ACTIVE              ║');
    console.log('║  Neural Engine: ONLINE                 ║');
    console.log('║  Database: MONGODB CONNECTED           ║');
    console.log('║  WebSocket: LIVE THREAT FEED ACTIVE    ║');
    console.log('╠════════════════════════════════════════╣');
    console.log('║  Demo Accounts:                        ║');
    console.log('║  demo@rakshak.ai / Demo@123            ║');
    console.log('║  suspicious@rakshak.ai / Demo@123      ║');
    console.log('║  risky@rakshak.ai / Demo@123           ║');
    console.log('╚════════════════════════════════════════╝\n');
  });
});


module.exports = { app, server, broadcast };
