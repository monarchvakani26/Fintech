// ============================================================
// Rakshak AI - Blockchain Routes
// View chain, verify integrity, tamper simulation
// ============================================================

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const blockchain = require('../services/blockchain');

// GET /api/blockchain — Get full chain
router.get('/', authMiddleware, (req, res) => {
  const chain = blockchain.getChain();
  const verification = blockchain.verifyChain();

  res.json({
    success: true,
    chain,
    length: chain.length,
    verification,
  });
});

// GET /api/blockchain/verify — Verify chain integrity
router.get('/verify', authMiddleware, (req, res) => {
  const result = blockchain.verifyChain();
  res.json({
    success: true,
    ...result,
  });
});

// POST /api/blockchain/tamper — Simulate tampering
router.post('/tamper', authMiddleware, (req, res) => {
  const { blockIndex } = req.body;
  const result = blockchain.simulateTamper(blockIndex);

  if (result.error) {
    return res.status(400).json({ success: false, message: result.error });
  }

  // Also run verification to show the chain is now broken
  const verification = blockchain.verifyChain();

  res.json({
    success: true,
    tamper: result,
    verification,
  });
});

// POST /api/blockchain/reset — Reset chain integrity
router.post('/reset', authMiddleware, (req, res) => {
  const result = blockchain.resetChain();
  const verification = blockchain.verifyChain();

  res.json({
    success: true,
    ...result,
    verification,
  });
});

// GET /api/blockchain/block/:index — Get a single block
router.get('/block/:index', authMiddleware, (req, res) => {
  const chain = blockchain.getChain();
  const idx = parseInt(req.params.index, 10);

  if (isNaN(idx) || idx < 0 || idx >= chain.length) {
    return res.status(404).json({ success: false, message: 'Block not found' });
  }

  res.json({
    success: true,
    block: chain[idx],
  });
});

module.exports = router;
