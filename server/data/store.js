// ============================================================
// Rakshak AI - In-Memory Datastore with Seed Data
// Simulates MongoDB for demo purposes
// ============================================================

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Helper: generate transaction hash (blockchain simulation)
function generateTxHash(data) {
  return '0x' + crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

// Helper: generate a reference ID
function genRef(prefix = 'TXN') {
  const num = Math.floor(Math.random() * 90000) + 10000;
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const letter = letters[Math.floor(Math.random() * letters.length)];
  return `${prefix}-${num}-${letter}`;
}

// Helper: random date in last 30 days
function randomDate(daysBack = 30) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return d;
}

// Pre-hash passwords synchronously for seed
const salt = bcrypt.genSaltSync(12);
const demoPasswordHash = bcrypt.hashSync('Demo@123', salt);

// ============================================================
// WATCHLIST
// ============================================================
const watchlist = [
  { id: uuidv4(), vpa: 'fraud001@darkweb', reason: 'Known phishing account', severity: 'CRITICAL', reportCount: 47, addedAt: new Date('2024-01-15') },
  { id: uuidv4(), vpa: 'scam@fakepay', reason: 'Advance fee fraud', severity: 'HIGH', reportCount: 23, addedAt: new Date('2024-02-20') },
  { id: uuidv4(), vpa: 'unknown_merchant@ybl', reason: 'POS fraud ring', severity: 'HIGH', reportCount: 15, addedAt: new Date('2024-03-10') },
  { id: uuidv4(), vpa: 'suspicious@paytm', reason: 'Money mule network', severity: 'MEDIUM', reportCount: 8, addedAt: new Date('2024-04-01') },
  { id: uuidv4(), vpa: 'cashout@upi', reason: 'Rapid cashout pattern', severity: 'LOW', reportCount: 3, addedAt: new Date('2024-05-15') },
];

// ============================================================
// USERS
// ============================================================
const users = [
  {
    id: 'user-demo-001',
    email: 'demo@rakshak.ai',
    password: demoPasswordHash,
    name: 'Arjun Sharma',
    phone: '+91 98765 43210',
    balance: 142859000.50,
    trustScore: 92,
    trustStatus: 'EXTREME SECURITY',
    devices: [
      {
        id: uuidv4(),
        fingerprint: crypto.createHash('sha256').update('trusted-device-001').digest('hex'),
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        platform: 'Windows',
        screenResolution: '1920x1080',
        timezone: 'Asia/Kolkata',
        trusted: true,
        transactionCount: 48,
        firstSeen: new Date('2024-01-01'),
        lastSeen: new Date(),
      },
      {
        id: uuidv4(),
        fingerprint: crypto.createHash('sha256').update('trusted-device-002').digest('hex'),
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
        platform: 'iPhone',
        screenResolution: '390x844',
        timezone: 'Asia/Kolkata',
        trusted: true,
        transactionCount: 12,
        firstSeen: new Date('2024-03-15'),
        lastSeen: new Date(),
      }
    ],
    locations: [
      { ip: '103.21.58.1', country: 'India', city: 'Mumbai', region: 'Maharashtra', isVPN: false, count: 45, lastSeen: new Date() },
      { ip: '103.22.100.5', country: 'India', city: 'Mumbai', region: 'Maharashtra', isVPN: false, count: 15, lastSeen: new Date() },
    ],
    transactionStats: { totalCount: 50, approvedCount: 48, reviewCount: 2, blockedCount: 0, averageAmount: 18500, totalVolume: 925000 },
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date(),
    avatar: 'AS',
  },
  {
    id: 'user-demo-002',
    email: 'suspicious@rakshak.ai',
    password: demoPasswordHash,
    name: 'Mihir Chaudhary',
    phone: '+91 87654 32109',
    balance: 850000,
    trustScore: 68,
    trustStatus: 'MODERATE SECURITY',
    devices: [
      {
        id: uuidv4(),
        fingerprint: crypto.createHash('sha256').update('trusted-device-003').digest('hex'),
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        platform: 'Mac',
        screenResolution: '2560x1600',
        timezone: 'Asia/Kolkata',
        trusted: true,
        transactionCount: 18,
        firstSeen: new Date('2024-02-01'),
        lastSeen: new Date(),
      }
    ],
    locations: [
      { ip: '49.36.10.1', country: 'India', city: 'Bangalore', region: 'Karnataka', isVPN: false, count: 18, lastSeen: new Date() },
      { ip: '157.32.66.5', country: 'India', city: 'Delhi', region: 'Delhi', isVPN: false, count: 2, lastSeen: new Date() },
    ],
    transactionStats: { totalCount: 20, approvedCount: 16, reviewCount: 2, blockedCount: 2, averageAmount: 8200, totalVolume: 164000 },
    createdAt: new Date('2024-02-01'),
    lastLogin: new Date(),
    avatar: 'MC',
  },
  {
    id: 'user-demo-003',
    email: 'risky@rakshak.ai',
    password: demoPasswordHash,
    name: 'Vikram Osei',
    phone: '+91 76543 21098',
    balance: 500000,
    trustScore: 35,
    trustStatus: 'AT RISK',
    devices: [
      {
        id: uuidv4(),
        fingerprint: crypto.createHash('sha256').update('trusted-device-004').digest('hex'),
        userAgent: 'Mozilla/5.0 (Linux; Android 13)',
        platform: 'Android',
        screenResolution: '1080x2400',
        timezone: 'Asia/Kolkata',
        trusted: true,
        transactionCount: 5,
        firstSeen: new Date('2024-05-01'),
        lastSeen: new Date(),
      }
    ],
    locations: [
      { ip: '197.210.29.5', country: 'Nigeria', city: 'Lagos', region: 'Lagos State', isVPN: true, count: 7, lastSeen: new Date() },
      { ip: '103.150.92.1', country: 'India', city: 'Chennai', region: 'Tamil Nadu', isVPN: false, count: 3, lastSeen: new Date() },
    ],
    transactionStats: { totalCount: 10, approvedCount: 4, reviewCount: 1, blockedCount: 5, averageAmount: 45000, totalVolume: 450000 },
    createdAt: new Date('2024-05-01'),
    lastLogin: new Date(),
    avatar: 'VO',
  }
];

// ============================================================
// TRANSACTION SEED DATA
// ============================================================
const recipientExamples = [
  { vpa: 'hdfc.settlement@bank', name: 'HDFC Settlement Bank', icon: '🏦', onWatchlist: false },
  { vpa: 'mihir.chaudhary@okaxis', name: 'Mihir Chaudhary', icon: '👤', onWatchlist: false },
  { vpa: 'unknown_merchant@ybl', name: 'Unknown Merchant X', icon: '⚠️', onWatchlist: true },
  { vpa: 'aws.billing@amazon', name: 'Amazon Web Services', icon: '☁️', onWatchlist: false },
  { vpa: 'swiggy.orders@paytm', name: 'Swiggy Food Delivery', icon: '🍔', onWatchlist: false },
  { vpa: 'netflix.india@okicici', name: 'Netflix India', icon: '🎬', onWatchlist: false },
  { vpa: 'zomato@upi', name: 'Zomato Payments', icon: '🍕', onWatchlist: false },
  { vpa: 'indiahome@airtel', name: 'Airtel Broadband', icon: '📡', onWatchlist: false },
  { vpa: 'tatapower@oksbi', name: 'Tata Power', icon: '⚡', onWatchlist: false },
  { vpa: 'fraud001@darkweb', name: 'Fraud Entity 001', icon: '🚫', onWatchlist: true },
];

const txTypes = ['Inbound Ledger', 'External Transfer', 'POS Withdrawal', 'Subscription', 'SWIFT Transfer', 'ACH Payment', 'Direct Debit', 'Wire Transfer'];

function buildTransaction(userId, overrides = {}) {
  const recipient = recipientExamples[Math.floor(Math.random() * (recipientExamples.length - 2))];
  const type = txTypes[Math.floor(Math.random() * txTypes.length)];
  const amount = Math.floor(Math.random() * 100000) + 1000;
  const riskScore = Math.floor(Math.random() * 100);
  const decision = riskScore < 31 ? 'APPROVED' : riskScore < 70 ? 'REVIEW' : 'BLOCKED';
  const status = decision;
  const timestamp = randomDate(30);
  const hash = generateTxHash({ userId, recipient: recipient.vpa, amount, timestamp: timestamp.toISOString(), nonce: uuidv4() });

  return {
    id: uuidv4(),
    userId,
    reference: genRef(),
    recipient,
    type,
    amount,
    currency: 'INR',
    note: 'Payment for services',
    status,
    riskAnalysis: {
      riskScore,
      decision,
      riskFactors: riskScore > 30 ? ['High Transaction Amount', 'New Device Fingerprint'] : [],
      breakdown: {
        amountRisk: Math.min(50, Math.floor(amount / 2500)),
        deviceRisk: Math.floor(Math.random() * 30),
        locationRisk: Math.floor(Math.random() * 25),
        behaviorRisk: Math.floor(Math.random() * 20),
        velocityRisk: Math.floor(Math.random() * 15),
        recipientRisk: recipient.onWatchlist ? 15 : 0,
      },
      deviceInfo: { fingerprint: crypto.createHash('sha256').update('trusted-device-001').digest('hex'), isNewDevice: false, isTrusted: true, platform: 'Windows' },
      locationInfo: { ip: '103.21.58.1', country: 'India', city: 'Mumbai', isVPN: false, isBlacklisted: false, mismatch: false },
      comparisonMatrix: { standardAmount: 18500, requestedAmount: amount, variance: `${((amount - 18500) / 18500 * 100).toFixed(0)}%` },
      aiConsensus: { totalNodes: 5, agreeCount: riskScore < 31 ? 5 : riskScore < 70 ? 3 : 4, consensusStrength: 'Strong', recommendation: decision },
      analysisSteps: [
        { step: 'Device Fingerprint Verification', status: 'completed', duration: 312 },
        { step: 'Location Intelligence', status: 'completed', duration: 445 },
        { step: 'Behavioral Analysis', status: 'completed', duration: 523 },
        { step: 'AI Risk Scoring', status: 'completed', duration: 789 },
        { step: 'Blockchain Hash Generation', status: 'completed', duration: 102 },
      ],
    },
    transactionHash: hash,
    metadata: { userTrustScoreAtTime: 92, transactionHour: timestamp.getHours() },
    createdAt: timestamp,
    processedAt: new Date(timestamp.getTime() + 8000),
    ...overrides,
  };
}

// Build seed transactions
const transactions = [];

// User 1 (demo) - 50 transactions, mostly approved
for (let i = 0; i < 48; i++) {
  const riskScore = Math.floor(Math.random() * 30); // low risk
  transactions.push(buildTransaction('user-demo-001', {
    status: 'APPROVED',
    riskAnalysis: { ...buildTransaction('user-demo-001').riskAnalysis, riskScore, decision: 'APPROVED', riskFactors: [] },
  }));
}
// 2 review for user1
transactions.push(buildTransaction('user-demo-001', {
  reference: 'TXN-2831-B',
  recipient: recipientExamples[1],
  type: 'External Transfer',
  amount: 85000,
  status: 'REVIEW',
  riskAnalysis: {
    riskScore: 48,
    decision: 'REVIEW',
    riskFactors: ['High Transaction Amount', 'New Device Detected', 'Unusual Time of Transaction'],
    breakdown: { amountRisk: 30, deviceRisk: 15, locationRisk: 0, behaviorRisk: 10, velocityRisk: 0, recipientRisk: 0 },
    deviceInfo: { fingerprint: 'new-device-hash', isNewDevice: true, isTrusted: false, platform: 'Unknown' },
    locationInfo: { ip: '103.21.58.1', country: 'India', city: 'Delhi', isVPN: false, isBlacklisted: false, mismatch: true },
    comparisonMatrix: { standardAmount: 18500, requestedAmount: 85000, variance: '+359%' },
    aiConsensus: { totalNodes: 5, agreeCount: 3, consensusStrength: 'Moderate', recommendation: 'REVIEW' },
    analysisSteps: [
      { step: 'Device Fingerprint Verification', status: 'completed', duration: 450 },
      { step: 'Location Intelligence', status: 'completed', duration: 610 },
      { step: 'Behavioral Analysis', status: 'completed', duration: 700 },
      { step: 'AI Risk Scoring', status: 'completed', duration: 920 },
      { step: 'Blockchain Hash Generation', status: 'completed', duration: 120 },
    ],
  },
  transactionHash: generateTxHash({ id: 'txn-review-1', nonce: 'abc123' }),
  createdAt: new Date('2024-10-24T14:22:10Z'),
}));

// Specific dashboard transactions
transactions.push({
  id: uuidv4(),
  userId: 'user-demo-001',
  reference: 'TXN-9402-A',
  recipient: recipientExamples[0],
  type: 'Inbound Ledger',
  amount: 2450000,
  currency: 'INR',
  note: 'Settlement credit',
  status: 'APPROVED',
  riskAnalysis: { riskScore: 8, decision: 'APPROVED', riskFactors: [], breakdown: { amountRisk: 5, deviceRisk: 0, locationRisk: 0, behaviorRisk: 2, velocityRisk: 0, recipientRisk: 0 }, deviceInfo: { isNewDevice: false, isTrusted: true }, locationInfo: { country: 'India', isVPN: false, isBlacklisted: false, mismatch: false }, comparisonMatrix: { standardAmount: 18500, requestedAmount: 2450000, variance: '+13143%' }, aiConsensus: { totalNodes: 5, agreeCount: 5, consensusStrength: 'Strong', recommendation: 'APPROVED' }, analysisSteps: [] },
  transactionHash: generateTxHash({ id: 'txn-9402', nonce: 'hdfc-settle' }),
  metadata: { userTrustScoreAtTime: 92, transactionHour: 10 },
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  processedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 8000),
});

transactions.push({
  id: uuidv4(),
  userId: 'user-demo-001',
  reference: 'TXN-0012-C',
  recipient: { vpa: 'unknown_merchant@ybl', name: 'Unknown Merchant X', icon: '⚠️', onWatchlist: true },
  type: 'POS Withdrawal',
  amount: 120000,
  currency: 'INR',
  note: 'POS Transaction',
  status: 'BLOCKED',
  riskAnalysis: {
    riskScore: 88,
    decision: 'BLOCKED',
    riskFactors: ['Location Mismatch Detected', 'VPN/Proxy Detected', 'Recipient on Watchlist', 'Extreme Amount Variance'],
    breakdown: { amountRisk: 30, deviceRisk: 30, locationRisk: 25, behaviorRisk: 10, velocityRisk: 20, recipientRisk: 15 },
    deviceInfo: { isNewDevice: true, isTrusted: false, platform: 'Unknown' },
    locationInfo: { ip: '185.220.101.45', country: 'Netherlands', city: 'Amsterdam', isVPN: true, isBlacklisted: true, mismatch: true },
    comparisonMatrix: { standardAmount: 18500, requestedAmount: 120000, variance: '+548%' },
    aiConsensus: { totalNodes: 5, agreeCount: 4, consensusStrength: 'Strong', recommendation: 'BLOCKED' },
    analysisSteps: [],
  },
  transactionHash: generateTxHash({ id: 'txn-0012', nonce: 'blocked1' }),
  metadata: { userTrustScoreAtTime: 92, transactionHour: 3 },
  createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  processedAt: new Date(Date.now() - 5 * 60 * 60 * 1000 + 4000),
});

transactions.push({
  id: uuidv4(),
  userId: 'user-demo-001',
  reference: 'TXN-7734-D',
  recipient: recipientExamples[5],
  type: 'Subscription',
  amount: 432000,
  currency: 'INR',
  note: 'AWS Enterprise subscription',
  status: 'APPROVED',
  riskAnalysis: { riskScore: 12, decision: 'APPROVED', riskFactors: [], breakdown: { amountRisk: 10, deviceRisk: 0, locationRisk: 0, behaviorRisk: 2, velocityRisk: 0, recipientRisk: 0 }, deviceInfo: { isNewDevice: false, isTrusted: true }, locationInfo: { country: 'India', isVPN: false, isBlacklisted: false, mismatch: false }, comparisonMatrix: { standardAmount: 18500, requestedAmount: 432000, variance: '+2235%' }, aiConsensus: { totalNodes: 5, agreeCount: 5, consensusStrength: 'Strong', recommendation: 'APPROVED' }, analysisSteps: [] },
  transactionHash: generateTxHash({ id: 'txn-7734', nonce: 'aws-sub' }),
  metadata: { userTrustScoreAtTime: 92, transactionHour: 9 },
  createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  processedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 6000),
});

// User 2 transactions
for (let i = 0; i < 16; i++) {
  transactions.push(buildTransaction('user-demo-002', { status: 'APPROVED' }));
}
for (let i = 0; i < 2; i++) {
  transactions.push(buildTransaction('user-demo-002', {
    status: 'REVIEW',
    riskAnalysis: { ...buildTransaction('user-demo-002').riskAnalysis, riskScore: 45 + i * 5, decision: 'REVIEW' },
  }));
}
for (let i = 0; i < 2; i++) {
  transactions.push(buildTransaction('user-demo-002', {
    status: 'BLOCKED',
    riskAnalysis: { ...buildTransaction('user-demo-002').riskAnalysis, riskScore: 75 + i * 5, decision: 'BLOCKED' },
  }));
}

// User 3 transactions
for (let i = 0; i < 4; i++) {
  transactions.push(buildTransaction('user-demo-003', { status: 'APPROVED' }));
}
transactions.push(buildTransaction('user-demo-003', { status: 'REVIEW', riskAnalysis: { ...buildTransaction('user-demo-003').riskAnalysis, riskScore: 55, decision: 'REVIEW' } }));
for (let i = 0; i < 5; i++) {
  transactions.push(buildTransaction('user-demo-003', {
    status: 'BLOCKED',
    riskAnalysis: { ...buildTransaction('user-demo-003').riskAnalysis, riskScore: 80 + i * 3, decision: 'BLOCKED' },
  }));
}

// Token blacklist (for logout)
const tokenBlacklist = new Set();

// ============================================================
// STORE API
// ============================================================
const store = {
  // Users
  findUserByEmail: (email) => users.find(u => u.email === email.toLowerCase()),
  findUserById: (id) => users.find(u => u.id === id),
  updateUser: (id, updates) => {
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...updates };
    return users[idx];
  },

  // Transactions
  getTransactions: (userId, filters = {}) => {
    let txns = transactions.filter(t => t.userId === userId);
    if (filters.status && filters.status !== 'ALL') txns = txns.filter(t => t.status === filters.status);
    if (filters.search) {
      const s = filters.search.toLowerCase();
      txns = txns.filter(t =>
        t.reference.toLowerCase().includes(s) ||
        t.recipient.name.toLowerCase().includes(s) ||
        t.recipient.vpa.toLowerCase().includes(s) ||
        String(t.amount).includes(s)
      );
    }
    if (filters.dateFrom) txns = txns.filter(t => new Date(t.createdAt) >= new Date(filters.dateFrom));
    if (filters.dateTo) txns = txns.filter(t => new Date(t.createdAt) <= new Date(filters.dateTo));
    if (filters.minAmount) txns = txns.filter(t => t.amount >= Number(filters.minAmount));
    if (filters.maxAmount) txns = txns.filter(t => t.amount <= Number(filters.maxAmount));
    if (filters.riskLevel) {
      if (filters.riskLevel === 'LOW') txns = txns.filter(t => t.riskAnalysis.riskScore <= 30);
      if (filters.riskLevel === 'MEDIUM') txns = txns.filter(t => t.riskAnalysis.riskScore > 30 && t.riskAnalysis.riskScore < 70);
      if (filters.riskLevel === 'HIGH') txns = txns.filter(t => t.riskAnalysis.riskScore >= 70);
    }
    // Sort
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';
    txns.sort((a, b) => {
      let va = a[sortBy] || (sortBy === 'riskScore' ? a.riskAnalysis.riskScore : 0);
      let vb = b[sortBy] || (sortBy === 'riskScore' ? b.riskAnalysis.riskScore : 0);
      if (va instanceof Date) va = va.getTime();
      if (vb instanceof Date) vb = vb.getTime();
      return sortOrder === 'desc' ? vb - va : va - vb;
    });
    return txns;
  },

  findTransactionById: (id) => transactions.find(t => t.id === id),

  addTransaction: (txn) => {
    transactions.unshift(txn);
    return txn;
  },

  updateTransaction: (id, updates) => {
    const idx = transactions.findIndex(t => t.id === id);
    if (idx === -1) return null;
    transactions[idx] = { ...transactions[idx], ...updates };
    return transactions[idx];
  },

  // Watchlist
  isOnWatchlist: (vpa) => watchlist.some(w => w.vpa === vpa),
  addToWatchlist: (entry) => watchlist.push({ id: uuidv4(), ...entry, addedAt: new Date() }),

  // Token blacklist
  blacklistToken: (token) => tokenBlacklist.add(token),
  isTokenBlacklisted: (token) => tokenBlacklist.has(token),

  // Get ALL transactions across all users (for security metrics)
  getAllTransactions: () => transactions,

  // Generate reference
  genRef,
  generateTxHash,
};

module.exports = store;
