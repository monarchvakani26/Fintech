// ============================================================
// Rakshak AI - Dashboard Page
// Balance, Trust Score, Recent Transactions + DNA Heatmap + Live Intel Panels
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  TrendingUp, FileDown, Plus, CheckCircle,
  MapPin, Smartphone, Activity, ScanFace, Shield,
  Globe, Fingerprint, Clock, Zap, Eye, Monitor,
  Wifi, WifiOff, RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import TrustScoreGauge from '../components/dashboard/TrustScoreGauge';
import DemoPanel from '../components/dashboard/DemoPanel';
import StatusBadge from '../components/common/StatusBadge';
import { formatCurrency, formatDate, getRiskLevel } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
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

// ─── Intel Card (matches cream UI) ──────────────────────────
function IntelCard({ title, icon: Icon, children, flash }) {
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    if (flash) {
      setShowPulse(true);
      const t = setTimeout(() => setShowPulse(false), 2000);
      return () => clearTimeout(t);
    }
  }, [flash]);

  return (
    <div className={`card p-5 transition-all duration-500 ${showPulse ? 'ring-2 ring-green-300 shadow-glow-green' : ''}`}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center relative">
          <Icon className="w-4 h-4 text-primary" />
          {showPulse && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-400 animate-ping" />
          )}
        </div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-dark/60">{title}</h4>
        {showPulse && (
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200 font-bold animate-fade-in">
            UPDATED
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Metric row ─────────────────────────────────────────────
function MetricRow({ label, value, icon: Icon, valueColor = 'text-dark' }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3 text-dark/25" />}
        <span className="text-xs text-dark/50">{label}</span>
      </div>
      <span className={`text-xs font-bold ${valueColor}`}>{value || '—'}</span>
    </div>
  );
}

// ─── Risk Badge ─────────────────────────────────────────────
function RiskBadge({ level }) {
  const config = {
    LOW: 'badge-approved',
    MEDIUM: 'badge-review',
    HIGH: 'badge-blocked',
    CRITICAL: 'badge-blocked',
  };
  return <span className={config[level] || 'badge-pending'}>{level || 'N/A'}</span>;
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

  const getCellColor = (val) => {
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
                getCellColor(grid[di][h])
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
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [liveFlash, setLiveFlash] = useState(null); // txn id that just arrived
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { connected, subscribe } = useSocket();

  // Intel data
  const [intelData, setIntelData] = useState(null);
  const [flashSections, setFlashSections] = useState({});
  const [updateCount, setUpdateCount] = useState(0);

  // Fetch existing dashboard data
  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get('/dashboard');
      if (res.data.success) {
        setDashData(res.data.data);
        // Seed the local recentTransactions from API on first load
        if (res.data.data?.recentTransactions) {
          setRecentTransactions(res.data.data.recentTransactions);
        }
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user intel data
  const fetchIntel = useCallback(async () => {
    if (!user?.user_id) return;
    try {
      const res = await api.get(`/user/dashboard-data/${user.user_id}`);
      if (res.data.success) {
        setIntelData(res.data.data);
      }
    } catch {
      // Silently fail — intel panel is optional
    }
  }, [user?.user_id]);

  useEffect(() => {
    fetchDashboard();
    fetchIntel();
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboard, fetchIntel]);

  // Socket.IO real-time updates
  useEffect(() => {
    const unsub1 = subscribe('user-data-updated', (payload) => {
      if (payload.userId === user?.user_id) {
        setFlashSections(prev => ({ ...prev, [payload.section]: Date.now() }));
        setUpdateCount(prev => prev + 1);
        fetchIntel();
      }
    });
    const unsub2 = subscribe('risk-score-changed', (payload) => {
      if (payload.userId === user?.user_id) {
        setFlashSections(prev => ({ ...prev, risk: Date.now() }));
        setUpdateCount(prev => prev + 1);
        fetchIntel();
        fetchDashboard();
      }
    });
    return () => { unsub1(); unsub2(); };
  }, [subscribe, user?.user_id, fetchIntel, fetchDashboard]);

  // ── REAL-TIME transaction updates via Socket.IO ──
  useEffect(() => {
    const unsubTxn = subscribe('transaction-update', (payload) => {
      if (payload.userId !== user?.user_id) return;
      const txn = payload.transaction;
      if (!txn) return;

      // Prepend new transaction to the top of the list
      setRecentTransactions(prev => {
        const alreadyExists = prev.some(t => t.id === txn.id);
        if (alreadyExists) {
          return prev.map(t => t.id === txn.id ? txn : t);
        }
        return [txn, ...prev].slice(0, 20);
      });

      // Also update DNA heatmap
      setAllTransactions(prev => {
        const alreadyExists = prev.some(t => t.id === txn.id);
        return alreadyExists ? prev : [txn, ...prev];
      });

      // Flash the row
      setLiveFlash(txn.id);
      setTimeout(() => setLiveFlash(null), 3000);

      // Refresh stats panel
      fetchDashboard();

      // Live toast
      const icon = txn.status === 'APPROVED' ? '✅' : txn.status === 'BLOCKED' ? '🚫' : '⚠️';
      toast(`${icon} ₹${(txn.amount || 0).toLocaleString('en-IN')} → ${txn.recipient?.vpa || 'unknown'} — ${txn.status}`, {
        duration: 4000,
        style: {
          background: txn.status === 'APPROVED' ? '#f0fdf4' : txn.status === 'BLOCKED' ? '#fef2f2' : '#fff7ed',
          border: txn.status === 'APPROVED' ? '1px solid #86efac' : txn.status === 'BLOCKED' ? '1px solid #fca5a5' : '1px solid #fdba74',
          color: '#1a0a0c',
          fontWeight: 600,
          fontSize: '13px',
        },
      });
    });
    return () => unsubTxn();
  }, [subscribe, user?.user_id, fetchDashboard]);

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

  const intel = intelData || {};
  const location = intel.location || {};
  const devices = intel.devices || {};
  const behavioral = intel.behavioral || {};
  const biometric = intel.biometric || {};
  const computed = intel.computed || {};
  const risk = intel.risk || {};

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
            {connected ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-600 text-xs font-bold">
                <Wifi className="w-3.5 h-3.5" /> Live
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-bold">
                <WifiOff className="w-3.5 h-3.5" /> Offline
              </span>
            )}
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

        {/* ═══ REAL-TIME INTELLIGENCE PANELS ═══ */}
        {intelData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-dark flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Sentinel Intelligence
              </h2>
              <div className="flex items-center gap-3">
                {updateCount > 0 && (
                  <span className="text-xs text-dark/40 font-mono">{updateCount} live updates</span>
                )}
                <button onClick={fetchIntel} className="p-2 rounded-lg bg-cream-dark/20 hover:bg-cream-dark/40 text-dark/40 hover:text-dark transition-all">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Location Panel */}
              <IntelCard title="Location" icon={MapPin} flash={flashSections.location}>
                <div className="space-y-0.5">
                  <MetricRow
                    label="Current"
                    value={location.last_location?.lat ? `${Number(location.last_location.lat).toFixed(3)}, ${Number(location.last_location.lng).toFixed(3)}` : null}
                    icon={MapPin}
                  />
                  <MetricRow label="Home City" value={location.home_location?.city} icon={Globe} />
                  <MetricRow
                    label="Distance"
                    value={computed.distanceFromHome}
                    icon={MapPin}
                    valueColor={computed.distanceFromHome && parseFloat(computed.distanceFromHome) > 500 ? 'text-red-600' : 'text-green-600'}
                  />
                  <MetricRow label="Usual" value={location.usual_locations?.join(', ')} icon={Globe} />
                </div>
              </IntelCard>

              {/* Device Panel */}
              <IntelCard title="Devices" icon={Smartphone} flash={flashSections.device}>
                <div className="space-y-0.5">
                  <MetricRow label="Trusted" value={`${computed.trustedDeviceCount || 0} / ${computed.totalDevices || 0}`} icon={Fingerprint} valueColor="text-green-600" />
                  <MetricRow label="Current" value={devices.last_used_device ? devices.last_used_device.slice(0, 10) + '...' : null} icon={Monitor} />
                </div>
                {devices.trusted_devices?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-cream-dark/20 space-y-1.5">
                    {devices.trusted_devices.slice(0, 2).map((dev, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <div className={`w-1.5 h-1.5 rounded-full ${dev.trusted ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-dark/60 truncate flex-1">{dev.os || 'Unknown'} · {dev.browser || ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </IntelCard>

              {/* Behavior Panel */}
              <IntelCard title="Behavior" icon={Activity} flash={flashSections.behavior}>
                <div className="space-y-0.5">
                  <MetricRow label="Typing Speed" value={behavioral.typing_speed_avg ? `${behavioral.typing_speed_avg.toFixed(1)} cps` : null} icon={Zap} />
                  <MetricRow
                    label="Avg Session"
                    value={behavioral.session_duration_avg
                      ? `${Math.floor(behavioral.session_duration_avg / 60)}m ${Math.floor(behavioral.session_duration_avg % 60)}s`
                      : null
                    }
                    icon={Clock}
                  />
                  <MetricRow
                    label="Active Hours"
                    value={behavioral.usual_active_hours
                      ? `${behavioral.usual_active_hours.start}:00–${behavioral.usual_active_hours.end}:00`
                      : null
                    }
                    icon={Activity}
                  />
                  <MetricRow
                    label="Avg Txn"
                    value={behavioral.avg_transaction_amount
                      ? `₹${Number(behavioral.avg_transaction_amount).toLocaleString('en-IN')}`
                      : null
                    }
                    icon={TrendingUp}
                  />
                </div>
              </IntelCard>

              {/* Biometric Panel */}
              <IntelCard title="Biometric" icon={ScanFace} flash={flashSections.biometric}>
                <div className="flex flex-col items-center py-2 mb-2">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${biometric.enabled ? 'bg-green-50 border border-green-200' : 'bg-cream-light border border-cream-dark/20'}`}>
                    {biometric.enabled
                      ? <CheckCircle className="w-6 h-6 text-green-600" />
                      : <ScanFace className="w-6 h-6 text-dark/20" />
                    }
                  </div>
                  <p className={`text-xs font-bold ${biometric.enabled ? 'text-green-600' : 'text-dark/30'}`}>
                    {biometric.enabled ? 'Verified' : 'Not Registered'}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <MetricRow label="Status" value={biometric.enabled ? 'Active' : 'Inactive'} icon={Eye} valueColor={biometric.enabled ? 'text-green-600' : 'text-red-500'} />
                  <MetricRow label="Model" value={biometric.embedding_model} icon={ScanFace} />
                  <MetricRow label="Last Verified" value={biometric.last_verified ? new Date(biometric.last_verified).toLocaleDateString() : null} icon={Clock} />
                </div>
              </IntelCard>
            </div>

            {/* Risk level & profile completeness row */}
            {(risk.risk_level || computed.profileCompleteness) && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="card p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-dark/50 uppercase tracking-wider mb-1">Risk Level</p>
                    <RiskBadge level={risk.risk_level} />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-dark/50 uppercase tracking-wider mb-1">Trust</p>
                    <p className="text-2xl font-black text-dark tabular-nums">{risk.trust_score || '—'}</p>
                  </div>
                </div>
                <div className="card p-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-bold text-dark/50 uppercase tracking-wider">Profile Completeness</p>
                    <p className="text-sm font-black text-dark">{computed.profileCompleteness || 0}%</p>
                  </div>
                  <div className="h-2 rounded-full bg-cream-dark/30 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light"
                      animate={{ width: `${computed.profileCompleteness || 0}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

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
            ) : recentTransactions.length === 0 ? (
              <div className="px-6 py-12 text-center text-dark/40">
                <p className="font-bold mb-1">No transactions yet</p>
                <p className="text-xs">Make a payment to see live updates here</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {recentTransactions.map((txn, i) => (
                  <motion.div
                    key={txn.id}
                    initial={{ opacity: 0, y: -12, backgroundColor: '#f0fdf4' }}
                    animate={{
                      opacity: 1, y: 0,
                      backgroundColor: liveFlash === txn.id
                        ? txn.status === 'BLOCKED' ? '#fef2f2' : txn.status === 'REVIEW' ? '#fff7ed' : '#f0fdf4'
                        : 'transparent',
                    }}
                    transition={{ delay: liveFlash === txn.id ? 0 : i * 0.04, duration: 0.3 }}
                    className={`grid grid-cols-6 items-center px-6 py-4 border-b border-cream/50 hover:bg-cream-light/50 transition-colors ${
                      liveFlash === txn.id ? 'ring-1 ring-inset ring-green-300' : ''
                    }`}
                  >
                    <div className="text-xs font-bold text-dark/70 flex items-center gap-1">
                      {liveFlash === txn.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping inline-block" />
                      )}
                      {txn.reference}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                        txn.status === 'BLOCKED' ? 'bg-red-100' : txn.status === 'REVIEW' ? 'bg-orange-100' : 'bg-green-100'
                      }`}>
                        {txn.recipient?.icon || '👤'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-dark leading-tight">{txn.recipient?.name || txn.recipient?.vpa}</p>
                      </div>
                    </div>
                    <div className="text-xs text-dark/60 font-medium">{txn.type || 'SEND'}</div>
                    <div className={`text-sm font-bold tabular-nums ${
                      txn.status === 'BLOCKED' ? 'text-red-600' : 'text-dark'
                    }`}>
                      {formatCurrency(txn.amount)}
                    </div>
                    <div><StatusBadge status={txn.status} /></div>
                    <div>
                      <button
                        onClick={() => navigate(`/payments/result/${txn.id}`)}
                        className="text-xs text-primary font-semibold hover:text-primary-dark transition-colors"
                      >
                        View →
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
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
