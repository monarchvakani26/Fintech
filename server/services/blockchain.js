// ============================================================
// Rakshak AI - Blockchain Service
// SHA-256 hash chaining with genesis block
// ============================================================

const crypto = require('crypto');

// In-memory blockchain ledger
const chain = [];

/**
 * Compute SHA-256 hash for a block
 */
function computeHash({ transactionId, timestamp, amount, sender, receiver, status, riskScore, previousHash }) {
  const payload = `${transactionId}${timestamp}${amount}${sender}${receiver}${status}${riskScore}${previousHash}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Get the full blockchain
 */
function getChain() {
  return chain;
}

/**
 * Get the last block in the chain
 */
function getLastBlock() {
  return chain.length > 0 ? chain[chain.length - 1] : null;
}

/**
 * Add a transaction as a new block to the chain
 * @param {Object} txData - { transactionId, amount, sender, receiver, status, riskScore }
 * @returns {Object} the new block
 */
function addBlock(txData) {
  const lastBlock = getLastBlock();
  const previousHash = lastBlock ? lastBlock.currentHash : 'GENESIS';
  const timestamp = new Date().toISOString();
  const blockIndex = chain.length;

  const block = {
    blockIndex,
    transactionId: txData.transactionId,
    timestamp,
    amount: txData.amount,
    sender: txData.sender,
    receiver: txData.receiver,
    status: txData.status,
    riskScore: txData.riskScore,
    previousHash,
    currentHash: '', // computed below
    reference: txData.reference || null,
    type: txData.type || 'External Transfer',
  };

  block.currentHash = computeHash({
    transactionId: block.transactionId,
    timestamp: block.timestamp,
    amount: block.amount,
    sender: block.sender,
    receiver: block.receiver,
    status: block.status,
    riskScore: block.riskScore,
    previousHash: block.previousHash,
  });

  chain.push(block);
  return block;
}

/**
 * Verify the entire blockchain integrity
 * @returns {{ valid: boolean, errorIndex: number|null, details: string }}
 */
function verifyChain() {
  for (let i = 0; i < chain.length; i++) {
    const block = chain[i];

    // 1. Recompute the hash and verify it matches
    const recomputed = computeHash({
      transactionId: block.transactionId,
      timestamp: block.timestamp,
      amount: block.amount,
      sender: block.sender,
      receiver: block.receiver,
      status: block.status,
      riskScore: block.riskScore,
      previousHash: block.previousHash,
    });

    if (recomputed !== block.currentHash) {
      return {
        valid: false,
        errorIndex: i,
        details: `Block #${i} hash mismatch. Expected ${recomputed}, found ${block.currentHash}. Data may have been tampered.`,
      };
    }

    // 2. Verify previousHash links to the actual previous block
    if (i === 0) {
      if (block.previousHash !== 'GENESIS') {
        return {
          valid: false,
          errorIndex: 0,
          details: 'Genesis block has invalid previousHash.',
        };
      }
    } else {
      if (block.previousHash !== chain[i - 1].currentHash) {
        return {
          valid: false,
          errorIndex: i,
          details: `Block #${i} previousHash does not match Block #${i - 1} currentHash. Chain link broken.`,
        };
      }
    }
  }

  return { valid: true, errorIndex: null, details: 'All blocks verified. Chain integrity intact.' };
}

/**
 * Simulate tampering by modifying a block's data
 * @param {number} blockIndex - the index to tamper (defaults to random middle block)
 * @returns {{ tamperedIndex: number, originalAmount: number, tamperedAmount: number }}
 */
function simulateTamper(blockIndex) {
  if (chain.length === 0) {
    return { error: 'No blocks in chain to tamper' };
  }

  // Pick a valid index
  const idx = (blockIndex !== undefined && blockIndex >= 0 && blockIndex < chain.length)
    ? blockIndex
    : Math.min(Math.max(0, Math.floor(chain.length / 2)), chain.length - 1);

  const block = chain[idx];
  const originalAmount = block.amount;
  // Tamper: change the amount without recalculating hash
  block.amount = originalAmount + 99999;

  return {
    tamperedIndex: idx,
    originalAmount,
    tamperedAmount: block.amount,
    message: `Block #${idx} amount changed from ₹${originalAmount} to ₹${block.amount} WITHOUT rehashing. Chain is now invalid.`,
  };
}

/**
 * Reset tamper — restore chain integrity (for demo resets)
 */
function resetChain() {
  // Rebuild all hashes from scratch
  for (let i = 0; i < chain.length; i++) {
    chain[i].previousHash = i === 0 ? 'GENESIS' : chain[i - 1].currentHash;
    chain[i].currentHash = computeHash({
      transactionId: chain[i].transactionId,
      timestamp: chain[i].timestamp,
      amount: chain[i].amount,
      sender: chain[i].sender,
      receiver: chain[i].receiver,
      status: chain[i].status,
      riskScore: chain[i].riskScore,
      previousHash: chain[i].previousHash,
    });
  }
  return { message: 'Chain rebuilt and integrity restored.', length: chain.length };
}

/**
 * Seed the blockchain from existing transactions (call at startup)
 */
function seedFromTransactions(transactions) {
  // Sort by createdAt ascending so chain order is chronological
  const sorted = [...transactions].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  for (const txn of sorted) {
    addBlock({
      transactionId: txn.id,
      amount: txn.amount,
      sender: txn.userId,
      receiver: txn.recipient?.vpa || 'unknown',
      status: txn.status,
      riskScore: txn.riskAnalysis?.riskScore || 0,
      reference: txn.reference,
      type: txn.type,
    });
  }
}

module.exports = {
  getChain,
  getLastBlock,
  addBlock,
  verifyChain,
  simulateTamper,
  resetChain,
  seedFromTransactions,
  computeHash,
};
