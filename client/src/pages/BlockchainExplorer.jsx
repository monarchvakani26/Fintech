// ============================================================
// Rakshak AI - Blockchain Explorer Page
// Premium visual blockchain with glass-morphism blocks
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link2, ShieldCheck, ShieldAlert, AlertTriangle, RotateCcw,
  Hash, ChevronDown, ChevronUp, Zap, Box, Info, CheckCircle, XCircle,
  Copy, Lock, Fingerprint, Eye, EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatusBadge from '../components/common/StatusBadge';
import { formatCurrency, shortHash } from '../utils/formatters';
import api from '../services/api';

export default function BlockchainExplorer() {
  const [chain, setChain] = useState([]);
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [tampering, setTampering] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [revealedHashes, setRevealedHashes] = useState({});
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchChain();
  }, []);

  const fetchChain = async () => {
    try {
      const res = await api.get('/blockchain');
      if (res.data.success) {
        setChain(res.data.chain);
        setVerification(res.data.verification);
      }
    } catch (err) {
      toast.error('Failed to load blockchain');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await api.get('/blockchain/verify');
      if (res.data.success) {
        setVerification(res.data);
        if (res.data.valid) {
          toast.success('Blockchain integrity verified!');
        } else {
          toast.error(`Chain tampered at block #${res.data.errorIndex}`);
        }
      }
    } catch (err) {
      toast.error('Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleTamper = async () => {
    setTampering(true);
    try {
      const res = await api.post('/blockchain/tamper');
      if (res.data.success) {
        setVerification(res.data.verification);
        toast.error(`Block #${res.data.tamper.tamperedIndex} tampered! Chain is now INVALID.`, { duration: 5000 });
        fetchChain();
      }
    } catch (err) {
      toast.error('Tamper simulation failed');
    } finally {
      setTampering(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await api.post('/blockchain/reset');
      if (res.data.success) {
        setVerification(res.data.verification);
        toast.success('Blockchain integrity restored!');
        fetchChain();
      }
    } catch (err) {
      toast.error('Reset failed');
    } finally {
      setResetting(false);
    }
  };

  const toggleHashReveal = (idx) => {
    setRevealedHashes(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const copyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    toast.success('Hash copied!');
  };

  const isChainValid = verification?.valid;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-dark/50 font-medium">Loading blockchain...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Stats
  const approvedCount = chain.filter(b => b.status === 'APPROVED').length;
  const blockedCount = chain.filter(b => b.status === 'BLOCKED').length;
  const reviewCount = chain.filter(b => b.status === 'REVIEW').length;

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-dark/50 mb-1">Immutable Ledger</p>
            <h1 className="text-4xl font-black text-dark">Blockchain Explorer</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm text-dark/50">{chain.length} blocks mined</span>
              <span className="text-dark/20">•</span>
              <div className="relative">
                <button
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  className="text-sm text-primary/70 hover:text-primary flex items-center gap-1"
                >
                  <Info className="w-3.5 h-3.5" />
                  What is this?
                </button>
                <AnimatePresence>
                  {showTooltip && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute left-0 top-full mt-2 w-72 bg-dark text-white text-xs leading-relaxed p-4 rounded-xl shadow-xl z-50"
                    >
                      <p className="font-bold mb-1">Blockchain-Inspired Audit</p>
                      <p className="text-white/70">
                        Every transaction is SHA-256 hashed and linked to the previous block. If any data is tampered,
                        all subsequent hashes break — making fraud immediately detectable.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2"
            >
              {verifying ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              Verify Integrity
            </button>
            <button
              onClick={handleTamper}
              disabled={tampering}
              className="btn-ghost text-sm px-5 py-2.5 flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
            >
              {tampering ? (
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Simulate Tampering
            </button>
            {!isChainValid && (
              <button
                onClick={handleReset}
                disabled={resetting}
                className="btn-ghost text-sm px-5 py-2.5 flex items-center gap-2 border-green-200 text-green-600 hover:bg-green-50"
              >
                {resetting ? (
                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                Restore Chain
              </button>
            )}
          </div>
        </div>

        {/* Verification Banner */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isChainValid ? 'valid' : 'invalid'}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`rounded-2xl border-2 p-5 mb-6 flex items-center gap-4 ${
              isChainValid
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            {isChainValid ? (
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6 text-green-600" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
                <ShieldAlert className="w-6 h-6 text-red-600" />
              </div>
            )}
            <div className="flex-1">
              <p className={`text-sm font-black uppercase tracking-wider ${isChainValid ? 'text-green-700' : 'text-red-700'}`}>
                {isChainValid ? 'Chain Valid — All Hashes Verified' : 'Chain Compromised — Integrity Broken'}
              </p>
              <p className={`text-xs mt-0.5 ${isChainValid ? 'text-green-600/70' : 'text-red-600/70'}`}>
                {verification?.details}
              </p>
            </div>
            {!isChainValid && verification?.errorIndex !== null && (
              <span className="px-4 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-lg border border-red-200">
                Block #{verification.errorIndex} corrupted
              </span>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-4 text-center">
            <p className="text-3xl font-black text-primary tabular-nums">{chain.length}</p>
            <p className="text-xs text-dark/40 font-semibold uppercase tracking-wider mt-1">Total Blocks</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-4 text-center">
            <p className="text-3xl font-black text-green-600 tabular-nums">{approvedCount}</p>
            <p className="text-xs text-dark/40 font-semibold uppercase tracking-wider mt-1">Approved</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-4 text-center">
            <p className="text-3xl font-black text-orange-500 tabular-nums">{reviewCount}</p>
            <p className="text-xs text-dark/40 font-semibold uppercase tracking-wider mt-1">Under Review</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-4 text-center">
            <p className="text-3xl font-black text-red-600 tabular-nums">{blockedCount}</p>
            <p className="text-xs text-dark/40 font-semibold uppercase tracking-wider mt-1">Blocked</p>
          </motion.div>
        </div>

        {/* Genesis Block Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl overflow-hidden mb-6"
          style={{
            background: 'linear-gradient(135deg, #722f37 0%, #5a2229 40%, #3d1a20 100%)',
          }}
        >
          <div className="px-8 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/10">
                <Fingerprint className="w-7 h-7 text-white/90" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-black text-lg tracking-tight">GENESIS BLOCK</span>
                  <span className="text-xs font-bold text-white/40 bg-white/10 rounded-md px-2 py-0.5">BLOCK #0</span>
                </div>
                <p className="text-white/40 text-xs font-mono">previousHash: <span className="text-cream">GENESIS</span></p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/30 text-xs uppercase tracking-wider mb-1">Origin Hash</p>
              <p className="font-mono text-sm text-cream/80">{chain[0] ? shortHash(chain[0]?.currentHash, 16) : '...'}</p>
            </div>
          </div>
        </motion.div>

        {/* Blockchain Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" ref={scrollRef}>
          {chain.map((block, index) => {
            const isTampered = !isChainValid && verification?.errorIndex === index;
            const isSelected = selectedBlock === index;
            const isGenesis = index === 0;
            const isRevealed = revealedHashes[index];

            return (
              <motion.div
                key={block.blockIndex}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.02, 0.5) }}
                className={`rounded-2xl border-2 overflow-hidden transition-all duration-300 cursor-pointer group ${
                  isTampered
                    ? 'border-red-400 bg-red-50/80 shadow-lg shadow-red-200/40 ring-2 ring-red-300/30'
                    : isSelected
                    ? 'border-primary/50 bg-white shadow-lg shadow-primary/10 ring-2 ring-primary/10'
                    : 'border-cream-dark/25 bg-white hover:border-primary/30 hover:shadow-md'
                }`}
                onClick={() => setSelectedBlock(isSelected ? null : index)}
              >
                {/* Top colored bar */}
                <div className={`h-1.5 ${
                  isTampered ? 'bg-gradient-to-r from-red-400 to-red-600'
                  : block.status === 'APPROVED' ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                  : block.status === 'BLOCKED' ? 'bg-gradient-to-r from-red-400 to-red-500'
                  : 'bg-gradient-to-r from-orange-400 to-amber-500'
                }`} />

                {/* Block Content */}
                <div className="p-5">
                  {/* Row 1: Block number + Status + Badges */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black ${
                        isTampered
                          ? 'bg-red-100 text-red-700'
                          : 'bg-primary/10 text-primary'
                      }`}>
                        #{block.blockIndex}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-dark">{block.reference || `Block ${block.blockIndex}`}</span>
                          <StatusBadge status={block.status} />
                        </div>
                        <p className="text-xs text-dark/35 mt-0.5">{new Date(block.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isGenesis && (
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-md">GENESIS</span>
                      )}
                      {isTampered && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-md flex items-center gap-1"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          TAMPERED
                        </motion.span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedBlock(isSelected ? null : index); }}
                        className="p-1 rounded-lg hover:bg-cream-dark/10 transition-colors"
                        title={isSelected ? 'Collapse block' : 'Expand block'}
                      >
                        {isSelected
                          ? <ChevronUp className="w-4 h-4 text-dark/40" />
                          : <ChevronDown className="w-4 h-4 text-dark/40" />}
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Transaction details */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div>
                      <p className="text-xs text-dark/30 font-semibold uppercase tracking-wider mb-0.5">Receiver</p>
                      <p className="text-xs font-bold text-dark truncate">{block.receiver}</p>
                    </div>
                    <div>
                      <p className="text-xs text-dark/30 font-semibold uppercase tracking-wider mb-0.5">Amount</p>
                      <p className="text-sm font-black text-dark">{formatCurrency(block.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-dark/30 font-semibold uppercase tracking-wider mb-0.5">Risk</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-cream-dark/20 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              block.riskScore <= 30 ? 'bg-green-500' : block.riskScore <= 69 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${block.riskScore}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold ${
                          block.riskScore <= 30 ? 'text-green-600' : block.riskScore <= 69 ? 'text-orange-600' : 'text-red-600'
                        }`}>{block.riskScore}</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Hash Display */}
                  <div className={`rounded-xl p-3 ${
                    isTampered ? 'bg-red-50 border border-red-200' : 'bg-cream-light/80 border border-cream-dark/15'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Lock className={`w-3 h-3 ${isTampered ? 'text-red-500' : 'text-primary/50'}`} />
                        <span className={`text-xs font-bold uppercase tracking-wider ${isTampered ? 'text-red-600' : 'text-dark/30'}`}>
                          SHA-256 Hash
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleHashReveal(index); }}
                          className="p-1 hover:bg-white rounded transition-colors"
                          title={isRevealed ? 'Hide hash' : 'Reveal hash'}
                        >
                          {isRevealed ? <EyeOff className="w-3 h-3 text-dark/30" /> : <Eye className="w-3 h-3 text-dark/30" />}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); copyHash(block.currentHash); }}
                          className="p-1 hover:bg-white rounded transition-colors"
                          title="Copy hash"
                        >
                          <Copy className="w-3 h-3 text-dark/30" />
                        </button>
                      </div>
                    </div>
                    <p className={`font-mono text-xs break-all leading-relaxed ${isTampered ? 'text-red-600' : 'text-dark/50'}`}>
                      {isRevealed ? block.currentHash : shortHash(block.currentHash, 14)}
                    </p>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-cream-dark/15 space-y-3">
                          {/* Previous Hash */}
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-dark/30 mb-1">Previous Hash (Chain Link)</p>
                            <div className={`rounded-lg p-2.5 ${isTampered ? 'bg-red-50 border border-red-200' : 'bg-cream-light border border-cream-dark/15'}`}>
                              <p className="font-mono text-xs break-all text-dark/50">
                                {block.previousHash === 'GENESIS' ? (
                                  <span className="text-primary font-bold">GENESIS — Origin of the Sovereign Archive</span>
                                ) : (
                                  block.previousHash
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Detail Grid */}
                          <div className="grid grid-cols-2 gap-3">
                            <MiniDetail label="Transaction ID" value={shortHash(block.transactionId, 12)} />
                            <MiniDetail label="Sender" value={shortHash(block.sender, 12)} />
                            <MiniDetail label="Type" value={block.type || 'Transfer'} />
                            <MiniDetail label="Mined At" value={new Date(block.timestamp).toLocaleString('en-IN')} />
                          </div>

                          {/* Chain Integrity for this block */}
                          <div className={`rounded-lg p-3 flex items-center gap-2 ${
                            isTampered ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
                          }`}>
                            {isTampered ? (
                              <>
                                <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                <span className="text-xs font-bold text-red-700">Hash mismatch — this block has been modified</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <span className="text-xs font-bold text-green-700">Block verified — hash matches computed value</span>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Chain End Summary */}
        {chain.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={`mt-6 rounded-2xl border-2 p-6 text-center ${
              isChainValid ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'
            }`}
          >
            <div className={`w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center ${
              isChainValid ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {isChainValid ? (
                <Link2 className="w-6 h-6 text-green-600" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-600" />
              )}
            </div>
            <p className={`text-sm font-black uppercase tracking-wider ${isChainValid ? 'text-green-700' : 'text-red-700'}`}>
              {isChainValid ? 'End of Chain — All Blocks Verified' : 'Chain Integrity Compromised'}
            </p>
            <p className={`text-xs mt-1 ${isChainValid ? 'text-green-600/60' : 'text-red-600/60'}`}>
              {isChainValid
                ? `${chain.length} blocks linked with SHA-256 cryptographic hashes`
                : 'Run verification to identify corrupted blocks'}
            </p>
          </motion.div>
        )}

        {chain.length === 0 && (
          <div className="text-center py-20">
            <Box className="w-16 h-16 text-dark/15 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-dark/40">No blocks yet</h3>
            <p className="text-sm text-dark/30 mt-1">Process a payment to create the first block</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function MiniDetail({ label, value }) {
  return (
    <div>
      <p className="text-xs text-dark/30 font-semibold uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-xs font-mono font-semibold text-dark/60 truncate">{value}</p>
    </div>
  );
}
