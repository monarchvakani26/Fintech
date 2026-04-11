// ============================================================
// Rakshak AI — Sentinel Intelligence Dashboard
// Premium warm-themed live fraud intelligence hub
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ShieldCheck, ShieldAlert, ShieldX,
  MapPin, Smartphone, Activity, ScanFace,
  User, CreditCard, Wifi, WifiOff, Clock,
  AlertTriangle, CheckCircle, TrendingUp, TrendingDown,
  Monitor, Fingerprint, Globe, Zap, Eye,
  RefreshCw, ArrowUpRight, ArrowDownRight, Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import DashboardLayout from '../components/layout/DashboardLayout';

// ─── Palette helpers ────────────────────────────────────────

const categoryStyles = {
  location:  { accent: '#e87040', accentLight: 'rgba(232,112,64,0.1)',  accentMid: 'rgba(232,112,64,0.15)', gradient: 'from-orange-500 to-red-500' },
  device:    { accent: '#8b5cf6', accentLight: 'rgba(139,92,246,0.1)', accentMid: 'rgba(139,92,246,0.15)', gradient: 'from-violet-500 to-purple-600' },
  behavior:  { accent: '#0ea5e9', accentLight: 'rgba(14,165,233,0.1)', accentMid: 'rgba(14,165,233,0.15)', gradient: 'from-sky-500 to-cyan-500' },
  biometric: { accent: '#ec4899', accentLight: 'rgba(236,72,153,0.1)', accentMid: 'rgba(236,72,153,0.15)', gradient: 'from-pink-500 to-rose-500' },
  user:      { accent: '#722f37', accentLight: 'rgba(114,47,55,0.08)', accentMid: 'rgba(114,47,55,0.14)', gradient: 'from-primary to-primary-dark' },
  finance:   { accent: '#059669', accentLight: 'rgba(5,150,105,0.1)',  accentMid: 'rgba(5,150,105,0.15)', gradient: 'from-emerald-500 to-teal-600' },
  trust:     { accent: '#722f37', accentLight: 'rgba(114,47,55,0.06)', accentMid: 'rgba(114,47,55,0.12)', gradient: 'from-primary to-primary-dark' },
};

// ─── Reusable Components ────────────────────────────────────

function IntelCard({ title, icon: Icon, category, children, flash }) {
  const style = categoryStyles[category] || categoryStyles.user;
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    if (flash) {
      setPulsing(true);
      const t = setTimeout(() => setPulsing(false), 2000);
      return () => clearTimeout(t);
    }
  }, [flash]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`rounded-2xl bg-white border-2 overflow-hidden transition-all duration-500 ${
        pulsing ? 'border-primary/30 shadow-lg' : 'border-transparent shadow-[0_1px_6px_rgba(0,0,0,0.06)]'
      }`}
    >
      {/* Top accent stripe */}
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${style.accent}, ${style.accent}88)` }} />

      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: style.accentLight }}
        >
          <Icon className="w-4 h-4" style={{ color: style.accent }} />
        </div>
        <h3 className="text-[13px] font-bold text-dark uppercase tracking-wider">{title}</h3>
        {pulsing && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold text-emerald-700 bg-emerald-100"
          >
            LIVE
          </motion.span>
        )}
      </div>

      {/* Body */}
      <div className="px-5 pb-5">
        {children}
      </div>
    </motion.div>
  );
}

function Metric({ label, value, icon: Icon, status }) {
  const colorMap = { good: 'text-emerald-600', warn: 'text-amber-600', bad: 'text-red-500', default: 'text-dark' };
  const valColor = colorMap[status] || colorMap.default;

  return (
    <div className="flex items-center justify-between py-2 group">
      <div className="flex items-center gap-2 min-w-0">
        {Icon && <Icon className="w-3.5 h-3.5 text-dark/25 flex-shrink-0" />}
        <span className="text-xs text-dark/50 truncate">{label}</span>
      </div>
      <span className={`text-sm font-bold ${valColor} tabular-nums flex-shrink-0 ml-3`}>
        {value || '—'}
      </span>
    </div>
  );
}

function RiskBadge({ level }) {
  const config = {
    LOW:      { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: ShieldCheck },
    MEDIUM:   { bg: 'bg-amber-100',   text: 'text-amber-700',   icon: Shield },
    HIGH:     { bg: 'bg-orange-100',   text: 'text-orange-700',  icon: ShieldAlert },
    CRITICAL: { bg: 'bg-red-100',      text: 'text-red-700',     icon: ShieldX },
  };
  const c = config[level] || config.MEDIUM;
  const RiskIcon = c.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black ${c.bg} ${c.text}`}>
      <RiskIcon className="w-3.5 h-3.5" />
      {level}
    </span>
  );
}

// ─── Trust Score Ring ───────────────────────────────────────

function TrustRing({ score, prevScore }) {
  const r = 64;
  const circ = 2 * Math.PI * r;
  const progress = ((score || 0) / 100) * circ;
  const offset = circ - progress;
  const s = score || 0;

  const getColor = () => {
    if (s >= 80) return '#059669';
    if (s >= 55) return '#d97706';
    if (s >= 30) return '#ea580c';
    return '#dc2626';
  };
  const color = getColor();
  const trending = prevScore !== undefined && score !== prevScore;
  const up = score > (prevScore || 0);

  return (
    <div className="relative flex flex-col items-center">
      <svg width="160" height="160" className="transform -rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="10" />
        <motion.circle
          cx="80" cy="80" r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.p
          key={score}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-4xl font-black text-dark"
        >
          {s}
        </motion.p>
        <p className="text-[10px] uppercase tracking-widest text-dark/35 mt-0.5 font-semibold">Trust Score</p>
        {trending && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-0.5 mt-1 text-xs font-bold ${up ? 'text-emerald-600' : 'text-red-500'}`}
          >
            {up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {Math.abs(score - (prevScore || 0))} pts
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

export default function SentinelDashboard() {
  const { user } = useAuth();
  const { connected, subscribe } = useSocket();
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [flashSections, setFlashSections] = useState({});
  const [prevScore, setPrevScore] = useState(undefined);
  const [updateCount, setUpdateCount] = useState(0);

  const fetchData = useCallback(async () => {
    if (!user?.user_id) return;
    try {
      const res = await api.get(`/user/dashboard-data/${user.user_id}`);
      if (res.data.success) {
        setDashData(prev => {
          if (prev) setPrevScore(prev.risk?.trust_score);
          return res.data.data;
        });
      }
    } catch (err) {
      console.error('[SentinelDash] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const unsub1 = subscribe('user-data-updated', (payload) => {
      if (payload.userId === user?.user_id) {
        setFlashSections(prev => ({ ...prev, [payload.section]: Date.now() }));
        setUpdateCount(prev => prev + 1);
        fetchData();
      }
    });
    const unsub2 = subscribe('risk-score-changed', (payload) => {
      if (payload.userId === user?.user_id) {
        setFlashSections(prev => ({ ...prev, risk: Date.now() }));
        setUpdateCount(prev => prev + 1);
        fetchData();
      }
    });
    return () => { unsub1(); unsub2(); };
  }, [subscribe, user?.user_id, fetchData]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-dark/50 font-medium">Loading Sentinel Intelligence...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const d = dashData || {};
  const risk = d.risk || {};
  const financial = d.financial || {};
  const loc = d.location || {};
  const devices = d.devices || {};
  const behavioral = d.behavioral || {};
  const biometric = d.biometric || {};
  const computed = d.computed || {};

  const completeness = computed.profileCompleteness || 0;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* ── HEADER ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-dark tracking-tight">Sentinel Intelligence</h1>
                <p className="text-xs text-dark/40 font-medium mt-0.5">Real-time fraud intelligence for <span className="text-primary font-bold">{d.name || 'User'}</span></p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {connected ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold">
                <WifiOff className="w-3 h-3" /> Offline
              </span>
            )}
            <button
              onClick={fetchData}
              className="w-9 h-9 rounded-xl bg-white border border-cream-dark/20 hover:border-primary/30 flex items-center justify-center text-dark/40 hover:text-primary transition-all shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── ROW 1 — Risk + Trust + Profile ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          {/* Risk & Trust Card — Spans 2 cols */}
          <div className="lg:col-span-2 rounded-2xl bg-white border-2 border-transparent shadow-[0_1px_6px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-primary/20" />
            <div className="p-6 flex flex-col sm:flex-row items-center gap-8">
              {/* Trust Ring */}
              <TrustRing score={risk.trust_score} prevScore={prevScore} />

              {/* Risk Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-dark/35 font-semibold mb-1">Risk Level</p>
                    <RiskBadge level={risk.risk_level || 'MEDIUM'} />
                  </div>
                </div>

                {/* Risk Factors */}
                {risk.factors?.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <p className="text-[10px] uppercase tracking-widest text-dark/35 font-semibold">Active Alerts</p>
                    {risk.factors.slice(0, 3).map((f, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100">
                        <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                        <span className="text-xs text-amber-800 font-medium">{f}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center px-3 py-2.5 rounded-xl bg-cream/60">
                    <p className="text-lg font-black text-dark tabular-nums">{computed.totalDevices || 0}</p>
                    <p className="text-[10px] text-dark/35 font-semibold uppercase">Devices</p>
                  </div>
                  <div className="text-center px-3 py-2.5 rounded-xl bg-cream/60">
                    <p className="text-lg font-black text-dark tabular-nums">{computed.trustedDeviceCount || 0}</p>
                    <p className="text-[10px] text-dark/35 font-semibold uppercase">Trusted</p>
                  </div>
                  <div className="text-center px-3 py-2.5 rounded-xl bg-cream/60">
                    <p className="text-lg font-black tabular-nums" style={{ color: biometric.enabled ? '#059669' : '#dc2626' }}>
                      {biometric.enabled ? 'ON' : 'OFF'}
                    </p>
                    <p className="text-[10px] text-dark/35 font-semibold uppercase">Biometric</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Completeness */}
          <div className="rounded-2xl bg-white border-2 border-transparent shadow-[0_1px_6px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col">
            <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-400" />
            <div className="p-6 flex-1 flex flex-col">
              {/* User Avatar */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-black text-base shadow-md">
                  {(d.name || 'U').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-dark truncate">{d.name || 'Unknown User'}</p>
                  <p className="text-[11px] text-dark/40 truncate">{d.email}</p>
                </div>
              </div>

              <div className="flex-1" />

              {/* Completion Ring + Bar */}
              <div>
                <div className="flex items-end justify-between mb-2">
                  <p className="text-[10px] uppercase tracking-widest text-dark/35 font-semibold">Profile Completeness</p>
                  <span className="text-2xl font-black text-dark tabular-nums">{completeness}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-cream overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: completeness >= 70 ? 'linear-gradient(90deg, #059669, #10b981)' : completeness >= 40 ? 'linear-gradient(90deg, #d97706, #f59e0b)' : 'linear-gradient(90deg, #dc2626, #ef4444)' }}
                    animate={{ width: `${completeness}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-[10px] text-dark/30 mt-2">
                  {completeness < 50 ? 'Complete your profile to improve trust score' : completeness < 80 ? 'Good progress — keep going' : 'Excellent profile coverage'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── ROW 2 — Intelligence Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Location */}
          <IntelCard title="Location" icon={MapPin} category="location" flash={flashSections.location}>
            <div className="space-y-0.5">
              <Metric label="Current" icon={MapPin}
                value={loc.last_location?.lat
                  ? `${Number(loc.last_location.lat).toFixed(3)}, ${Number(loc.last_location.lng).toFixed(3)}`
                  : null
                }
              />
              <Metric label="Home City" icon={Globe} value={loc.home_location?.city} />
              <Metric label="Distance" icon={MapPin}
                value={computed.distanceFromHome}
                status={computed.distanceFromHome && parseFloat(computed.distanceFromHome) > 500 ? 'bad' : 'good'}
              />
              <Metric label="Usual" icon={Globe}
                value={loc.usual_locations?.length ? loc.usual_locations.join(', ') : null}
              />
            </div>
          </IntelCard>

          {/* Devices */}
          <IntelCard title="Devices" icon={Smartphone} category="device" flash={flashSections.device}>
            <div className="space-y-0.5">
              <Metric label="Trusted" icon={Fingerprint}
                value={`${computed.trustedDeviceCount || 0} / ${computed.totalDevices || 0}`}
                status="good"
              />
              <Metric label="Current" icon={Monitor}
                value={devices.last_used_device ? devices.last_used_device.slice(0, 12) + '…' : null}
              />
            </div>
            {devices.trusted_devices?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-cream-dark/10 space-y-1.5">
                {devices.trusted_devices.slice(0, 2).map((dev, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-cream/50">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dev.trusted ? 'bg-emerald-500' : 'bg-red-400'}`} />
                    <span className="text-[11px] text-dark/60 font-medium truncate">{dev.os || 'Unknown'} · {dev.browser || 'Unknown'}</span>
                  </div>
                ))}
              </div>
            )}
          </IntelCard>

          {/* Behavior */}
          <IntelCard title="Behavior" icon={Activity} category="behavior" flash={flashSections.behavior}>
            <div className="space-y-0.5">
              <Metric label="Typing Speed" icon={Zap}
                value={behavioral.typing_speed_avg ? `${behavioral.typing_speed_avg.toFixed(1)} cps` : null}
              />
              <Metric label="Avg Session" icon={Clock}
                value={behavioral.session_duration_avg
                  ? `${Math.floor(behavioral.session_duration_avg / 60)}m ${Math.floor(behavioral.session_duration_avg % 60)}s`
                  : null
                }
              />
              <Metric label="Active Hours" icon={Activity}
                value={behavioral.usual_active_hours
                  ? `${behavioral.usual_active_hours.start}:00–${behavioral.usual_active_hours.end}:00`
                  : null
                }
              />
              <Metric label="Avg Txn" icon={TrendingUp}
                value={behavioral.avg_transaction_amount
                  ? `₹${Number(behavioral.avg_transaction_amount).toLocaleString('en-IN')}`
                  : null
                }
              />
            </div>
          </IntelCard>

          {/* Biometric */}
          <IntelCard title="Biometric" icon={ScanFace} category="biometric" flash={flashSections.biometric}>
            <div className="flex flex-col items-center py-3 mb-3">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-2 ${
                biometric.enabled
                  ? 'bg-emerald-50 border-2 border-emerald-200'
                  : 'bg-cream border-2 border-cream-dark/15'
              }`}>
                {biometric.enabled
                  ? <CheckCircle className="w-7 h-7 text-emerald-500" />
                  : <ScanFace className="w-7 h-7 text-dark/20" />
                }
              </div>
              <p className={`text-xs font-bold ${biometric.enabled ? 'text-emerald-600' : 'text-dark/35'}`}>
                {biometric.enabled ? 'Verified' : 'Not Registered'}
              </p>
            </div>
            <div className="space-y-0.5 pt-3 border-t border-cream-dark/10">
              <Metric label="Status" icon={Eye}
                value={biometric.enabled ? 'Active' : 'Inactive'}
                status={biometric.enabled ? 'good' : 'bad'}
              />
              <Metric label="Model" icon={ScanFace} value={biometric.embedding_model} />
              <Metric label="Last Verified" icon={Clock}
                value={biometric.last_verified ? new Date(biometric.last_verified).toLocaleDateString() : null}
              />
            </div>
          </IntelCard>
        </div>

        {/* ── LIVE ACTIVITY FOOTER ── */}
        {updateCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 px-5 py-3.5 rounded-2xl bg-white border border-emerald-200/60 flex items-center gap-3"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <p className="text-xs text-dark/50 font-medium flex-1">
              Receiving live intelligence updates via WebSocket
            </p>
            <span className="text-[11px] px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold tabular-nums">
              {updateCount} updates
            </span>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
