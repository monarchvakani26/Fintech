// ============================================================
// Rakshak AI - Payment Result Page
// + Animated risk counter, AI node flip cards, Merkle tree, QR, confetti/shake
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, AlertOctagon, CheckCircle, XCircle,
  BarChart3, Shield, ArrowLeft, Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatusBadge from '../components/common/StatusBadge';
import RiskScoreBar from '../components/common/RiskScoreBar';
import { formatCurrency, formatDate, getRiskLevel } from '../utils/formatters';
import api from '../services/api';

// Human-readable explanations for risk factors
function getFactorExplanation(factor) {
  const explanations = {
    'Extreme High Transaction Amount': 'The transaction amount significantly exceeds standard thresholds, triggering automatic elevated scrutiny.',
    'High Transaction Amount': 'This amount is higher than typical transactions for this profile, contributing to increased risk.',
    'New Device Fingerprint Detected': 'This device has never been used before with this account. New devices are flagged until establish trusted history.',
    'Untrusted Device': 'This device has been seen before but has not yet been verified as trusted.',
    'VPN/Proxy Connection Detected': 'The transaction originates from a VPN or proxy server, which is commonly used to mask true location.',
    'Rapid Transaction Velocity (>3 in 1 hour)': 'Multiple transactions in rapid succession can indicate automated fraud or account compromise.',
    'First Transaction to New Recipient': 'Sending funds to a new recipient for the first time carries inherent uncertainty risk.',
    'Recipient on Sovereign Watchlist': 'The recipient VPA appears on our global fraud watchlist based on reported suspicious activity.',
    'Daily Transaction Limit Approaching': 'The cumulative daily transaction volume is approaching the safety threshold for this account.',
    'Unusual Time of Transaction (Late Night)': 'Transactions between 2-6 AM carry higher risk as they deviate from normal activity patterns.',
  };

  // Partial match for dynamic factors
  const lowerFactor = factor.toLowerCase();
  if (lowerFactor.includes('location mismatch')) return 'The transaction location differs from the account\'s usual geographic area.';
  if (lowerFactor.includes('unusual location')) return 'The IP or geographic origin is not typically associated with this account.';
  if (lowerFactor.includes('ip blacklisted')) return 'This IP address is flagged on international fraud registries.';
  if (lowerFactor.includes('variance')) return 'The transaction amount deviates significantly from the user\'s historical average.';

  return explanations[factor] || 'This factor was flagged by the AI risk assessment engine.';
}

// ── NEW: NodeFlipCards — animated 5-node consensus reveal with scores + reasoning ──
function NodeFlipCards({ nodeNames, nodeIcons, nodeDecisions, nodeScores, nodeConfidences, nodeReasonings }) {
  const [flipped, setFlipped] = useState([false, false, false, false, false]);
  const [showReasonings, setShowReasonings] = useState(false);

  useEffect(() => {
    if (!nodeNames?.length) return;
    nodeNames.forEach((_, i) => {
      setTimeout(() => {
        setFlipped(prev => { const next = [...prev]; next[i] = true; return next; });
      }, 500 + i * 450);
    });
    setTimeout(() => setShowReasonings(true), 500 + (nodeNames.length * 450) + 400);
  }, [nodeNames]);

  const cfg = {
    APPROVED: { bg: '#f0fdf4', border: '#86efac', text: '#166534', symbol: '✓' },
    REVIEW:   { bg: '#fff7ed', border: '#fdba74', text: '#9a3412', symbol: '⚠' },
    BLOCKED:  { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b', symbol: '✗' },
  };

  return (
    <div>
      <div className="grid grid-cols-5 gap-3 mb-4">
        {(nodeNames || []).map((name, i) => {
          const decision = nodeDecisions?.[i] || 'REVIEW';
          const score = nodeScores?.[i] || 0;
          const icon = nodeIcons?.[i] || '🤖';
          const c = cfg[decision];
          const isFlipped = flipped[i];

          return (
            <div key={i} style={{ perspective: '600px', height: '130px' }}>
              <motion.div
                style={{ transformStyle: 'preserve-3d', position: 'relative', width: '100%', height: '100%' }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.55, ease: 'easeInOut' }}
              >
                {/* Front — analyzing */}
                <div style={{
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  position: 'absolute', width: '100%', height: '100%',
                  background: '#f9f4eb', borderRadius: '14px',
                  border: '1px solid rgba(114,47,55,0.15)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}>
                  <div style={{ fontSize: '22px' }}>{icon}</div>
                  <p style={{ color: 'rgba(20,10,10,0.5)', fontSize: '9px', fontWeight: 700,
                    textAlign: 'center', letterSpacing: '0.04em', padding: '0 4px' }}>
                    {name}
                  </p>
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    style={{ fontSize: '9px', color: 'rgba(20,10,10,0.35)' }}
                  >
                    analyzing...
                  </motion.div>
                </div>
                {/* Back — verdict */}
                <div style={{
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  position: 'absolute', width: '100%', height: '100%',
                  background: c.bg, borderRadius: '14px',
                  border: `2px solid ${c.border}`,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '3px',
                }}>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: c.text }}>{c.symbol}</div>
                  <p style={{ fontSize: '7px', fontWeight: 800, color: c.text, letterSpacing: '0.07em' }}>{decision}</p>
                  <p style={{ fontSize: '8px', color: c.text, opacity: 0.6, textAlign: 'center', padding: '0 3px' }}>{name}</p>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: c.text }}>{score}/100</p>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Per-node reasoning — Explainable AI */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: showReasonings ? 1 : 0, y: showReasonings ? 0 : 8 }}
        transition={{ duration: 0.4 }}
        className="rounded-xl p-4 bg-cream-light border border-cream-dark/20"
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-dark/40 mb-3">Node Reasoning — Explainable AI</p>
        {(nodeReasonings || []).map((r, i) => (
          <div key={i} className="flex gap-2 mb-2 items-start">
            <span style={{ fontSize: '13px', flexShrink: 0 }}>{nodeIcons?.[i] || '🤖'}</span>
            <div>
              <span className="text-[10px] font-bold text-dark/70">{nodeNames?.[i]}:</span>
              <span className="text-[10px] text-dark/50 ml-1">{r}</span>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// Animated risk score counter
function AnimatedScore({ value, color }) {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    let start = null;
    const duration = 1200;
    const animate = (ts) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * value));
      if (progress < 1) ref.current = requestAnimationFrame(animate);
    };
    ref.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(ref.current);
  }, [value]);
  return <span className={color}>{displayed}</span>;
}



// Merkle Tree Visualizer
function MerkleTree({ hash }) {
  if (!hash) return null;
  const short = (s, n = 8) => s?.slice(0, n) || '--------';
  const rows = [
    { label: 'userId', hash: short(hash, 8) },
    { label: 'recipient', hash: short(hash.slice(8), 8) },
    { label: 'amount', hash: short(hash.slice(16), 8) },
    { label: 'timestamp', hash: short(hash.slice(24), 8) },
  ];
  const combined = short(hash.slice(0, 16), 16);

  return (
    <div className="bg-cream-light rounded-xl p-4 mt-3 border border-cream-dark/20">
      <p className="text-xs font-bold uppercase tracking-wider text-dark/40 mb-3">Merkle Hash Construction</p>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {rows.map(({ label, hash: h }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-primary/40 rounded-full" />
            <div>
              <p className="text-xs text-dark/40">{label}</p>
              <p className="text-xs font-mono font-bold text-dark/60">{h}...</p>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-cream-dark/30 pt-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-full h-1.5 bg-primary/60 rounded-full" />
          <p className="text-xs text-dark/50 whitespace-nowrap">Combined</p>
          <span className="font-mono text-xs font-bold text-dark/60">{combined}...</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-3 h-3 text-primary flex-shrink-0" />
          <p className="text-xs text-dark/40">SHA-256:</p>
          <p className="font-mono text-xs text-primary font-bold truncate">{hash.slice(0, 32)}...</p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentResult() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [nodesRevealed, setNodesRevealed] = useState(false);
  const [bgFlash, setBgFlash] = useState(false);
  const qrRef = useRef(null);
  const confettiDone = useRef(false);

  const locationState = location.state || {};

  useEffect(() => {
    // If PaymentAnalysis already passed the full result in location.state, use it directly
    // This avoids the GET /result/:id auth mismatch for freshly-analyzed real transactions
    if (locationState.analysisResult) {
      const ar = locationState.analysisResult;
      // Build a synthetic transaction object from the analysis result
      setTransaction({
        id,
        reference: ar.transaction?.reference || id.slice(0, 10).toUpperCase(),
        status: ar.decision || ar.transaction?.status,
        amount: ar.transaction?.amount || locationState.amount || 0,
        currency: 'INR',
        recipient: ar.transaction?.recipient || { vpa: locationState.recipientVPA || '', name: '', icon: '👤' },
        transactionHash: ar.transactionHash || ar.transaction?.transactionHash,
        createdAt: ar.transaction?.createdAt || new Date().toISOString(),
        processedAt: new Date().toISOString(),
        riskAnalysis: {
          riskScore:      ar.riskScore,
          riskFactors:    ar.riskFactors || [],
          breakdown:      ar.analysisDetails || ar.breakdown || {},
          aiConsensus:    ar.aiConsensusDetails || ar.aiConsensus || {},
          explainableAI:  ar.explainableAI || {},
          comparisonMatrix: ar.comparisonMatrix || {},
          deviceInfo:     ar.deviceInfo || {},
          locationInfo:   ar.locationInfo || {},
          analysisSteps:  ar.analysisSteps || [],
          variancePct:    ar.variancePct || 0,
        },
        note: locationState.note || '',
      });
      setLoading(false);
    } else {
      fetchResult();
    }
  }, [id]);

  const fetchResult = async () => {
    try {
      const res = await api.get(`/payments/result/${id}`);
      if (res.data.success) {
        setTransaction(res.data.transaction);
      }
    } catch (err) {
      toast.error('Failed to load transaction result');
    } finally {
      setLoading(false);
    }
  };

  // Trigger confetti / shake after load
  useEffect(() => {
    if (!transaction || confettiDone.current) return;
    confettiDone.current = true;

    if (transaction.status === 'APPROVED') {
      // Confetti
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({
          particleCount: 90,
          spread: 65,
          colors: ['#722f37', '#EFDFBB', '#22c55e', '#ffffff'],
          origin: { y: 0.4 },
        });
      }).catch(() => {});
    }

    if (transaction.status === 'BLOCKED') {
      setBgFlash(true);
      setTimeout(() => setBgFlash(false), 900);
    }

    // Reveal AI node flip cards after short delay
    setTimeout(() => setNodesRevealed(true), 800);
  }, [transaction]);

  // QR code generation
  useEffect(() => {
    if (!transaction?.transactionHash || !qrRef.current) return;
    import('qrcode').then(({ default: QRCode }) => {
      QRCode.toCanvas(
        qrRef.current,
        `RAKSHAK-AI:${transaction.transactionHash}:${transaction.reference}:${transaction.status}`,
        { width: 90, margin: 1, color: { dark: '#722f37', light: '#F5EDD8' } }
      );
    }).catch(() => {});
  }, [transaction]);

  const handleApprove = async () => {
    setActionLoading('approve');
    try {
      const res = await api.patch(`/transactions/${id}/approve`, { approverNote: 'Manually approved after review' });
      if (res.data.success) {
        toast.success('Transaction approved successfully');
        setTransaction(res.data.transaction);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlock = async () => {
    setActionLoading('block');
    try {
      const res = await api.patch(`/transactions/${id}/block`, { blockReason: 'Manually blocked — suspicious activity confirmed' });
      if (res.data.success) {
        toast.success('Transaction blocked and recipient flagged');
        setTransaction(res.data.transaction);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Block failed');
    } finally {
      setActionLoading(null);
    }
  };

  const copyHash = () => {
    if (transaction?.transactionHash) {
      navigator.clipboard.writeText(transaction.transactionHash);
      toast.success('Transaction hash copied!');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-dark/50 font-medium">Loading analysis result...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!transaction) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-dark font-bold mb-2">Transaction not found</p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary text-sm">Return to Dashboard</button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const analysis = transaction.riskAnalysis;
  const status = transaction.status;
  const riskScore = analysis?.riskScore || 0;
  const riskLevel = getRiskLevel(riskScore);

  const statusConfig = {
    APPROVED: {
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50 border-green-200',
      badge: 'bg-green-100 text-green-700 border-green-200',
      tagLabel: 'TRANSACTION APPROVED',
      heading: 'Transaction Approved',
      body: 'Rakshak AI has verified this transaction against all security protocols. Cleared and processed immediately.',
    },
    REVIEW: {
      icon: AlertTriangle,
      color: 'text-orange-600',
      bg: 'bg-cream-light border-cream-dark/20',
      badge: 'bg-orange-100 text-orange-700 border-orange-200',
      tagLabel: 'MANUAL REVIEW REQUIRED',
      heading: 'Transaction Under Review',
      body: 'Rakshak AI has flagged this movement for further scrutiny. It exceeds standard sovereign risk thresholds for this profile.',
    },
    BLOCKED: {
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50 border-red-200',
      badge: 'bg-red-100 text-red-700 border-red-200',
      tagLabel: 'TRANSACTION BLOCKED',
      heading: 'Transaction Blocked',
      body: 'Rakshak AI identified high-confidence fraud indicators and automatically blocked this transaction.',
    },
  };

  const cfg = statusConfig[status] || statusConfig.REVIEW;
  const StatusIcon = cfg.icon;

  // Build node decision array
  const nodeDecisions = analysis?.aiConsensus?.nodeDecisions ||
    Array(5).fill(null).map((_, i) => {
      const agreeCount = analysis?.aiConsensus?.agreeCount || 3;
      return i < agreeCount ? status : (status === 'BLOCKED' ? 'REVIEW' : 'APPROVED');
    });

  return (
    <DashboardLayout>
      {/* Red flash overlay for BLOCKED */}
      <AnimatePresence>
        {bgFlash && (
          <motion.div
            className="fixed inset-0 z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ background: 'rgba(239,68,68,0.12)' }}
          />
        )}
      </AnimatePresence>

      <div className="max-w-5xl">
        {/* Page Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-sm text-dark/50 hover:text-dark mb-3 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <p className="text-dark/50 text-xs font-semibold uppercase tracking-widest mb-1">Analysis Result</p>
            <h1 className="text-4xl font-black text-dark">The Sovereign Archive</h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-dark/50 font-medium">
              Ref: <span className="font-bold text-dark">{transaction.reference}</span>
            </p>
            <p className="text-xs text-dark/40 mt-1">Generated: {formatDate(transaction.createdAt)}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* LEFT: Main result (2/3) */}
          <div className="col-span-2 space-y-4">
            {/* Main result card — shake on BLOCKED */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1, y: 0,
                x: status === 'BLOCKED' ? [-8, 8, -6, 6, -4, 4, 0] : 0,
              }}
              transition={{
                opacity: { duration: 0.4 },
                y: { duration: 0.4 },
                x: status === 'BLOCKED' ? { duration: 0.5, delay: 0.3 } : {},
              }}
              className={`rounded-2xl border-2 p-8 ${cfg.bg}`}
            >
              <div className={`inline-flex items-center gap-2 border rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider mb-6 ${cfg.badge}`}>
                <StatusIcon className="w-4 h-4" />
                {cfg.tagLabel}
              </div>

              <h2 className={`text-4xl font-black mb-2 ${cfg.color}`}>{cfg.heading}</h2>
              <p className="text-dark/60 text-sm leading-relaxed mb-6">{cfg.body}</p>

              {/* Animated Risk Score Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-dark/50">Risk Score</span>
                  <span className={`text-2xl font-black tabular-nums ${riskLevel.color}`}>
                    <AnimatedScore value={riskScore} color={riskLevel.color} />
                    <span className="text-base text-dark/40">/100</span>
                  </span>
                </div>
                <RiskScoreBar score={riskScore} showLabel={false} height="h-3" />
              </div>

              {/* Risk Factors */}
              {analysis?.riskFactors?.length > 0 && (
                <div className="space-y-3">
                  {analysis.riskFactors.map((factor, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.08 }}
                      className={`flex items-center gap-4 bg-white rounded-xl p-4 border ${i === 0 ? 'border-red-100' : 'border-cream-dark/20'}`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${i === 0 ? 'bg-red-100' : 'bg-primary'}`}>
                        {i === 0 ? <AlertTriangle className="w-5 h-5 text-red-600" /> : <AlertOctagon className="w-5 h-5 text-white" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-dark/40 mb-0.5">
                          {i === 0 ? 'PRIMARY RISK FACTOR' : 'ANOMALY'}
                        </p>
                        <p className="text-sm font-bold text-dark">{factor}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {status === 'APPROVED' && (!analysis?.riskFactors || analysis.riskFactors.length === 0) && (
                <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-green-100">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <p className="text-sm font-semibold text-dark">No risk factors detected — transaction is safe</p>
                </div>
              )}
            </motion.div>

            {/* Explainability Section */}
            {analysis && (status === 'BLOCKED' || status === 'REVIEW') && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="card p-6 mt-4 border-2 border-primary/20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-dark uppercase tracking-wider">
                      {status === 'BLOCKED' ? 'Why was this transaction blocked?' : 'Why is this under review?'}
                    </h3>
                    <p className="text-xs text-dark/40">AI Explainability Report</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {/* Risk Factor Explanations */}
                  {analysis.riskFactors?.map((factor, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.06 }}
                      className="flex items-start gap-3 p-3 bg-cream-light/60 rounded-lg"
                    >
                      <div className="w-6 h-6 bg-red-100 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-black text-red-600">{i + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-dark">{factor}</p>
                        <p className="text-xs text-dark/40 mt-0.5">
                          {getFactorExplanation(factor)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* AI Decision Summary */}
                <div className="mt-4 pt-4 border-t border-cream-dark/15">
                  <p className="text-xs font-bold uppercase tracking-wider text-dark/40 mb-2">AI Decision Summary</p>
                  <p className="text-sm text-dark/70 leading-relaxed">
                    The Rakshak AI engine analyzed this transaction across <strong>6 risk dimensions</strong>{' '}
                    (amount, device, location, behavior, velocity, recipient) using{' '}
                    <strong>{analysis.aiConsensus?.totalNodes || 5} independent AI nodes</strong>.{' '}
                    {analysis.aiConsensus?.agreeCount || 3} out of {analysis.aiConsensus?.totalNodes || 5} nodes{' '}
                    recommended <strong>{status === 'BLOCKED' ? 'blocking' : 'caution'}</strong> with{' '}
                    <strong>{analysis.aiConsensus?.consensusStrength || 'Strong'}</strong> consensus.
                    The final risk score of <strong>{riskScore}/100</strong> exceeded the{' '}
                    {status === 'BLOCKED' ? '70-point blocking threshold' : '30-point review threshold'}.
                  </p>
                </div>
              </motion.div>
            )}

            {/* AI Node Consensus Voting — NodeFlipCards */}
            {analysis && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="card p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-dark/50">AI Consensus Layer — 5 Sovereign Nodes</p>
                  <span className="text-xs font-bold text-dark/40 bg-cream-light px-2 py-1 rounded">
                    {analysis.aiConsensus?.agreeCount || 3}/5 nodes · {analysis.aiConsensus?.consensusStrength || 'Moderate'}
                  </span>
                </div>
                <NodeFlipCards
                  nodeNames={analysis.aiConsensus?.nodeNames}
                  nodeIcons={analysis.aiConsensus?.nodeIcons}
                  nodeDecisions={analysis.aiConsensus?.nodeDecisions}
                  nodeScores={analysis.aiConsensus?.nodeScores}
                  nodeConfidences={analysis.aiConsensus?.nodeConfidences}
                  nodeReasonings={analysis.aiConsensus?.nodeReasonings}
                />
                <AnimatePresence>
                  {(
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 3.5 }}
                      className="text-xs text-center text-dark/50 mt-3 pt-3 border-t border-cream-dark/15"
                    >
                      {analysis.aiConsensus?.summary || `${analysis.aiConsensus?.agreeCount || 3} of 5 AI nodes reached consensus`}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Info cards row */}
            {analysis && (
              <div className="grid grid-cols-3 gap-4">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-bold text-green-600 bg-green-100 rounded px-2 py-0.5 uppercase">History</span>
                  </div>
                  <h4 className="text-sm font-bold text-dark mb-1">Verification Approved</h4>
                  <p className="text-xs text-dark/50 leading-relaxed">
                    Previous transactions verified via biometric key.
                  </p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-bold text-red-600 bg-red-100 rounded px-2 py-0.5 uppercase">IP Intel</span>
                  </div>
                  <h4 className="text-sm font-bold text-dark mb-1">Location Analysis</h4>
                  <p className="text-xs text-dark/50 leading-relaxed">
                    IP {analysis.locationInfo?.ip || 'N/A'} from {analysis.locationInfo?.city}, {analysis.locationInfo?.country}.
                    {analysis.locationInfo?.isBlacklisted ? ' ⚠ Blacklisted on GF-Tier 1.' : ''}
                  </p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-dark/40" />
                    <span className="text-xs font-bold text-dark/40 bg-cream-light rounded px-2 py-0.5 uppercase">Audit</span>
                  </div>
                  <h4 className="text-sm font-bold text-dark mb-1">System Consensus</h4>
                  <p className="text-xs text-dark/50 leading-relaxed">
                    {analysis.aiConsensus?.summary || '3 out of 5 AI nodes agreed on this outcome.'}
                  </p>
                </motion.div>
              </div>
            )}

            {/* Blockchain Hash + Merkle Tree + QR */}
            {transaction.transactionHash && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="card p-5"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-dark/40">Blockchain Hash (Immutable Proof)</p>
                  <button onClick={copyHash} className="p-2 hover:bg-cream rounded-lg transition-colors">
                    <Copy className="w-4 h-4 text-dark/40" />
                  </button>
                </div>
                <p className="font-mono text-xs text-dark/60 break-all mb-3">{transaction.transactionHash}</p>

                {/* QR Code + Merkle Tree side by side */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <canvas ref={qrRef} className="rounded-lg flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-dark/60 mb-1">Scan to Verify</p>
                      <p className="text-xs text-dark/40 leading-relaxed">
                        Scan this QR code to independently verify on the Sovereign Ledger.
                      </p>
                    </div>
                  </div>
                  <MerkleTree hash={transaction.transactionHash} />
                </div>
              </motion.div>
            )}
          </div>

          {/* RIGHT: Comparison Matrix + Risk Breakdown + Actions */}
          <div className="space-y-4">
            {analysis?.comparisonMatrix && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="card p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-dark/50 mb-4">Comparison Matrix</p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-dark/60">Standard Amount</span>
                    <span className="text-sm font-black text-dark">{formatCurrency(analysis.comparisonMatrix.standardAmount)}</span>
                  </div>
                  <div className="h-px bg-cream-dark/20" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-dark/60">Requested Amount</span>
                    <span className="text-sm font-black text-primary">{formatCurrency(analysis.comparisonMatrix.requestedAmount)}</span>
                  </div>
                  <div className="h-px bg-cream-dark/20" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-dark/60">Variance</span>
                    <span className={`text-sm font-black ${riskScore > 30 ? 'text-red-600' : 'text-green-600'}`}>
                      {analysis.comparisonMatrix.variance}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {analysis?.breakdown && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="card p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-dark/50 mb-4">Risk Breakdown</p>
                <div className="space-y-3">
                  {Object.entries(analysis.breakdown).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-dark/50 capitalize">{key.replace('Risk', ' Risk')}</span>
                        <span className="text-xs font-bold text-dark">{value}</span>
                      </div>
                      <RiskScoreBar score={(value / 50) * 100} showLabel={false} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Action Buttons (REVIEW only) */}
            {status === 'REVIEW' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="space-y-3">
                <button
                  onClick={handleApprove}
                  disabled={!!actionLoading}
                  className="w-full btn-primary py-4 flex items-center justify-center gap-2"
                >
                  {actionLoading === 'approve' ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : <CheckCircle className="w-4 h-4" />}
                  Approve Manually
                </button>
                <button
                  onClick={handleBlock}
                  disabled={!!actionLoading}
                  className="w-full btn-ghost py-4 flex items-center justify-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
                >
                  {actionLoading === 'block' ? (
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  ) : <XCircle className="w-4 h-4" />}
                  Block Transaction
                </button>
              </motion.div>
            )}

            <button onClick={() => navigate('/payments')} className="w-full btn-ghost py-3 text-sm">
              New Payment
            </button>
            <button
              onClick={() => navigate('/audit')}
              className="w-full text-sm text-primary font-semibold hover:text-primary-dark transition-colors py-2"
            >
              View Audit Trail →
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
