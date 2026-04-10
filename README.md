# 🛡️ Rakshak AI — The Sovereign Archive

> **AI-powered pre-emptive fraud detection for financial transactions**  
> Built for hackathon judging — intercepts fraud *before* execution, not after.

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- npm or yarn

### Run Locally

**Terminal 1 — Backend (Port 5000)**
```bash
cd server
npm start
```

**Terminal 2 — Frontend (Port 3000)**
```bash
cd client
npm run dev
```

Open → **http://localhost:3000**

---

## 🔐 Demo Accounts

| Email | Password | Trust Score | Profile |
|-------|----------|-------------|---------|
| `demo@rakshak.ai` | `Demo@123` | 92 — Extreme Security | Clean profile, 50 approved transactions |
| `suspicious@rakshak.ai` | `Demo@123` | 68 — Moderate Security | 2 blocked transactions |
| `risky@rakshak.ai` | `Demo@123` | 35 — At Risk | 5 blocked, high-risk profile |

---

## 🎯 Hackathon Demo Flow

### Demo Mode Panel (Bottom-Right of Dashboard)

Click the demo buttons to instantly run pre-configured fraud scenarios:

| Button | Amount | Risk Score | Decision |
|--------|--------|------------|----------|
| ⚡ **Safe Transaction** | ₹5,000 | 12 | ✅ AUTO-APPROVED |
| ⚠️ **Suspicious Activity** | ₹75,000 | 58 | 🟡 MANUAL REVIEW |
| 🚫 **Fraud Attempt** | ₹2,15,000 | 94 | ❌ BLOCKED |

---

## 🧠 Core Innovation: Multi-Layer Fraud Engine

```
Risk Score = AmountRisk + DeviceRisk + LocationRisk + BehaviorRisk + VelocityRisk + RecipientRisk

0–30   → AUTO-APPROVED  ✅
31–69  → MANUAL REVIEW  🟡
70–100 → BLOCKED        ❌
```

### 5-Node AI Consensus
Each transaction is evaluated by 5 independently-weighted AI nodes:
- **Conservative** — weights amount heavily
- **Device-Focused** — weights device fingerprint heavily
- **Location-Focused** — weights geolocation heavily
- **Behavioral** — weights transaction patterns heavily
- **Balanced** — equal weights

### Device Fingerprinting
Generates a unique 256-bit device signature from:
- Canvas rendering fingerprint
- WebGL renderer info
- Screen resolution, timezone, platform
- Hardware concurrency, device memory
- Browser plugins and language settings

### Blockchain Simulation
Every transaction gets a SHA-256 hash:
```
0x8f3a9b2c7e1d4f6a8b9c0e2f5a7b3d9c4e6f1a8b3c5d7e9f2a4b6c8d0e1f3a5b
```

---

## 📡 API Reference

```
POST   /api/auth/login                  Login with email + password + device fingerprint
GET    /api/auth/me                     Get current user
POST   /api/payments/initiate           Start a new transaction
POST   /api/payments/analyze/:id        Run fraud analysis
GET    /api/payments/result/:id         Get transaction result
GET    /api/transactions                List transactions with filters
PATCH  /api/transactions/:id/approve    Manually approve REVIEW transaction
PATCH  /api/transactions/:id/block      Manually block REVIEW transaction
GET    /api/audit                       Audit trail with filters + pagination
GET    /api/audit/export?format=csv     Export to CSV
POST   /api/demo/safe-transaction       Demo: approved scenario
POST   /api/demo/suspicious-transaction Demo: review scenario
POST   /api/demo/fraud-transaction      Demo: blocked scenario
GET    /api/analytics/fraud-trends      7-day fraud trend data
GET    /api/analytics/risk-distribution Risk score distribution
GET    /api/analytics/top-risk-factors  Most common risk factors
GET    /api/health                      Server health check
```

---

## 🏗️ Architecture

```
Fintech/
├── server/                     Node.js + Express backend
│   ├── index.js                Entry point, middleware, routes
│   ├── data/store.js           In-memory database with seed data
│   ├── services/
│   │   ├── fraudEngine.js      Core risk scoring algorithm
│   │   ├── trustScore.js       Trust score calculation
│   │   └── blockchainSim.js    SHA-256 hash generation
│   ├── middleware/auth.js      JWT verification
│   └── routes/                 auth, dashboard, payments, transactions, audit, demo, analytics
│
└── client/                     React 18 + Vite + Tailwind CSS
    └── src/
        ├── pages/              Login, Dashboard, Payments, PaymentAnalysis, PaymentResult, AuditTrail, Settings
        ├── components/
        │   ├── layout/         DashboardLayout, Sidebar, Header
        │   ├── dashboard/      TrustScoreGauge, DemoPanel
        │   └── common/         StatusBadge, RiskScoreBar
        ├── context/AuthContext.jsx
        ├── services/api.js     Axios + interceptors
        └── utils/              deviceFingerprint, formatters
```

---

## 🔒 Security Features

- **JWT Auth** — 24-hour expiry, token blacklist on logout
- **bcryptjs** — Password hashing with 12 salt rounds
- **Helmet.js** — Security headers (XSS, CSRF, clickjacking protection)
- **Rate Limiting** — 200 requests per 15 minutes per IP
- **CORS** — Restricted to `localhost:3000` only
- **Device Fingerprinting** — SHA-256 hashed before storage

---

## 🎨 Design System

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#722f37` | Buttons, accents, active states |
| Cream BG | `#EFDFBB` | Main background |
| Light Cream | `#F5EDD8` | Cards, inputs |
| Dark | `#1a0a0c` | Text |

---

## 🏆 Innovation Highlights

1. **Pre-emptive** — Analyzes BEFORE funds move, not after
2. **Explainable AI** — Every decision shows exactly why (risk factors)
3. **5-Node Consensus** — Distributed AI agreement reduces false positives
4. **Device DNA** — Canvas + WebGL fingerprinting catches account takeovers
5. **Immutable Audit** — SHA-256 blockchain simulation for tamper-proof records
6. **Trust Score** — Dynamic reputation (0–100) updated after every transaction
7. **Location Intelligence** — VPN detection + Global Fraud Registry (GF-Tier 1)
8. **Behavioral Drift** — Detects variance from user's normal transaction patterns

---

*Built with ❤️ for hackathon 2024 | Rakshak AI — Sovereign Archive*
