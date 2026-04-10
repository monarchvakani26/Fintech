// ============================================================
// Rakshak AI - Payment Result Page
// Analysis result with risk factors - matches Image 2
// ============================================================

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, AlertOctagon, CheckCircle, XCircle,
  History, Flag, BarChart3, Shield, ArrowLeft, Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatusBadge from '../components/common/StatusBadge';
import RiskScoreBar from '../components/common/RiskScoreBar';
import { formatCurrency, formatDate, shortHash, getRiskLevel } from '../utils/formatters';
import api from '../services/api';

export default function PaymentResult() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchResult();
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

  const handleApprove = async () => {
    setActionLoading('approve');
    try {
      const res = await api.patch(`/transactions/${id}/approve`, {
        approverNote: 'Manually approved after review',
      });
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
      const res = await api.patch(`/transactions/${id}/block`, {
        blockReason: 'Manually blocked — suspicious activity confirmed',
      });
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
            <button onClick={() => navigate('/dashboard')} className="btn-primary text-sm">
              Return to Dashboard
            </button>
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
      body: 'Rakshak AI has verified this transaction against all security protocols. It has been cleared and will be processed immediately.',
    },
    REVIEW: {
      icon: AlertTriangle,
      color: 'text-orange-600',
      bg: 'bg-cream-light border-cream-dark/20',
      badge: 'bg-orange-100 text-orange-700 border-orange-200',
      tagLabel: 'MANUAL REVIEW REQUIRED',
      heading: 'Transaction Under Review',
      body: 'Rakshak AI has flagged this movement for further scrutiny. While not blocked, it exceeds standard sovereign risk thresholds for this profile.',
    },
    BLOCKED: {
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50 border-red-200',
      badge: 'bg-red-100 text-red-700 border-red-200',
      tagLabel: 'TRANSACTION BLOCKED',
      heading: 'Transaction Blocked',
      body: 'Rakshak AI has identified high-confidence fraud indicators and has automatically blocked this transaction to protect your account.',
    },
  };

  const cfg = statusConfig[status] || statusConfig.REVIEW;
  const StatusIcon = cfg.icon;

  return (
    <DashboardLayout>
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
              Transaction ID: <span className="font-bold text-dark">{transaction.reference}</span>
            </p>
            <p className="text-xs text-dark/40 mt-1">
              Generated: {formatDate(transaction.createdAt)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* LEFT: Main result (2/3) */}
          <div className="col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border-2 p-8 ${cfg.bg}`}
            >
              {/* Status tag */}
              <div className={`inline-flex items-center gap-2 border rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider mb-6 ${cfg.badge}`}>
                <StatusIcon className="w-4 h-4" />
                {cfg.tagLabel}
              </div>

              {/* Heading */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`text-4xl font-black mb-4 ${cfg.color}`}
              >
                {cfg.heading}
              </motion.h2>

              <p className="text-dark/60 text-sm leading-relaxed mb-8">{cfg.body}</p>

              {/* Risk Score Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-dark/50">Risk Score</span>
                  <span className={`text-sm font-black ${riskLevel.color}`}>{riskScore}/100</span>
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
                      className={`flex items-center gap-4 bg-white rounded-xl p-4 border ${
                        i === 0 ? 'border-red-100' : 'border-cream-dark/20'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        i === 0 ? 'bg-red-100' : 'bg-primary'
                      }`}>
                        {i === 0 ? (
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        ) : (
                          <AlertOctagon className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-dark/40 mb-0.5">
                          {i === 0 ? 'RISK FACTOR' : 'ANOMALY'}
                        </p>
                        <p className="text-sm font-bold text-dark">{factor}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* No risk factors for approved */}
              {status === 'APPROVED' && (!analysis?.riskFactors || analysis.riskFactors.length === 0) && (
                <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-green-100">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <p className="text-sm font-semibold text-dark">No risk factors detected — transaction is safe</p>
                </div>
              )}
            </motion.div>

            {/* AI Consensus + History + IP Mismatch Cards */}
            {analysis && (
              <div className="grid grid-cols-3 gap-4 mt-4">
                {/* History */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="card p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-bold text-green-600 bg-green-100 rounded px-2 py-0.5 uppercase">History</span>
                  </div>
                  <h4 className="text-sm font-bold text-dark mb-1">Verification Approved</h4>
                  <p className="text-xs text-dark/50 leading-relaxed">
                    Previous 3 transactions within the last 24 hours were successfully verified via biometric key.
                  </p>
                </motion.div>

                {/* IP Mismatch */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="card p-4 border-red-100"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-bold text-red-600 bg-red-100 rounded px-2 py-0.5 uppercase">Red Flag</span>
                  </div>
                  <h4 className="text-sm font-bold text-dark mb-1">IP Mismatch</h4>
                  <p className="text-xs text-dark/50 leading-relaxed">
                    Originating IP {analysis.locationInfo?.ip || '192.168.x.x'} is{' '}
                    {analysis.locationInfo?.isBlacklisted ? 'blacklisted on Global Fraud Registry (GF-Tier 1)' : 'from an unusual location'}.
                  </p>
                </motion.div>

                {/* AI Consensus */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="card p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-dark/40" />
                    <span className="text-xs font-bold text-dark/40 bg-cream-light rounded px-2 py-0.5 uppercase">Audit</span>
                  </div>
                  <h4 className="text-sm font-bold text-dark mb-1">System Consensus</h4>
                  <p className="text-xs text-dark/50 leading-relaxed">
                    {analysis.aiConsensus?.summary || '3 out of 5 AI nodes suggested cautionary review based on behavioral drift analysis.'}
                  </p>
                </motion.div>
              </div>
            )}

            {/* Transaction Hash */}
            {transaction.transactionHash && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="card p-4 mt-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-dark/40 mb-1">Blockchain Hash (Immutable Proof)</p>
                    <p className="font-mono text-xs text-dark/60 break-all">{transaction.transactionHash}</p>
                  </div>
                  <button onClick={copyHash} className="ml-4 p-2 hover:bg-cream rounded-lg transition-colors flex-shrink-0">
                    <Copy className="w-4 h-4 text-dark/40" />
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* RIGHT: Comparison Matrix + Actions (1/3) */}
          <div className="space-y-4">
            {/* Comparison Matrix */}
            {analysis?.comparisonMatrix && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="card p-6"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-dark/50 mb-4">Comparison Matrix</p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-dark/60">Standard Amount</span>
                    <span className="text-sm font-black text-dark">
                      {formatCurrency(analysis.comparisonMatrix.standardAmount)}
                    </span>
                  </div>
                  <div className="h-px bg-cream-dark/20" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-dark/60">Requested Amount</span>
                    <span className="text-sm font-black text-primary">
                      {formatCurrency(analysis.comparisonMatrix.requestedAmount)}
                    </span>
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

            {/* Risk Breakdown */}
            {analysis?.breakdown && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="card p-6"
              >
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

            {/* Action Buttons (only for REVIEW) */}
            {status === 'REVIEW' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
              >
                <button
                  onClick={handleApprove}
                  disabled={!!actionLoading}
                  className="w-full btn-primary py-4 flex items-center justify-center gap-2"
                >
                  {actionLoading === 'approve' ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Approve Manually
                </button>
                <button
                  onClick={handleBlock}
                  disabled={!!actionLoading}
                  className="w-full btn-ghost py-4 flex items-center justify-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
                >
                  {actionLoading === 'block' ? (
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  Block Transaction
                </button>
              </motion.div>
            )}

            {/* Navigation */}
            <button
              onClick={() => navigate('/payments')}
              className="w-full btn-ghost py-3 text-sm"
            >
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
