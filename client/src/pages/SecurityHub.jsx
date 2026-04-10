// ============================================================
// Rakshak AI - Security Hub Page
// Threat intel center with live map, node status, live feed
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, Activity, Server, Lock, Zap, Globe, Brain } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useWebSocket } from '../hooks/useWebSocket';
import api from '../services/api';
import toast from 'react-hot-toast';

// Animated count-up
function CountUp({ target, suffix = '', color = 'text-dark' }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (!target) return;
    let start = null;
    const duration = 1500;
    const animate = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * target));
      if (p < 1) ref.current = requestAnimationFrame(animate);
    };
    ref.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(ref.current);
  }, [target]);
  return <span className={`tabular-nums ${color}`}>{val}{suffix}</span>;
}

// SVG World Threat Map (simplified, self-contained)
function WorldThreatMap({ blockedLocations = [], homeLocation }) {
  const [pulsePhase, setPulsePhase] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setPulsePhase(p => p + 1), 50);
    return () => clearInterval(interval);
  }, []);

  // Simplified continent paths (as rough polygons on 100x60 viewBox)
  const continents = [
    // North America
    'M 5,12 L 22,8 L 28,16 L 26,26 L 18,30 L 10,28 L 5,20 Z',
    // South America
    'M 18,32 L 26,30 L 28,42 L 24,52 L 16,54 L 14,44 L 16,34 Z',
    // Europe
    'M 44,8 L 56,6 L 58,14 L 54,18 L 46,18 L 42,14 Z',
    // Africa
    'M 46,20 L 56,18 L 60,32 L 56,46 L 48,48 L 42,38 L 44,24 Z',
    // Asia
    'M 58,6 L 88,4 L 92,18 L 84,28 L 66,30 L 56,22 L 58,10 Z',
    // Australia
    'M 78,40 L 90,38 L 92,48 L 86,52 L 76,50 L 74,44 Z',
  ];

  return (
    <div className="relative">
      <svg
        viewBox="0 0 100 60"
        className="w-full"
        style={{ background: 'linear-gradient(180deg, #1a0a0c 0%, #2a1a1c 100%)', borderRadius: '16px', minHeight: 220 }}
      >
        {/* Grid lines */}
        {[20, 40, 60, 80].map(x => (
          <line key={x} x1={x} y1="0" x2={x} y2="60" stroke="rgba(239,223,187,0.05)" strokeWidth="0.3" />
        ))}
        {[20, 40].map(y => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(239,223,187,0.05)" strokeWidth="0.3" />
        ))}

        {/* Continent shapes */}
        {continents.map((d, i) => (
          <path key={i} d={d} fill="rgba(114,47,55,0.25)" stroke="rgba(114,47,55,0.4)" strokeWidth="0.3" />
        ))}

        {/* Threat connection lines (animated) */}
        {blockedLocations.map((loc, i) => (
          homeLocation && (
            <motion.line
              key={i}
              x1={loc.x}
              y1={loc.y}
              x2={homeLocation.x}
              y2={homeLocation.y}
              stroke="#ef4444"
              strokeWidth="0.5"
              strokeDasharray="4 2"
              initial={{ pathLength: 0, opacity: 0.6 }}
              animate={{ pathLength: 1, opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2 + i * 0.5, repeat: Infinity, ease: 'linear' }}
            />
          )
        ))}

        {/* Threat origin dots — pulsing red */}
        {blockedLocations.map((loc, i) => (
          <g key={i}>
            <motion.circle
              cx={loc.x} cy={loc.y} r="3"
              fill="rgba(239,68,68,0.15)"
              animate={{ r: [2, 5, 2] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
            />
            <circle cx={loc.x} cy={loc.y} r="1.5" fill="#ef4444" />
            <text x={loc.x + 2} y={loc.y - 2} fontSize="2.5" fill="rgba(239,223,187,0.7)" fontFamily="monospace">
              {loc.city}
            </text>
          </g>
        ))}

        {/* Home location (Mumbai) — green */}
        {homeLocation && (
          <g>
            <motion.circle
              cx={homeLocation.x} cy={homeLocation.y} r="4"
              fill="rgba(34,197,94,0.15)"
              animate={{ r: [3, 6, 3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <circle cx={homeLocation.x} cy={homeLocation.y} r="2" fill="#22c55e" />
            <text x={homeLocation.x + 3} y={homeLocation.y - 2} fontSize="2.5" fill="rgba(239,223,187,0.8)" fontFamily="monospace">
              Mumbai ✓
            </text>
          </g>
        )}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-3 px-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-xs text-dark/60 font-semibold">Threat Origin</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-xs text-dark/60 font-semibold">Protected Location</span>
        </div>
        <span className="text-xs text-dark/40 ml-auto">Rakshak AI monitors 47 countries in real-time</span>
      </div>
    </div>
  );
}

// Threat ticker item
function ThreatTickerItem({ event }) {
  const colors = {
    BLOCKED: { dot: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50' },
    REVIEW: { dot: 'bg-orange-400', text: 'text-orange-600', bg: 'bg-orange-50' },
    APPROVED: { dot: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50' },
  };
  const c = colors[event.eventStatus] || colors.BLOCKED;
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${c.bg} border border-current border-opacity-20 flex-shrink-0 mr-4`}>
      <div className={`w-2 h-2 rounded-full ${c.dot} flex-shrink-0`} />
      <span className={`text-xs font-bold uppercase tracking-wider ${c.text}`}>{event.eventStatus}</span>
      <span className="text-xs text-dark/60">·</span>
      <span className="text-xs font-mono text-dark/60">{event.reference}</span>
      <span className="text-xs text-dark/60">·</span>
      <span className="text-xs text-dark/70">₹{(event.amount / 1000).toFixed(0)}K → {event.recipient}</span>
      <span className="text-xs text-dark/60">·</span>
      <span className="text-xs text-dark/50">Score {event.score}</span>
      <span className="text-xs text-dark/60">·</span>
      <span className="text-xs text-dark/50">{event.location}</span>
    </div>
  );
}

const AI_NODES = [
  { name: 'Conservative', weight: 'Amount-Heavy', id: 1 },
  { name: 'Device Sentinel', weight: 'Device-Focused', id: 2 },
  { name: 'Geo-Intelligence', weight: 'Location-Focused', id: 3 },
  { name: 'Behavioral AI', weight: 'Pattern Analysis', id: 4 },
  { name: 'Balanced Core', weight: 'Equal Distribution', id: 5 },
];

export default function SecurityHub() {
  const [metrics, setMetrics] = useState(null);
  const [liveEvents, setLiveEvents] = useState([
    { eventStatus: 'BLOCKED', reference: 'TXN-88219', amount: 215000, recipient: 'fraud001@darkweb', score: 94, location: 'Amsterdam, NL', factor: 'VPN + Blacklisted IP' },
    { eventStatus: 'REVIEW',  reference: 'TXN-72341', amount: 75000,  recipient: 'new.vendor@ybl',   score: 58, location: 'Jaipur, IN',    factor: 'New Device' },
    { eventStatus: 'APPROVED',reference: 'TXN-55109', amount: 5000,   recipient: 'rajesh.kumar@okaxis', score: 12, location: 'Mumbai, IN', factor: 'Trusted' },
  ]);
  const tickerRef = useRef(null);
  const [tickerPos, setTickerPos] = useState(0);

  useEffect(() => {
    api.get('/security/metrics').then(res => {
      if (res.data.success) setMetrics(res.data.data);
    }).catch(() => {});
  }, []);

  // Smooth auto-scrolling ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerPos(p => p - 1);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // Reset ticker when it goes too far
  useEffect(() => {
    if (tickerRef.current) {
      const width = tickerRef.current.scrollWidth / 2;
      if (Math.abs(tickerPos) >= width) setTickerPos(0);
    }
  }, [tickerPos]);

  // WebSocket live threats
  useWebSocket((event) => {
    if (event.type === 'THREAT_EVENT') {
      setLiveEvents(prev => [event, ...prev].slice(0, 20));
      if (event.eventStatus === 'BLOCKED') {
        toast.error(
          `🚫 BLOCKED: ₹${(event.amount / 1000).toFixed(0)}K → ${event.recipient} | Score: ${event.score}`,
          { duration: 5000 }
        );
      }
    }
  });

  const blockedLocations = metrics?.blockedLocations || [
    { city: 'Amsterdam', x: 51, y: 38 },
    { city: 'Lagos', x: 49, y: 53 },
    { city: 'Beijing', x: 78, y: 37 },
  ];
  const homeLocation = metrics?.homeLocation || { city: 'Mumbai', x: 70, y: 47 };

  const metricCards = [
    {
      label: 'Threats Blocked',
      value: metrics?.threatsBlockedToday || 0,
      suffix: '',
      color: 'text-red-600',
      icon: Shield,
      bg: 'bg-red-50',
      iconColor: 'text-red-500',
    },
    {
      label: 'AI Nodes Online',
      value: 5,
      display: <span className="flex gap-1">{Array(5).fill(0).map((_, i) => <span key={i} className="w-3 h-3 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />)}</span>,
      suffix: '/5',
      color: 'text-green-600',
      icon: Brain,
      bg: 'bg-green-50',
      iconColor: 'text-green-500',
    },
    {
      label: 'System Uptime',
      value: 99,
      suffix: '.97%',
      sublabel: '847 consecutive days',
      color: 'text-blue-600',
      icon: Activity,
      bg: 'bg-blue-50',
      iconColor: 'text-blue-500',
    },
    {
      label: 'Encryption',
      valueText: 'AES-256',
      sublabel: 'SHA-3 Keccak-256',
      color: 'text-primary',
      icon: Lock,
      bg: 'bg-primary/5',
      iconColor: 'text-primary',
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <p className="text-dark/50 text-xs font-semibold uppercase tracking-widest mb-1">Intelligence Center</p>
          <h1 className="text-4xl font-black text-dark">Security Hub</h1>
        </div>

        {/* ── LIVE THREAT TICKER ── */}
        <div className="card overflow-hidden mb-6">
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-cream-dark/20 bg-cream-light">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-dark/60">Live Threat Feed</span>
            <span className="ml-auto text-xs text-dark/40">Auto-updating via WebSocket</span>
          </div>
          <div className="overflow-hidden py-2.5 px-2">
            <div
              ref={tickerRef}
              className="flex whitespace-nowrap"
              style={{ transform: `translateX(${tickerPos}px)`, transition: 'none' }}
            >
              {/* Duplicate for seamless loop */}
              {[...liveEvents, ...liveEvents].map((event, i) => (
                <ThreatTickerItem key={i} event={event} />
              ))}
            </div>
          </div>
        </div>

        {/* ── MAIN GRID: Map (2/3) + Metrics (1/3) ── */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* World Threat Map */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="col-span-2 card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-dark/50 mb-0.5">Global Threat Intelligence Map</p>
                <h3 className="text-lg font-black text-dark">Real-Time Threat Visualization</h3>
              </div>
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 rounded-full text-xs font-bold">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {blockedLocations.length} ACTIVE THREAT{blockedLocations.length !== 1 ? 'S' : ''}
              </div>
            </div>
            <WorldThreatMap blockedLocations={blockedLocations} homeLocation={homeLocation} />
          </motion.div>

          {/* Security Metrics */}
          <div className="space-y-4">
            {metricCards.map(({ label, value, display, suffix, sublabel, valueText, color, icon: Icon, bg, iconColor }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="card p-5 flex items-center gap-4"
              >
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div>
                  {display ? (
                    <div className="mb-0.5">{display}</div>
                  ) : valueText ? (
                    <p className={`text-xl font-black ${color}`}>{valueText}</p>
                  ) : (
                    <p className={`text-2xl font-black ${color}`}>
                      <CountUp target={value} suffix={suffix} color={color} />
                    </p>
                  )}
                  <p className="text-xs text-dark/50 font-semibold uppercase tracking-wider">{label}</p>
                  {sublabel && <p className="text-xs text-dark/30 mt-0.5">{sublabel}</p>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── BOTTOM GRID: AI Nodes + Federated Learning ── */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* AI Node Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-6"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-dark/50 mb-4">AI Consensus Node Status</p>
            <div className="space-y-3">
              {AI_NODES.map((node, i) => (
                <div key={node.id} className="flex items-center gap-4 p-3 bg-cream-light rounded-xl">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                    {node.id}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-dark">{node.name}</p>
                      <div className="flex items-center gap-1">
                        <motion.div
                          className="w-1.5 h-1.5 rounded-full bg-green-400"
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                        />
                        <span className="text-xs text-green-600 font-bold">ACTIVE</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-dark/40">Weight: {node.weight}</p>
                      {/* Tiny processing bar */}
                      <div className="flex-1 h-1 bg-cream-dark/20 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary rounded-full"
                          animate={{ width: ['20%', '80%', '45%', '90%', '35%'] }}
                          transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'linear' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Federated Learning Explanation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card p-6"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-dark/50 mb-4">Federated Learning Architecture</p>
            <p className="text-xs text-dark/50 mb-5 leading-relaxed">
              Your transaction patterns <strong className="text-dark">never leave your device</strong>. Rakshak AI trains on encrypted gradients only — ensuring complete data sovereignty.
            </p>

            {/* Flow diagram */}
            <div className="space-y-3">
              {[
                { label: 'Your Device', sub: 'Local model', color: 'bg-primary', arrow: '↓' },
                { label: 'Encrypted Gradient', sub: 'Zero-knowledge proof', color: 'bg-orange-400', arrow: '↓' },
                { label: 'Global Model', sub: 'Aggregated update', color: 'bg-green-500', arrow: '↓' },
                { label: 'Improved Local Model', sub: 'Privacy preserved', color: 'bg-primary/70', arrow: null },
              ].map(({ label, sub, color, arrow }) => (
                <div key={label}>
                  <div className={`${color} rounded-xl p-3 flex items-center gap-3`}>
                    <div className="w-2 h-2 rounded-full bg-white/80" />
                    <div>
                      <p className="text-white text-xs font-bold">{label}</p>
                      <p className="text-white/60 text-xs">{sub}</p>
                    </div>
                  </div>
                  {arrow && <div className="text-center text-dark/30 text-xs leading-none my-1">{arrow}</div>}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── TOP RISK FACTORS CHART ── */}
        {metrics?.topRiskFactors?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card p-6"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-dark/50 mb-4">Top Risk Factors Detected</p>
            <div className="space-y-3">
              {metrics.topRiskFactors.map(({ factor, count }, i) => {
                const maxCount = metrics.topRiskFactors[0]?.count || 1;
                const pct = (count / maxCount) * 100;
                return (
                  <div key={factor} className="flex items-center gap-4">
                    <span className="text-xs text-dark/40 w-4 text-right font-bold">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-dark">{factor}</p>
                        <span className="text-xs font-bold text-primary">{count}×</span>
                      </div>
                      <div className="h-2 bg-cream-dark/20 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
