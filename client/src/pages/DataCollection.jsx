// ============================================================
// Rakshak AI — Data Collection Page
// Card-based layout matching existing cream/primary UI.
// Each section is an independent card. Biometric toggle
// triggers face capture inline.
// ============================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, CreditCard, MapPin, Smartphone, Activity, ScanFace,
  Send, Shield, Loader, CheckCircle, Wifi, WifiOff,
  Building2, Wallet, Phone, Mail, RefreshCw,
  Fingerprint, Monitor, Globe, Zap, Clock, Camera, X,
  AlertTriangle, Eye, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout';

// ─── Card wrapper matching existing UI ──────────────────────
function SectionCard({ title, subtitle, icon: Icon, children, onSave, saving, saved, collapsible = false, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden"
    >
      {/* Header */}
      <div
        className={`flex items-center gap-3 px-6 py-4 border-b border-cream-dark/20 ${collapsible ? 'cursor-pointer hover:bg-cream-light/50' : ''}`}
        onClick={collapsible ? () => setOpen(!open) : undefined}
      >
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-4.5 h-4.5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-dark uppercase tracking-wider">{title}</h3>
          {subtitle && <p className="text-xs text-dark/40 mt-0.5">{subtitle}</p>}
        </div>
        {saved && (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-600 text-[10px] font-bold">
            <CheckCircle className="w-3 h-3" /> Synced
          </span>
        )}
        {onSave && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSave(); }}
            disabled={saving}
            className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
          >
            {saving ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {saving ? 'Saving...' : 'Save'}
          </button>
        )}
        {collapsible && (
          open ? <ChevronUp className="w-4 h-4 text-dark/30" /> : <ChevronDown className="w-4 h-4 text-dark/30" />
        )}
      </div>

      {/* Body */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={collapsible ? { height: 0, opacity: 0 } : false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Inline text field ──────────────────────────────────────
function Field({ label, icon: Icon, value, onChange, type = 'text', placeholder, required, disabled, error, ...props }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-dark/60 mb-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`input-field ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ─── Card type selector ─────────────────────────────────────
const CARD_TYPES = ['VISA', 'MASTERCARD', 'AMEX', 'RUPAY', 'DISCOVER'];
const BANKS = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank', 'Punjab National Bank', 'IndusInd Bank', 'Yes Bank', 'Other'];

// ─── Device fingerprint generator ───────────────────────────
function generateFingerprint() {
  const components = [navigator.userAgent, navigator.platform, navigator.language, screen.width + 'x' + screen.height, screen.colorDepth, new Date().getTimezoneOffset(), navigator.hardwareConcurrency].join('|');
  let hash = 0;
  for (let i = 0; i < components.length; i++) { hash = ((hash << 5) - hash) + components.charCodeAt(i); hash = hash & hash; }
  const hexParts = [];
  for (let i = 0; i < 16; i++) { hexParts.push((Math.abs(hash * (i + 1) * 31) % 256).toString(16).padStart(2, '0')); }
  return (hexParts.join('') + hexParts.join('') + hexParts.join('') + hexParts.join('')).slice(0, 64);
}

function detectBrowser() {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg/')) return 'Edge';
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

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function DataCollection() {
  const { user, refreshUser } = useAuth();
  const { connected } = useSocket();

  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});

  // ── Form states ─────────────────────────────────────────────
  const [basic, setBasic] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  const [financial, setFinancial] = useState({
    card_last4: user?.financial?.card_last4 || '',
    card_type: user?.financial?.card_type || '',
    bank_name: user?.financial?.bank_name || '',
    avg_balance: user?.financial?.avg_balance || '',
  });
  const [location, setLocation] = useState({
    lat: user?.location?.home_location?.lat || '',
    lng: user?.location?.home_location?.lng || '',
    city: user?.location?.home_location?.city || '',
    country: user?.location?.home_location?.country || 'India',
    setAsHome: true,
  });
  const [gpsLoading, setGpsLoading] = useState(false);

  // Auto-capture device
  const [device] = useState(() => ({
    userAgent: navigator.userAgent,
    platform: detectOS(),
    browser: detectBrowser(),
    screenResolution: `${screen.width}x${screen.height}`,
    fingerprint: generateFingerprint(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    cores: navigator.hardwareConcurrency || 'N/A',
  }));

  // Behavior tracking
  const [typingSpeed, setTypingSpeed] = useState(0);
  const [sessionStart] = useState(Date.now());
  const [sessionDuration, setSessionDuration] = useState(0);
  const keystrokeTimes = useRef([]);

  // Biometric
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [faceData, setFaceData] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceLoading, setFaceLoading] = useState(false);
  const [faceError, setFaceError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // ── Session Duration Timer ──────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionDuration(Math.floor((Date.now() - sessionStart) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStart]);

  // ── GPS auto-fetch ──────────────────────────────────────────
  const fetchGPS = useCallback(async () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let city = '', country = 'India';
        try {
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const geo = await res.json();
          city = geo.city || geo.locality || geo.principalSubdivision || '';
          country = geo.countryName || 'India';
        } catch { /* fallback */ }
        setLocation(prev => ({ ...prev, lat: latitude, lng: longitude, city, country }));
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  useEffect(() => { if (!location.lat) fetchGPS(); }, []); // eslint-disable-line

  // ── Typing speed tracker ────────────────────────────────────
  const handleTypingTrack = useCallback(() => {
    const now = Date.now();
    keystrokeTimes.current = [...keystrokeTimes.current.slice(-19), now];
    if (keystrokeTimes.current.length >= 3) {
      const intervals = [];
      for (let i = 1; i < keystrokeTimes.current.length; i++) {
        intervals.push(keystrokeTimes.current[i] - keystrokeTimes.current[i - 1]);
      }
      const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      setTypingSpeed(Math.round((1000 / avgMs) * 10) / 10);
    }
  }, []);

  // ── Save helper ─────────────────────────────────────────────
  const saveSection = useCallback(async (section) => {
    if (!user) return;
    setSaving(prev => ({ ...prev, [section]: true }));
    try {
      let endpoint, payload;
      switch (section) {
        case 'basic':
          endpoint = '/user/update-profile';
          payload = { section: 'basic', data: basic };
          break;
        case 'financial':
          endpoint = '/user/update-profile';
          payload = { section: 'financial', data: financial };
          break;
        case 'location':
          endpoint = '/user/update-profile';
          payload = { section: 'location', data: location };
          break;
        case 'device':
          endpoint = '/user/update-profile';
          payload = { section: 'device', data: device };
          break;
        case 'behavior':
          endpoint = '/user/update-behavior';
          payload = { typing_speed_avg: typingSpeed, session_duration_avg: sessionDuration, active_hours: { start: new Date().getHours(), end: Math.min(23, new Date().getHours() + 2) } };
          break;
        case 'biometric':
          if (!faceData?.face_embedding?.length) { toast.error('Please capture your face first'); setSaving(prev => ({ ...prev, [section]: false })); return; }
          endpoint = '/user/biometric-register';
          payload = faceData;
          break;
        default: return;
      }
      const res = await api.post(endpoint, payload);
      if (res.data.success) {
        setSaved(prev => ({ ...prev, [section]: true }));
        toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} saved successfully`);
        refreshUser();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to save ${section}`);
    } finally {
      setSaving(prev => ({ ...prev, [section]: false }));
    }
  }, [user, basic, financial, location, device, typingSpeed, sessionDuration, faceData, refreshUser]);

  // ── Biometric toggle handler ────────────────────────────────
  const handleBiometricToggle = useCallback(async (enabled) => {
    setBiometricEnabled(enabled);
    if (enabled && !faceData) {
      // Start camera immediately
      try {
        setFaceError(null);
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' }, audio: false });
        streamRef.current = stream;
        setCameraActive(true);
        // Wait for video ref to be available
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        }, 100);
      } catch (err) {
        setFaceError('Camera access denied: ' + err.message);
        setBiometricEnabled(false);
      }
    } else if (!enabled) {
      stopCamera();
      setFaceData(null);
    }
  }, [faceData]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const captureFace = useCallback(async () => {
    if (!videoRef.current) return;
    setFaceLoading(true);
    setFaceError(null);
    try {
      const faceapi = await import('face-api.js');
      const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setFaceError('No face detected. Please face the camera directly.');
        setFaceLoading(false);
        return;
      }

      const embedding = Array.from(detection.descriptor);
      setFaceData({
        face_embedding: embedding,
        embedding_model: 'face-api.js',
        confidence: Math.round(detection.detection.score * 100) / 100,
        dimensions: embedding.length,
      });
      stopCamera();
      toast.success('Face captured successfully!');
    } catch (err) {
      setFaceError('Detection failed: ' + err.message);
    } finally {
      setFaceLoading(false);
    }
  }, [stopCamera]);

  // Cleanup camera on unmount
  useEffect(() => () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); }, []);

  const formatDuration = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        {/* Page Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-dark/50 text-xs font-semibold uppercase tracking-widest mb-1">Profile Setup</p>
            <h1 className="text-4xl font-black text-dark">Data Collection</h1>
          </div>
          <div className="flex items-center gap-3">
            {connected ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-600 text-xs font-bold">
                <Wifi className="w-3.5 h-3.5" /> Live Sync
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-bold">
                <WifiOff className="w-3.5 h-3.5" /> Offline
              </span>
            )}
          </div>
        </div>

        <div className="space-y-6">

          {/* ═══ BASIC INFO ═══ */}
          <SectionCard title="Basic Information" subtitle="Personal identity details" icon={User} onSave={() => saveSection('basic')} saving={saving.basic} saved={saved.basic}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Full Name" icon={User} value={basic.name} onChange={(v) => setBasic(p => ({ ...p, name: v }))} placeholder="Arjun Sharma" required />
              <Field label="Email Address" icon={Mail} value={basic.email} onChange={(v) => setBasic(p => ({ ...p, email: v }))} placeholder="arjun@rakshak.ai" type="email" required />
              <Field label="Phone Number" icon={Phone} value={basic.phone} onChange={(v) => setBasic(p => ({ ...p, phone: v }))} placeholder="+91 98765 43210" type="tel" />
            </div>
          </SectionCard>

          {/* ═══ FINANCIAL DETAILS ═══ */}
          <SectionCard title="Financial Details" subtitle="Payment & banking information" icon={CreditCard} onSave={() => saveSection('financial')} saving={saving.financial} saved={saved.financial}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-dark/60 mb-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> Card Last 4 Digits <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={financial.card_last4}
                    onChange={(e) => setFinancial(p => ({ ...p, card_last4: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    placeholder="4321"
                    className="input-field text-center font-mono font-bold tracking-[0.3em]"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-dark/60 mb-1.5">
                    <Building2 className="w-3.5 h-3.5" /> Bank Name <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={financial.bank_name}
                    onChange={(e) => setFinancial(p => ({ ...p, bank_name: e.target.value }))}
                    className="input-field appearance-none cursor-pointer"
                  >
                    <option value="">Select bank...</option>
                    {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              {/* Card type pills */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-dark/60 mb-2">
                  <CreditCard className="w-3.5 h-3.5" /> Card Type <span className="text-red-400">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {CARD_TYPES.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFinancial(p => ({ ...p, card_type: t }))}
                      className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                        financial.card_type === t
                          ? 'bg-primary text-white border-primary shadow-primary'
                          : 'bg-cream-light text-dark/50 border-cream-dark/30 hover:border-primary/40 hover:text-dark'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              {/* Balance */}
              <div className="max-w-xs">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-dark/60 mb-1.5">
                  <Wallet className="w-3.5 h-3.5" /> Average Balance (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark/40 font-bold">₹</span>
                  <input
                    type="number"
                    value={financial.avg_balance}
                    onChange={(e) => setFinancial(p => ({ ...p, avg_balance: e.target.value === '' ? '' : Math.max(0, Number(e.target.value)) }))}
                    placeholder="50000"
                    min={0}
                    className="input-field pl-10 font-mono tabular-nums"
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ═══ LOCATION ═══ */}
          <SectionCard title="Location Intelligence" subtitle="GPS auto-capture with manual override" icon={MapPin} onSave={() => saveSection('location')} saving={saving.location} saved={saved.location}>
            <div className="space-y-4">
              {/* GPS status bar */}
              <div className={`flex items-center gap-3 p-3 rounded-lg border ${location.lat ? 'bg-green-50 border-green-200' : 'bg-cream-light border-cream-dark/30'}`}>
                <div className={`w-2.5 h-2.5 rounded-full ${location.lat ? 'bg-green-500 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
                <span className="text-sm font-medium text-dark/70">{gpsLoading ? 'Acquiring GPS...' : location.lat ? 'Location Locked' : 'Awaiting GPS'}</span>
                <button type="button" onClick={fetchGPS} disabled={gpsLoading} className="ml-auto flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark transition-colors">
                  <RefreshCw className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} /> Refresh GPS
                </button>
              </div>

              {/* Coords grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Field label="Latitude" icon={MapPin} value={location.lat} onChange={(v) => setLocation(p => ({ ...p, lat: v === '' ? '' : Number(v) }))} type="number" placeholder="19.0760" />
                <Field label="Longitude" icon={MapPin} value={location.lng} onChange={(v) => setLocation(p => ({ ...p, lng: v === '' ? '' : Number(v) }))} type="number" placeholder="72.8777" />
                <Field label="City" icon={Globe} value={location.city} onChange={(v) => setLocation(p => ({ ...p, city: v }))} placeholder="Mumbai" />
                <Field label="Country" icon={Globe} value={location.country} onChange={(v) => setLocation(p => ({ ...p, country: v }))} placeholder="India" />
              </div>

              <label className="flex items-center gap-3 p-3 rounded-lg bg-cream-light border border-cream-dark/20 cursor-pointer hover:border-primary/30 transition-all">
                <input type="checkbox" checked={location.setAsHome} onChange={(e) => setLocation(p => ({ ...p, setAsHome: e.target.checked }))} className="w-4 h-4 rounded accent-primary" />
                <div>
                  <p className="text-sm font-medium text-dark">Set as home location</p>
                  <p className="text-xs text-dark/40">Used for distance-based fraud detection</p>
                </div>
              </label>
            </div>
          </SectionCard>

          {/* ═══ DEVICE INFO (AUTO) ═══ */}
          <SectionCard title="Device Intelligence" subtitle="Auto-captured device information" icon={Smartphone} onSave={() => saveSection('device')} saving={saving.device} saved={saved.device}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: Monitor, label: 'Platform', value: device.platform },
                  { icon: Globe, label: 'Browser', value: device.browser },
                  { icon: Monitor, label: 'Screen', value: device.screenResolution },
                  { icon: Clock, label: 'Timezone', value: device.timezone },
                ].map(item => (
                  <div key={item.label} className="card-cream p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <item.icon className="w-3 h-3 text-primary/60" />
                      <span className="text-[10px] uppercase tracking-wider text-dark/40 font-bold">{item.label}</span>
                    </div>
                    <p className="text-sm font-semibold text-dark truncate">{item.value}</p>
                  </div>
                ))}
              </div>
              {/* Fingerprint */}
              <div className="p-4 card-cream">
                <div className="flex items-center gap-2 mb-2">
                  <Fingerprint className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-dark">Device Fingerprint</span>
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200 font-bold">SHA-256</span>
                </div>
                <p className="text-[11px] font-mono text-dark/40 break-all leading-relaxed bg-white p-2 rounded-lg border border-cream-dark/20">{device.fingerprint}</p>
              </div>
            </div>
          </SectionCard>

          {/* ═══ BEHAVIOR (AUTO TRACKING) ═══ */}
          <SectionCard title="Behavioral Analytics" subtitle="Real-time keystroke & session tracking" icon={Activity} onSave={() => saveSection('behavior')} saving={saving.behavior} saved={saved.behavior}>
            <div className="space-y-4">
              {/* Live metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="card-cream p-4 text-center">
                  <Zap className="w-5 h-5 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-black text-dark tabular-nums">{typingSpeed}</p>
                  <p className="text-[10px] uppercase tracking-wider text-dark/40 font-bold mt-1">Char/Sec</p>
                </div>
                <div className="card-cream p-4 text-center">
                  <Clock className="w-5 h-5 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-black text-dark tabular-nums">{formatDuration(sessionDuration)}</p>
                  <p className="text-[10px] uppercase tracking-wider text-dark/40 font-bold mt-1">Session</p>
                </div>
                <div className="card-cream p-4 text-center">
                  <Activity className="w-5 h-5 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-black text-dark tabular-nums">
                    {new Date().getHours().toString().padStart(2, '0')}:{new Date().getMinutes().toString().padStart(2, '0')}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-dark/40 font-bold mt-1">Current Time</p>
                </div>
              </div>
              {/* Typing speed test */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-dark/60 mb-1.5">
                  <Zap className="w-3.5 h-3.5" /> Typing Speed Calibration
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">LIVE</span>
                </label>
                <textarea
                  rows={2}
                  onKeyDown={handleTypingTrack}
                  placeholder="Start typing here to calibrate... The quick brown fox jumps over the lazy dog."
                  className="input-field resize-none"
                />
              </div>
            </div>
          </SectionCard>

          {/* ═══ BIOMETRIC (TOGGLE-BASED) ═══ */}
          <SectionCard title="Biometric Verification" subtitle="Face capture & embedding registration" icon={ScanFace}
            onSave={biometricEnabled && faceData ? () => saveSection('biometric') : undefined}
            saving={saving.biometric} saved={saved.biometric}
          >
            <div className="space-y-4">
              {/* Privacy notice */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <Shield className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  <strong>Privacy-First:</strong> Your face image is processed locally and discarded immediately. Only a 128-dim numeric embedding is stored — it cannot be reversed into an image.
                </p>
              </div>

              {/* Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-cream-light border border-cream-dark/20">
                <div className="flex items-center gap-3">
                  <ScanFace className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-bold text-dark">Enable Biometric Authentication</p>
                    <p className="text-xs text-dark/40">Toggle to start face capture</p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={biometricEnabled}
                  onClick={() => handleBiometricToggle(!biometricEnabled)}
                  className={`relative w-12 h-7 rounded-full transition-all duration-300 ${biometricEnabled ? 'bg-primary' : 'bg-cream-dark/40'}`}
                >
                  <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${biometricEnabled ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>

              {/* Camera viewport (shows when toggle is on and face not captured) */}
              <AnimatePresence>
                {cameraActive && !faceData && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="relative rounded-xl overflow-hidden bg-dark border border-cream-dark/20" style={{ aspectRatio: '16/9', maxHeight: 320 }}>
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

                      {/* Overlay corners */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                        <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                        <div className="absolute bottom-4 left-4 w-10 h-10 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                        <div className="absolute bottom-4 right-4 w-10 h-10 border-b-2 border-r-2 border-primary rounded-br-lg" />
                      </div>

                      {/* Live indicator */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-dark/80 backdrop-blur">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Live</span>
                      </div>

                      {/* Capture button */}
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                        <button type="button" onClick={() => { stopCamera(); setBiometricEnabled(false); }} className="p-2.5 rounded-full bg-white/20 backdrop-blur text-white hover:bg-white/30 transition-all">
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={captureFace}
                          disabled={faceLoading}
                          className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2 rounded-full"
                        >
                          {faceLoading ? <><Loader className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Camera className="w-4 h-4" /> Capture Face</>}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              {faceError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <p className="text-xs text-red-600">{faceError}</p>
                </div>
              )}

              {/* Success state */}
              {faceData && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-green-700">Face Registered Successfully</p>
                      <p className="text-xs text-green-600/70">{faceData.dimensions}-dim embedding | {Math.round((faceData.confidence || 0) * 100)}% confidence</p>
                    </div>
                    <button type="button" onClick={() => { setFaceData(null); handleBiometricToggle(true); }} className="ml-auto text-xs text-primary font-semibold hover:text-primary-dark">
                      Re-capture
                    </button>
                  </div>
                  <p className="text-[10px] font-mono text-dark/30 break-all bg-white p-2 rounded border border-green-100">
                    [{faceData.face_embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}, ...]
                  </p>
                </motion.div>
              )}
            </div>
          </SectionCard>

        </div>
      </div>
    </DashboardLayout>
  );
}
