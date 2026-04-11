// ============================================================
// Rakshak AI â€” Data Collection Page
// Professional fintech card-based layout with real-time sync.
// Each section is an independent card matching cream/primary UI.
// ============================================================

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, CreditCard, MapPin, Smartphone, Activity, ScanFace,
  Send, Shield, Loader, CheckCircle, Wifi, WifiOff,
  Building2, Wallet, Phone, Mail, RefreshCw,
  Fingerprint, Monitor, Globe, Zap, Clock, Camera, X,
  AlertTriangle, ChevronDown, ChevronUp, Lock,
  Layers, Database,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout';

// â”€â”€â”€ Card wrapper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SectionCard({ title, subtitle, icon: Icon, children, onSave, saving, saved, collapsible = false, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden"
    >
      <div
        className={`flex items-center gap-3 px-6 py-4 border-b border-cream-dark/20 ${collapsible ? 'cursor-pointer hover:bg-cream-light/50 select-none' : ''}`}
        onClick={collapsible ? () => setOpen(!open) : undefined}
      >
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-4.5 h-4.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-dark uppercase tracking-wider">{title}</h3>
          {subtitle && <p className="text-xs text-dark/40 mt-0.5">{subtitle}</p>}
        </div>
        {saved && (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-600 text-[10px] font-bold flex-shrink-0">
            <CheckCircle className="w-3 h-3" /> Synced
          </span>
        )}
        {onSave && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSave(); }}
            disabled={saving}
            className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 flex-shrink-0"
          >
            {saving ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {saving ? 'Saving...' : 'Save'}
          </button>
        )}
        {collapsible && (
          open ? <ChevronUp className="w-4 h-4 text-dark/30 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-dark/30 flex-shrink-0" />
        )}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={collapsible ? { height: 0, opacity: 0 } : false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// â”€â”€â”€ Field component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Field({ label, icon: Icon, value, onChange, type = 'text', placeholder, required, disabled, error, className = '', ...props }) {
  return (
    <div className={className}>
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

// â”€â”€â”€ Profile completeness ring â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CompletenessRing({ percent }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const color = percent >= 80 ? '#22c55e' : percent >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <svg viewBox="0 0 96 96" className="w-full h-full -rotate-90">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-cream-dark/20" />
        <motion.circle
          cx="48" cy="48" r={radius} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-black text-dark tabular-nums">{percent}%</span>
      </div>
    </div>
  );
}

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CARD_TYPES = ['VISA', 'MASTERCARD', 'AMEX', 'RUPAY', 'DISCOVER'];
const BANKS = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank', 'Punjab National Bank', 'IndusInd Bank', 'Yes Bank', 'Other'];

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

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MAIN COMPONENT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export default function DataCollection() {
  const { user, refreshUser, updateUser } = useAuth();
  const { connected, subscribe } = useSocket();

  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});

  // â”€â”€ Form states â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  const device = useMemo(() => ({
    userAgent: navigator.userAgent,
    platform: detectOS(),
    browser: detectBrowser(),
    screenResolution: `${screen.width}x${screen.height}`,
    fingerprint: generateFingerprint(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    cores: navigator.hardwareConcurrency || 'N/A',
  }), []);

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

  // Real-time update counter
  const [liveUpdates, setLiveUpdates] = useState(0);

  // â”€â”€ Profile completeness â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const completeness = useMemo(() => {
    let filled = 0, total = 11;
    if (basic.name) filled++;
    if (basic.email) filled++;
    if (basic.phone) filled++;
    if (financial.card_last4?.length === 4) filled++;
    if (financial.card_type) filled++;
    if (financial.bank_name) filled++;
    if (financial.avg_balance > 0) filled++;
    if (location.lat) filled++;
    if (saved.device || user?.devices?.trusted_devices?.length > 0) filled++;
    if (typingSpeed > 0 || user?.behavioral?.typing_speed_avg > 0) filled++;
    if (faceData || user?.biometric?.enabled) filled++;
    return Math.round((filled / total) * 100);
  }, [basic, financial, location, saved, typingSpeed, faceData, user]);

  // â”€â”€ Session Duration Timer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionDuration(Math.floor((Date.now() - sessionStart) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStart]);

  // â”€â”€ Socket.IO real-time listener â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const unsub = subscribe('user-data-updated', (payload) => {
      if (payload.userId === user?.user_id) {
        setLiveUpdates(prev => prev + 1);
      }
    });
    return unsub;
  }, [subscribe, user?.user_id]);

  // â”€â”€ GPS auto-fetch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Typing speed tracker â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Save helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
          payload = {
            typing_speed_avg: typingSpeed,
            session_duration_avg: sessionDuration,
            active_hours: { start: new Date().getHours(), end: Math.min(23, new Date().getHours() + 2) },
          };
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
        toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} saved & synced to dashboard`, {
          style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' },
        });
        // For biometric: immediately patch context so PaymentGate sees it
        if (section === 'biometric' && res.data.user?.biometric) {
          updateUser({ biometric: res.data.user.biometric });
        }
        refreshUser();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to save ${section}`);
    } finally {
      setSaving(prev => ({ ...prev, [section]: false }));
    }
  }, [user, basic, financial, location, device, typingSpeed, sessionDuration, faceData, refreshUser]);

  // â”€â”€ Biometric handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const handleBiometricToggle = useCallback(async (enabled) => {
    setBiometricEnabled(enabled);
    if (enabled && !faceData) {
      try {
        setFaceError(null);
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' }, audio: false });
        streamRef.current = stream;
        setCameraActive(true);
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
  }, [faceData, stopCamera]);

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

  useEffect(() => () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); }, []);

  const formatDuration = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const speedLabel = typingSpeed < 3 ? 'Slow' : typingSpeed < 6 ? 'Average' : typingSpeed < 9 ? 'Fast' : 'Very Fast';
  const speedColor = typingSpeed < 3 ? 'text-red-500' : typingSpeed < 6 ? 'text-amber-500' : typingSpeed < 9 ? 'text-green-500' : 'text-emerald-500';

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        {/* â•â•â• PAGE HEADER â•â•â• */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-dark/50 text-xs font-semibold uppercase tracking-widest mb-1">Profile Setup</p>
            <h1 className="text-4xl font-black text-dark">Data Collection</h1>
          </div>
          <div className="flex items-center gap-3">
            {liveUpdates > 0 && (
              <span className="text-xs text-dark/40 font-mono tabular-nums">{liveUpdates} live syncs</span>
            )}
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

        {/* â•â•â• PROFILE COMPLETENESS BANNER â•â•â• */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 mb-6"
        >
          <div className="flex items-center gap-6">
            <CompletenessRing percent={completeness} />
            <div className="flex-1">
              <h3 className="text-lg font-black text-dark mb-1">Profile Completeness</h3>
              <p className="text-sm text-dark/50 mb-3">
                {completeness < 50
                  ? 'Complete your profile to improve your trust score and unlock secure transactions.'
                  : completeness < 80
                  ? 'Good progress! A few more sections will maximize your trust score.'
                  : 'Excellent! Your profile is comprehensive. Rakshak AI can protect you fully.'}
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Identity', done: !!(basic.name && basic.email) },
                  { label: 'Financial', done: !!(financial.card_last4 && financial.bank_name) },
                  { label: 'Location', done: !!location.lat },
                  { label: 'Device', done: !!(saved.device || user?.devices?.trusted_devices?.length > 0) },
                  { label: 'Behavior', done: typingSpeed > 0 || !!user?.behavioral?.typing_speed_avg },
                  { label: 'Biometric', done: !!(faceData || user?.biometric?.enabled) },
                ].map(s => (
                  <span key={s.label} className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                    s.done
                      ? 'bg-green-50 text-green-600 border-green-200'
                      : 'bg-cream-light text-dark/30 border-cream-dark/20'
                  }`}>
                    {s.done && <CheckCircle className="w-3 h-3 inline mr-1 -mt-0.5" />}
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* â•â•â• TWO-COLUMN LAYOUT: IDENTITY + DEVICE â•â•â• */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          <SectionCard title="Identity" subtitle="Personal details" icon={User}
            onSave={() => saveSection('basic')} saving={saving.basic} saved={saved.basic}
          >
            <div className="space-y-4">
              <Field label="Full Name" icon={User} value={basic.name} onChange={(v) => setBasic(p => ({ ...p, name: v }))} placeholder="Arjun Sharma" required />
              <Field label="Email Address" icon={Mail} value={basic.email} onChange={(v) => setBasic(p => ({ ...p, email: v }))} placeholder="arjun@rakshak.ai" type="email" required />
              <Field label="Phone Number" icon={Phone} value={basic.phone} onChange={(v) => setBasic(p => ({ ...p, phone: v }))} placeholder="+91 98765 43210" type="tel" />
            </div>
          </SectionCard>

          <SectionCard title="Device Intelligence" subtitle="Auto-captured fingerprint" icon={Smartphone}
            onSave={() => saveSection('device')} saving={saving.device} saved={saved.device}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
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
              <div className="p-3 card-cream">
                <div className="flex items-center gap-2 mb-2">
                  <Fingerprint className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-dark">Fingerprint</span>
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200 font-bold">SHA-256</span>
                </div>
                <p className="text-[10px] font-mono text-dark/40 break-all leading-relaxed bg-white p-2 rounded-lg border border-cream-dark/20">{device.fingerprint}</p>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* â•â•â• ADD PAYMENT CARD â€” FULL WIDTH â•â•â• */}
        <div className="mb-6">
          <SectionCard title="Add a Payment Card" subtitle="Link your card for secure transactions" icon={CreditCard}
            onSave={() => saveSection('financial')} saving={saving.financial} saved={saved.financial}
          >
            <div className="space-y-5">
              {/* Card visual preview */}
              <div className="bg-gradient-to-br from-primary via-primary-dark to-primary rounded-2xl p-6 text-white max-w-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="flex items-center justify-between mb-8 relative">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-6 bg-amber-400 rounded-md" />
                    <Wifi className="w-4 h-4 text-white/40 rotate-90" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-white/60">{financial.card_type || 'CARD'}</span>
                </div>
                <p className="text-xl font-mono tracking-[0.2em] mb-6 relative">
                  â€¢â€¢â€¢â€¢ â€¢â€¢â€¢â€¢ â€¢â€¢â€¢â€¢ {financial.card_last4 || 'â€¢â€¢â€¢â€¢'}
                </p>
                <div className="flex justify-between items-end relative">
                  <div>
                    <p className="text-[9px] text-white/40 uppercase tracking-wider mb-0.5">Cardholder</p>
                    <p className="text-sm font-bold tracking-wide">{basic.name || 'YOUR NAME'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-white/40 uppercase tracking-wider mb-0.5">Bank</p>
                    <p className="text-xs font-semibold">{financial.bank_name || 'â€”'}</p>
                  </div>
                </div>
              </div>

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
                    className="input-field text-center font-mono font-bold tracking-[0.3em] text-lg"
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

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-dark/60 mb-2">
                  <CreditCard className="w-3.5 h-3.5" /> Card Network <span className="text-red-400">*</span>
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

              <div className="max-w-xs">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-dark/60 mb-1.5">
                  <Wallet className="w-3.5 h-3.5" /> Average Balance (â‚¹)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark/40 font-bold">â‚¹</span>
                  <input
                    type="number"
                    value={financial.avg_balance}
                    onChange={(e) => setFinancial(p => ({ ...p, avg_balance: e.target.value === '' ? '' : Math.max(0, Number(e.target.value)) }))}
                    placeholder="50,000"
                    min={0}
                    className="input-field pl-10 font-mono tabular-nums"
                  />
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* â•â•â• LOCATION & BEHAVIOR ROW â•â•â• */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          <SectionCard title="Location Intelligence" subtitle="GPS auto-capture" icon={MapPin}
            onSave={() => saveSection('location')} saving={saving.location} saved={saved.location}
          >
            <div className="space-y-4">
              <div className={`flex items-center gap-3 p-3 rounded-lg border ${location.lat ? 'bg-green-50 border-green-200' : 'bg-cream-light border-cream-dark/30'}`}>
                <div className={`w-2.5 h-2.5 rounded-full ${location.lat ? 'bg-green-500 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
                <span className="text-sm font-medium text-dark/70">{gpsLoading ? 'Acquiring GPS...' : location.lat ? 'Location Locked' : 'Awaiting GPS'}</span>
                <button type="button" onClick={fetchGPS} disabled={gpsLoading} className="ml-auto flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark transition-colors">
                  <RefreshCw className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
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

          <SectionCard title="Behavioral Analytics" subtitle="Keystroke & session tracking" icon={Activity}
            onSave={() => saveSection('behavior')} saving={saving.behavior} saved={saved.behavior}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="card-cream p-3 text-center">
                  <Zap className="w-4 h-4 text-primary mx-auto mb-1.5" />
                  <p className="text-xl font-black text-dark tabular-nums">{typingSpeed}</p>
                  <p className="text-[9px] uppercase tracking-wider text-dark/40 font-bold mt-0.5">Char/Sec</p>
                  {typingSpeed > 0 && <p className={`text-[9px] font-bold ${speedColor} mt-0.5`}>{speedLabel}</p>}
                </div>
                <div className="card-cream p-3 text-center">
                  <Clock className="w-4 h-4 text-primary mx-auto mb-1.5" />
                  <p className="text-xl font-black text-dark tabular-nums">{formatDuration(sessionDuration)}</p>
                  <p className="text-[9px] uppercase tracking-wider text-dark/40 font-bold mt-0.5">Session</p>
                </div>
                <div className="card-cream p-3 text-center">
                  <Activity className="w-4 h-4 text-primary mx-auto mb-1.5" />
                  <p className="text-xl font-black text-dark tabular-nums">
                    {new Date().getHours().toString().padStart(2, '0')}:{new Date().getMinutes().toString().padStart(2, '0')}
                  </p>
                  <p className="text-[9px] uppercase tracking-wider text-dark/40 font-bold mt-0.5">Active</p>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-dark/60 mb-1.5">
                  <Zap className="w-3.5 h-3.5" /> Typing Calibration
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">LIVE</span>
                </label>
                <textarea
                  rows={2}
                  onKeyDown={handleTypingTrack}
                  placeholder="Type here to calibrate... The quick brown fox jumps over the lazy dog."
                  className="input-field resize-none text-sm"
                />
                {typingSpeed > 0 && (
                  <div className="mt-2 h-1.5 rounded-full bg-cream-dark/20 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
                      animate={{ width: `${Math.min(100, (typingSpeed / 12) * 100)}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}
              </div>
            </div>
          </SectionCard>
        </div>

        {/* â•â•â• BIOMETRIC â€” FULL WIDTH â•â•â• */}
        <div className="mb-6">
          <SectionCard title="Biometric Verification" subtitle="Face capture & embedding registration" icon={ScanFace}
            onSave={biometricEnabled && faceData ? () => saveSection('biometric') : undefined}
            saving={saving.biometric} saved={saved.biometric}
          >
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <Shield className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  <strong>Privacy-First:</strong> Your face image is processed locally and discarded immediately. Only a 128-dim numeric embedding is stored â€” it cannot be reversed into an image.
                </p>
              </div>

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

                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                        <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                        <div className="absolute bottom-4 left-4 w-10 h-10 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                        <div className="absolute bottom-4 right-4 w-10 h-10 border-b-2 border-r-2 border-primary rounded-br-lg" />
                      </div>

                      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-dark/80 backdrop-blur">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Live</span>
                      </div>

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

              {faceError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <p className="text-xs text-red-600">{faceError}</p>
                </div>
              )}

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

        {/* â•â•â• FOOTER â•â•â• */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-4 py-6 text-xs text-dark/30"
        >
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            <span>End-to-end encrypted</span>
          </div>
          <span>â€¢</span>
          <div className="flex items-center gap-1.5">
            <Database className="w-3 h-3" />
            <span>MongoDB Atlas</span>
          </div>
          <span>â€¢</span>
          <div className="flex items-center gap-1.5">
            <Layers className="w-3 h-3" />
            <span>Real-time Socket.IO sync</span>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
