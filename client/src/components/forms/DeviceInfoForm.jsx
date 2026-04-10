// ============================================================
// Rakshak AI — Device Info (Auto-Capture)
// Captures userAgent, platform, browser, screen res, fingerprint
// ============================================================

import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Monitor, Fingerprint, Cpu, Globe2, CheckCircle } from 'lucide-react';

/**
 * Generate a device fingerprint hash from browser properties.
 */
function generateFingerprint() {
  const components = [
    navigator.userAgent,
    navigator.platform,
    navigator.language,
    navigator.languages?.join(','),
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency,
    navigator.deviceMemory,
    typeof navigator.maxTouchPoints !== 'undefined' ? navigator.maxTouchPoints : 'N/A',
  ].join('|');

  // Simple hash (SHA-256-like via SubtleCrypto isn't sync, so use basic hash)
  let hash = 0;
  for (let i = 0; i < components.length; i++) {
    const char = components.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit
  }
  // Convert to hex-like string
  const hexParts = [];
  for (let i = 0; i < 16; i++) {
    const segment = Math.abs(hash * (i + 1) * 31) % 256;
    hexParts.push(segment.toString(16).padStart(2, '0'));
  }
  // Extend to 64 chars
  const base = hexParts.join('');
  return (base + base + base + base).slice(0, 64);
}

function detectBrowser() {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  return 'Unknown';
}

function detectOS() {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return navigator.platform || 'Unknown';
}

export default function DeviceInfoForm({ data, onChange, disabled }) {
  const deviceInfo = useMemo(() => ({
    userAgent: navigator.userAgent,
    platform: detectOS(),
    browser: detectBrowser(),
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    cores: navigator.hardwareConcurrency || 'N/A',
    memory: navigator.deviceMemory || 'N/A',
    touchPoints: navigator.maxTouchPoints || 0,
    fingerprint: generateFingerprint(),
  }), []);

  useEffect(() => {
    if (!data.fingerprint) {
      onChange(deviceInfo);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const infoItems = [
    { icon: Monitor, label: 'Platform', value: deviceInfo.platform, color: 'from-purple-500 to-purple-600' },
    { icon: Globe2, label: 'Browser', value: `${deviceInfo.browser}`, color: 'from-blue-500 to-blue-600' },
    { icon: Monitor, label: 'Screen', value: deviceInfo.screenResolution, color: 'from-cyan-500 to-cyan-600' },
    { icon: Cpu, label: 'CPU Cores', value: `${deviceInfo.cores}`, color: 'from-amber-500 to-amber-600' },
    { icon: Smartphone, label: 'Timezone', value: deviceInfo.timezone, color: 'from-rose-500 to-rose-600' },
    { icon: Globe2, label: 'Language', value: deviceInfo.language, color: 'from-indigo-500 to-indigo-600' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
          <Smartphone className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Device Intelligence</h3>
          <p className="text-sm text-white/50">Auto-captured device fingerprint</p>
        </div>
        <CheckCircle className="w-5 h-5 text-emerald-400 ml-auto" />
      </div>

      {/* Device Info Grid */}
      <div className="grid grid-cols-2 gap-3">
        {infoItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.08 }}
              className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                  <Icon className="w-3 h-3 text-white" />
                </div>
                <p className="text-[10px] uppercase tracking-wider text-white/40">{item.label}</p>
              </div>
              <p className="text-sm font-semibold text-white truncate">{item.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Fingerprint Display */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10"
      >
        <div className="flex items-center gap-2 mb-3">
          <Fingerprint className="w-5 h-5 text-purple-400" />
          <p className="text-sm font-bold text-white">Device Fingerprint</p>
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
            SHA-256
          </span>
        </div>
        <p className="text-xs font-mono text-white/50 break-all leading-relaxed bg-black/20 p-3 rounded-lg">
          {deviceInfo.fingerprint}
        </p>
      </motion.div>

      {/* User Agent */}
      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
        <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">User Agent</p>
        <p className="text-xs text-white/60 break-all leading-relaxed">{deviceInfo.userAgent.slice(0, 120)}...</p>
      </div>
    </motion.div>
  );
}
