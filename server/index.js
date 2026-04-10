// ============================================================
// Rakshak AI - The Sovereign Archive
// Express.js Backend Server
// ============================================================

require('dotenv').config();
const express = require('express');
const { connectDB } = require('./config/database');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // generous for demo/hackathon
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
    version: '1.0.0',
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

// ========== START SERVER ==========
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  RAKSHAK AI - THE SOVEREIGN ARCHIVE   ║');
    console.log('╠════════════════════════════════════════╣');
    console.log(`║  Server running on port ${PORT}           ║`);
    console.log('║  Status: SOVEREIGN ACTIVE              ║');
    console.log('║  Neural Engine: ONLINE                 ║');
    console.log('║  Database: MONGODB CONNECTED           ║');
    console.log('╚════════════════════════════════════════╝\n');
  });
});

module.exports = app;
