// ============================================================
// Rakshak AI - Dashboard Page
// Balance, Trust Score, Recent Transactions + DNA Heatmap + WebSocket
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, FileDown, Plus, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import TrustScoreGauge from '../components/dashboard/TrustScoreGauge';
import DemoPanel from '../components/dashboard/DemoPanel';
import StatusBadge from '../components/common/StatusBadge';
import { formatCurrency, formatDate, getRiskLevel } from '../utils/formatters';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useWebSocket } from '../hooks/useWebSocket';

// Animated number counter
function AnimatedBalance({ value }) {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    let start = null;
    const duration = 2000;
    const animate = (ts) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplayed(eased * value);
      if (progress < 1) ref.current = requestAnimationFrame(animate);
    };
    ref.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(ref.current);
  }, [value]);

  // Format as Indian number: ₹1,42,85,900.50
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(displayed);

  return <span>{formatted}</span>;
}

// Custom bar chart tooltip
function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-lg shadow-card border border-cream p-3 text-xs">
        <p className="font-bold text-dark">{formatCurrency(payload[0].value, { compact: true })}</p>
        <p className="text-dark/50">Transaction Volume</p>
      </div>
    );
  }
  return null;
}

// Transaction DNA Heatmap
function DnaHeatmap({ transactions }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Build activity grid [day][hour]
  const grid = Array(7).fill(null).map(() => Array(24).fill(0));
  (transactions || []).forEach(txn => {
    const d = new Date(txn.createdAt);
    const dow = (d.getDay() + 6) % 7; // Mon=0
    const hour = d.getHours();
    grid[dow][hour]++;
  });
  const maxVal = Math.max(1, ...grid.flat());

  const getCellColor = (val, hour) => {
    if (val === 0) return 'bg-cream-dark/20';
    const ratio = val / maxVal;
    if (ratio < 0.3) return 'bg-primary/20';
    if (ratio < 0.6) return 'bg-primary/50';
    return 'bg-primary';
  };

  const isUnusual = (hour) => hour >= 2 && hour <= 5;

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 mb-1">
        <div className="w-8" />
        {hours.map(h => (
          <div key={h} className="w-4 flex-shrink-0 text-center">
            {h % 6 === 0 && <span className="text-xs text-dark/30" style={{fontSize: '8px'}}>{h}h</span>}
          </div>
        ))}
      </div>
      {days.map((day, di) => (
        <div key={day} className="flex items-center gap-1 mb-1">
          <div className="w-8 text-xs text-dark/40 font-semibold text-right pr-1" style={{fontSize: '10px'}}>{day}</div>
          {hours.map(h => (
            <div
              key={h}
              title={`${day} ${h}:00 — ${grid[di][h]} transactions`}
              className={`w-4 h-4 rounded-sm flex-shrink-0 transition-all ${
                getCellColor(grid[di][h], h)
              } ${isUnusual(h) ? 'ring-1 ring-red-400/50' : ''}`}
            />
          ))}
        </div>
      ))}
      <div className="flex items-center gap-4 mt-3">
        <span className="text-xs text-dark/40">Less</span>
        {['bg-cream-dark/20','bg-primary/20','bg-primary/50','bg-primary'].map(c => (
          <div key={c} className={`w-4 h-4 rounded-sm ${c}`} />
        ))}
        <span className="text-xs text-dark/40">More</span>
        <span className="text-xs text-red-400/70 ml-4 flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm ring-1 ring-red-400/50 bg-cream-dark/20" />
          Unusual hours (2–5am)
        </span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [dashData, setDashData] = useState(null);
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
    fetchAllTransactions();
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard');
      if (res.data.success) setDashData(res.data.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTransactions = async () => {
    try {
      const res = await api.get('/transactions?limit=50');
      if (res.data.success) setAllTransactions(res.data.transactions);
    } catch {}
  };

  // WebSocket live threat notifications
  useWebSocket((event) => {
    if (event.type === 'THREAT_EVENT' && event.eventStatus === 'BLOCKED') {
      toast.error(
        `🚫 BLOCKED: ₹${(event.amount/1000).toFixed(0)}K → ${event.recipient} | Score: ${event.score} | ${event.factor}`,
        { duration: 6000, id: event.reference }
      );
    }
  });

  const handleExportReport = async () => {
    try {
      const res = await api.get('/audit/export?format=csv', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rakshak-audit-trail.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Audit report exported successfully');
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        {/* Page Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-dark/50 text-xs font-semibold uppercase tracking-widest mb-1">Overview</p>
            <h1 className="text-4xl font-black text-dark">Sovereign Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportReport}
              className="btn-ghost text-sm px-5 py-2.5 flex items-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              Export Report
            </button>
            <button
              onClick={() => navigate('/payments')}
              className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Payment
            </button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Balance Card (2/3 width) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="col-span-2 card p-6"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-dark/50 mb-3">
                  Available Ledger Balance
                </p>
                <div className="text-4xl font-black text-dark tabular-nums">
                  {loading ? (
                    <div className="h-10 w-72 shimmer rounded-lg" />
                  ) : (
                    <AnimatedBalance value={dashData?.balance || 0} />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-600 rounded-full px-3 py-1.5 text-xs font-bold">
                <TrendingUp className="w-3.5 h-3.5" />
                +{dashData?.balanceChange || '12.5'}%
              </div>
            </div>

            {/* Bar Chart */}
            {loading ? (
              <div className="h-40 shimmer rounded-lg mt-6" />
            ) : (
              <div className="mt-6" style={{ width: '100%', height: 160 }}>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={dashData?.balanceTrend || []} barCategoryGap="30%">
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#1a0a0c', opacity: 0.4 }}
                    />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(114,47,55,0.04)' }} />
                    <Bar
                      dataKey="amount"
                      radius={[4, 4, 0, 0]}
                      fill="#722f37"
                      fillOpacity={0.25}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>

          {/* Trust Score Card (1/3 width) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="card-primary p-6 flex flex-col"
          >
            <div className="mb-4">
              <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-1">Rakshak Shield</p>
              <h3 className="text-white text-xl font-black">Trust Score</h3>
            </div>

            <div className="flex-1 flex items-center justify-center">
              {loading ? (
                <div className="w-32 h-32 rounded-full shimmer" />
              ) : (
                <TrustScoreGauge
                  score={dashData?.trustScore || 92}
                  status={dashData?.trustStatus || 'EXTREME SECURITY'}
                />
              )}
            </div>

            {/* Portfolio info */}
            <div className="mt-4 bg-white/10 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <p className="text-white/70 text-xs leading-relaxed">
                  Your portfolio is currently within{' '}
                  <span className="text-white font-bold">{dashData?.portfolioVariance || '99.9%'}</span>{' '}
                  of the expected variance.{' '}
                  <span className="text-white font-bold">{dashData?.anomalyCount || 0}</span> anomalies detected.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-dark">Recent Transactions</h2>
            <button
              onClick={() => navigate('/audit')}
              className="text-sm text-primary font-semibold hover:text-primary-dark transition-colors"
            >
              View All Records
            </button>
          </div>

          <div className="card overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-6 px-6 py-3 bg-cream-light border-b border-cream-dark/20">
              {['REFERENCE', 'RECIPIENT / SOURCE', 'TYPE', 'AMOUNT', 'STATUS', 'ACTIONS'].map(h => (
                <div key={h} className="text-xs font-bold uppercase tracking-wider text-dark/50">{h}</div>
              ))}
            </div>

            {/* Rows */}
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="grid grid-cols-6 px-6 py-4 border-b border-cream/50 gap-4">
                  {Array(6).fill(0).map((_, j) => (
                    <div key={j} className="h-4 shimmer rounded" />
                  ))}
                </div>
              ))
            ) : (
              (dashData?.recentTransactions || []).map((txn, i) => (
                <motion.div
                  key={txn.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="grid grid-cols-6 items-center px-6 py-4 border-b border-cream/50 hover:bg-cream-light/50 transition-colors"
                >
                  {/* Reference */}
                  <div className="text-xs font-bold text-dark/70">{txn.reference}</div>

                  {/* Recipient */}
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                      txn.status === 'BLOCKED' ? 'bg-red-100' : txn.status === 'REVIEW' ? 'bg-orange-100' : 'bg-green-100'
                    }`}>
                      {txn.recipient.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-dark leading-tight">{txn.recipient.name}</p>
                    </div>
                  </div>

                  {/* Type */}
                  <div className="text-xs text-dark/60 font-medium">{txn.type}</div>

                  {/* Amount */}
                  <div className={`text-sm font-bold tabular-nums ${
                    txn.status === 'BLOCKED' ? 'text-red-600' : 'text-dark'
                  }`}>
                    {formatCurrency(txn.amount)}
                  </div>

                  {/* Status */}
                  <div>
                    <StatusBadge status={txn.status} />
                  </div>

                  {/* Actions */}
                  <div>
                    <button
                      onClick={() => navigate(`/payments/result/${txn.id}`)}
                      className="text-xs text-primary font-semibold hover:text-primary-dark transition-colors"
                    >
                      View →
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>


        {/* Stats Row */}
        {dashData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-4 gap-4 mt-6"
          >
            {[
              { label: 'Total Monitored', value: dashData.totalTransactions?.toLocaleString('en-IN'), color: 'text-dark' },
              { label: 'Approved', value: dashData.approvedCount?.toLocaleString('en-IN'), color: 'text-green-600' },
              { label: 'Under Review', value: dashData.reviewCount?.toLocaleString('en-IN'), color: 'text-orange-500' },
              { label: 'Blocked', value: dashData.blockedCount?.toLocaleString('en-IN'), color: 'text-red-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card p-4 text-center">
                <p className={`text-2xl font-black ${color} tabular-nums`}>{value || '0'}</p>
                <p className="text-xs text-dark/50 font-semibold uppercase tracking-wider mt-1">{label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Transaction DNA Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6 mt-6"
        >
          <div className="mb-4">
            <h2 className="text-lg font-black text-dark">Transaction DNA</h2>
            <p className="text-xs text-dark/40 mt-0.5">
              Your behavioral pattern — Rakshak AI uses this to detect anomalies instantly
            </p>
          </div>
          <DnaHeatmap transactions={allTransactions} />
        </motion.div>
      </div>

      {/* Demo Panel */}
      <DemoPanel />
    </DashboardLayout>
  );
}
