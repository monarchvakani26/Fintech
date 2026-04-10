// ============================================================
// Rakshak AI — Sentinel Dashboard (Real-Time)
// Displays live user data with WebSocket-driven updates.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ShieldCheck, ShieldAlert, ShieldX,
  MapPin, Smartphone, Activity, ScanFace,
  User, CreditCard, Wifi, WifiOff, Clock,
  AlertTriangle, CheckCircle, TrendingUp, TrendingDown,
  Monitor, Fingerprint, Globe, Zap, Eye,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import DashboardLayout from '../components/layout/DashboardLayout';

// ─── Helper components ──────────────────────────────────────

function UpdatePulse() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: 2.5, opacity: 0 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      className="absolute inset-0 rounded-full bg-emerald-400"
    />
  );
}

function SectionCard({ title, icon: Icon, iconColor, children, lastUpdated, flash }) {
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    if (flash) {
      setShowPulse(true);
      const t = setTimeout(() => setShowPulse(false), 1500);
      return () => clearTimeout(t);
    }
  }, [flash]);

  return (
    <motion.div
      layout
      className={`
        rounded-2xl bg-gradient-to-br from-[#0d1117] to-[#161b22]
        border transition-all duration-500 overflow-hidden
        ${showPulse ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10' : 'border-white/10'}
      `}
    >
      <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${iconColor} flex items-center justify-center shadow-lg relative`}>
          <Icon className="w-4.5 h-4.5 text-white" />
          {showPulse && (
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          {lastUpdated && (
            <p className="text-[10px] text-white/30">
              Updated {new Date(lastUpdated).toLocaleTimeString()}
            </p>
          )}
        </div>
        {showPulse && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold"
          >
            UPDATED
          </motion.span>
        )}
      </div>
      <div className="p-5">
        {children}
      </div>
    </motion.div>
  );
}

function MetricItem({ label, value, icon: Icon, valueColor = 'text-white' }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5 text-white/30" />}
        <span className="text-xs text-white/50">{label}</span>
      </div>
      <span className={`text-sm font-bold ${valueColor}`}>{value || '—'}</span>
    </div>
  );
}

// ─── Risk Badge ─────────────────────────────────────────────

function RiskBadge({ level }) {
  const config = {
    LOW: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: ShieldCheck },
    MEDIUM: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', icon: Shield },
    HIGH: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30', icon: ShieldAlert },
    CRITICAL: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', icon: ShieldX },
  };
  const c = config[level] || config.MEDIUM;
  const RiskIcon = c.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${c.bg} ${c.text} ${c.border}`}>
      <RiskIcon className="w-3.5 h-3.5" />
      {level}
    </span>
  );
}

// ─── Trust Score Gauge ──────────────────────────────────────

function TrustGauge({ score, prevScore }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = ((score || 0) / 100) * circumference;
  const offset = circumference - progress;

  const getColor = (s) => {
    if (s >= 80) return { stroke: '#10b981', glow: 'rgba(16,185,129,0.3)' };
    if (s >= 55) return { stroke: '#f59e0b', glow: 'rgba(245,158,11,0.3)' };
    if (s >= 30) return { stroke: '#f97316', glow: 'rgba(249,115,22,0.3)' };
    return { stroke: '#ef4444', glow: 'rgba(239,68,68,0.3)' };
  };

  const color = getColor(score || 0);
  const trending = prevScore !== undefined && score !== prevScore;
  const trendUp = score > (prevScore || 0);

  return (
    <div className="relative flex flex-col items-center">
      <svg width="180" height="180" className="transform -rotate-90">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
        <motion.circle
          cx="90" cy="90" r={radius}
          fill="none"
          stroke={color.stroke}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 8px ${color.glow})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.p
          key={score}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-4xl font-black text-white"
        >
          {score || 0}
        </motion.p>
        <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">Trust Score</p>
        {trending && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-1 mt-1 text-xs font-bold ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}
          >
            {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(score - (prevScore || 0))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────

export default function SentinelDashboard() {
  const { user } = useAuth();
  const { connected, subscribe } = useSocket();
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [flashSections, setFlashSections] = useState({});
  const [prevScore, setPrevScore] = useState(undefined);
  const [updateCount, setUpdateCount] = useState(0);

  // Fetch dashboard data
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Listen for real-time updates
  useEffect(() => {
    const unsub1 = subscribe('user-data-updated', (payload) => {
      if (payload.userId === user?.user_id) {
        setFlashSections(prev => ({ ...prev, [payload.section]: Date.now() }));
        setUpdateCount(prev => prev + 1);
        // Refresh full data
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
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-dark/60 font-medium">Loading Sentinel Dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const d = dashData || {};
  const risk = d.risk || {};
  const financial = d.financial || {};
  const location = d.location || {};
  const devices = d.devices || {};
  const behavioral = d.behavioral || {};
  const biometric = d.biometric || {};
  const computed = d.computed || {};

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-dark flex items-center gap-3">
              <Shield className="w-7 h-7 text-primary" />
              Sentinel Dashboard
            </h1>
            <p className="text-sm text-dark/50 mt-1">Real-time fraud intelligence hub</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-dark/40 font-mono">{updateCount} updates</span>
            {connected ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                <Wifi className="w-3.5 h-3.5" /> Live
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                <WifiOff className="w-3.5 h-3.5" /> Offline
              </span>
            )}
            <button
              onClick={fetchData}
              className="p-2 rounded-lg bg-cream-dark/30 hover:bg-cream-dark/50 text-dark/50 hover:text-dark transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top Row — Overview + Trust Gauge */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* User Overview */}
          <SectionCard
            title="User Overview"
            icon={User}
            iconColor="from-blue-500 to-blue-600"
            flash={flashSections.basic || flashSections.profile}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white font-black text-lg shadow-lg">
                {(d.name || 'U').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-bold text-white">{d.name || 'Unknown User'}</p>
                <p className="text-xs text-white/40">{d.email}</p>
                <p className="text-xs text-white/30">{d.phone || 'No phone'}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <RiskBadge level={risk.risk_level || 'MEDIUM'} />
              <span className="text-xs text-white/30">Status: {d.status || 'ACTIVE'}</span>
            </div>
            <div className="mt-3 pt-3 border-t border-white/5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/40">Profile Completeness</span>
                <span className="text-xs font-bold text-white">{computed.profileCompleteness || 0}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 mt-2 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                  animate={{ width: `${computed.profileCompleteness || 0}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
            </div>
          </SectionCard>

          {/* Trust Score Gauge */}
          <SectionCard
            title="Trust Score"
            icon={Shield}
            iconColor="from-emerald-500 to-teal-600"
            flash={flashSections.risk}
          >
            <div className="flex justify-center">
              <TrustGauge score={risk.trust_score} prevScore={prevScore} />
            </div>
            {risk.factors?.length > 0 && (
              <div className="mt-4 space-y-2">
                {risk.factors.slice(0, 3).map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    <span className="text-white/60">{f}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Financial */}
          <SectionCard
            title="Financial Profile"
            icon={CreditCard}
            iconColor="from-emerald-500 to-teal-600"
            flash={flashSections.financial}
          >
            <div className="space-y-1">
              <MetricItem label="Card" value={financial.card_last4 ? `•••• ${financial.card_last4}` : null} icon={CreditCard} />
              <MetricItem label="Card Type" value={financial.card_type} icon={CreditCard} />
              <MetricItem label="Bank" value={financial.bank_name} icon={Globe} />
              <MetricItem
                label="Avg Balance"
                value={financial.avg_balance ? `₹${Number(financial.avg_balance).toLocaleString('en-IN')}` : null}
                icon={TrendingUp}
                valueColor="text-emerald-400"
              />
            </div>
          </SectionCard>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Location Panel */}
          <SectionCard
            title="Location Intelligence"
            icon={MapPin}
            iconColor="from-orange-500 to-red-600"
            flash={flashSections.location}
          >
            <div className="space-y-1">
              <MetricItem
                label="Current"
                value={location.last_location?.lat
                  ? `${Number(location.last_location.lat).toFixed(4)}, ${Number(location.last_location.lng).toFixed(4)}`
                  : null
                }
                icon={MapPin}
              />
              <MetricItem
                label="Home City"
                value={location.home_location?.city}
                icon={Globe}
              />
              <MetricItem
                label="Distance from Home"
                value={computed.distanceFromHome}
                icon={MapPin}
                valueColor={
                  computed.distanceFromHome && parseFloat(computed.distanceFromHome) > 500
                    ? 'text-red-400'
                    : 'text-emerald-400'
                }
              />
              <MetricItem
                label="Usual Locations"
                value={location.usual_locations?.length ? location.usual_locations.join(', ') : null}
                icon={Globe}
              />
            </div>
          </SectionCard>

          {/* Device Panel */}
          <SectionCard
            title="Device Intelligence"
            icon={Smartphone}
            iconColor="from-purple-500 to-violet-600"
            flash={flashSections.device}
          >
            <div className="space-y-1">
              <MetricItem
                label="Current Device"
                value={devices.last_used_device ? devices.last_used_device.slice(0, 12) + '...' : null}
                icon={Monitor}
              />
              <MetricItem
                label="Trusted Devices"
                value={`${computed.trustedDeviceCount || 0} / ${computed.totalDevices || 0}`}
                icon={Fingerprint}
                valueColor="text-emerald-400"
              />
            </div>

            {devices.trusted_devices?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                {devices.trusted_devices.slice(0, 3).map((dev, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                    <div className={`w-2 h-2 rounded-full ${dev.trusted ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{dev.os || 'Unknown'}</p>
                      <p className="text-[10px] text-white/30">{dev.browser || 'Unknown browser'}</p>
                    </div>
                    <span className={`text-[10px] font-bold ${dev.trusted ? 'text-emerald-400' : 'text-red-400'}`}>
                      {dev.trusted ? 'TRUSTED' : 'UNTRUSTED'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Behavior Panel */}
          <SectionCard
            title="Behavioral Analytics"
            icon={Activity}
            iconColor="from-cyan-500 to-blue-600"
            flash={flashSections.behavior}
          >
            <div className="space-y-1">
              <MetricItem
                label="Typing Speed"
                value={behavioral.typing_speed_avg ? `${behavioral.typing_speed_avg.toFixed(1)} cps` : null}
                icon={Zap}
              />
              <MetricItem
                label="Avg Session"
                value={behavioral.session_duration_avg
                  ? `${Math.floor(behavioral.session_duration_avg / 60)}m ${Math.floor(behavioral.session_duration_avg % 60)}s`
                  : null
                }
                icon={Clock}
              />
              <MetricItem
                label="Active Hours"
                value={behavioral.usual_active_hours
                  ? `${behavioral.usual_active_hours.start}:00 – ${behavioral.usual_active_hours.end}:00`
                  : null
                }
                icon={Activity}
              />
              <MetricItem
                label="Avg Txn Amount"
                value={behavioral.avg_transaction_amount
                  ? `₹${Number(behavioral.avg_transaction_amount).toLocaleString('en-IN')}`
                  : null
                }
                icon={TrendingUp}
              />
            </div>
          </SectionCard>

          {/* Biometric Panel */}
          <SectionCard
            title="Biometric Status"
            icon={ScanFace}
            iconColor="from-rose-500 to-pink-600"
            flash={flashSections.biometric}
          >
            <div className="flex flex-col items-center py-4">
              <div className={`
                w-16 h-16 rounded-2xl flex items-center justify-center mb-3
                ${biometric.enabled
                  ? 'bg-emerald-500/20 shadow-lg shadow-emerald-500/10'
                  : 'bg-white/5'
                }
              `}>
                {biometric.enabled ? (
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                ) : (
                  <ScanFace className="w-8 h-8 text-white/20" />
                )}
              </div>
              <p className={`text-sm font-bold ${biometric.enabled ? 'text-emerald-400' : 'text-white/40'}`}>
                {biometric.enabled ? 'Verified' : 'Not Registered'}
              </p>
              {biometric.has_embedding && (
                <p className="text-[10px] text-white/30 mt-1">
                  {biometric.embedding_model} | {biometric.verification_confidence ? `${Math.round(biometric.verification_confidence * 100)}%` : '—'} confidence
                </p>
              )}
            </div>

            <div className="space-y-1 pt-3 border-t border-white/5">
              <MetricItem
                label="Status"
                value={biometric.enabled ? 'Active' : 'Inactive'}
                icon={Eye}
                valueColor={biometric.enabled ? 'text-emerald-400' : 'text-red-400'}
              />
              <MetricItem
                label="Last Verified"
                value={biometric.last_verified ? new Date(biometric.last_verified).toLocaleString() : null}
                icon={Clock}
              />
              <MetricItem
                label="Model"
                value={biometric.embedding_model}
                icon={ScanFace}
              />
            </div>
          </SectionCard>
        </div>

        {/* Real-time Activity Feed */}
        {updateCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-[#0d1117] to-[#161b22] border border-white/10"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-sm font-bold text-white">Real-Time Activity</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold ml-auto">
                {updateCount} live updates
              </span>
            </div>
            <p className="text-xs text-white/40">
              Dashboard is receiving live updates via WebSocket. Any changes to user data will automatically reflect here without page reload.
            </p>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
