// ============================================================
// Rakshak AI — Payment Gate v2
// Order: Location → Biometric (Face) → OTP
// MVP: Real face embedding match via face-api.js
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, MapPin, Scan, KeyRound,
  CheckCircle2, XCircle, AlertTriangle,
  Loader2, Home, Navigation,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

// ── Haversine distance (km) ──────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Step dots ────────────────────────────────────────────────
const STEPS = [
  { id: 'location',  label: 'Location',   Icon: MapPin  },
  { id: 'biometric', label: 'Face Match',  Icon: Scan    },
  { id: 'otp',       label: 'OTP',         Icon: KeyRound},
];

function StepDots({ current }) {
  const idx = STEPS.findIndex(s => s.id === current);
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {STEPS.map((s, i) => {
        const done   = i < idx;
        const active = i === idx;
        const Icon   = s.Icon;
        return (
          <div key={s.id} className="flex items-center gap-2">
            <motion.div
              animate={{ scale: active ? 1.1 : 1 }}
              className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                done   ? 'bg-green-500 border-green-500 text-white' :
                active ? 'bg-primary border-primary text-white' :
                         'bg-transparent border-cream-dark/30 text-dark/30'
              }`}
            >
              {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
            </motion.div>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-0.5 rounded-full transition-colors ${done ? 'bg-green-400' : 'bg-cream-dark/20'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// STEP 1 — LOCATION (GPS first, sets context for biometric)
// ══════════════════════════════════════════════════════════════
function LocationStep({ user, onResult }) {
  const [status, setStatus] = useState('idle');
  const [distance, setDistance] = useState(null);

  const homeLocation = user?.location?.home_location;
  const hasHome = !!(homeLocation?.lat && homeLocation?.lng);
  const homeCity = homeLocation?.city || `${homeLocation?.lat?.toFixed(2)}, ${homeLocation?.lng?.toFixed(2)}`;

  const request = () => {
    if (!hasHome) { onResult({ passed: true, distanceKm: null, noHome: true }); return; }
    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const km = Math.round(haversine(homeLocation.lat, homeLocation.lng, pos.coords.latitude, pos.coords.longitude));
        setDistance(km);
        const tier = km <= 10 ? 'safe' : km <= 50 ? 'near' : km <= 200 ? 'far' : 'very_far';
        setStatus(tier);
        setTimeout(() => onResult({ passed: true, distanceKm: km, tier, coords: { lat: pos.coords.latitude, lng: pos.coords.longitude } }), 1600);
      },
      () => {
        setStatus('denied');
        setTimeout(() => onResult({ passed: false, distanceKm: null, denied: true }), 800);
      },
      { timeout: 15000, maximumAge: 60000 }
    );
  };

  if (status === 'idle') return (
    <div className="text-center py-2">
      <div className="w-20 h-20 bg-blue-50 border-2 border-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Navigation className="w-9 h-9 text-blue-500" />
      </div>
      <p className="font-black text-dark text-lg mb-1">Location Check</p>
      <p className="text-sm text-dark/50 mb-2 leading-relaxed">
        Rakshak AI verifies your GPS location before every payment to detect anomalies.
      </p>
      {hasHome && (
        <div className="inline-flex items-center gap-1.5 bg-cream-light border border-cream-dark/20 rounded-lg px-3 py-1.5 text-xs text-dark/60 font-semibold mb-5">
          <Home className="w-3 h-3" /> Home: {homeCity}
        </div>
      )}
      <div className="space-y-2">
        <button onClick={request} className="btn-primary w-full py-3">
          Enable GPS Location
        </button>
        <button
          onClick={() => onResult({ passed: false, distanceKm: null, denied: true })}
          className="w-full py-2 text-xs text-dark/40 hover:text-dark/60 transition-colors"
        >
          Skip GPS (increases risk score)
        </button>
      </div>
    </div>
  );

  if (status === 'loading') return (
    <div className="text-center py-12">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full mx-auto mb-4" />
      <p className="font-bold text-dark">Getting your location...</p>
      <p className="text-xs text-dark/40 mt-1">Allow location access in the browser prompt</p>
    </div>
  );

  if (status === 'denied') return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center py-6">
      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <AlertTriangle className="w-8 h-8 text-orange-400" />
      </div>
      <p className="font-bold text-orange-600 mb-1">Location Access Denied</p>
      <p className="text-xs text-dark/50">Proceeding without GPS — location risk penalty applied</p>
    </motion.div>
  );

  const cfg = {
    safe:     { bg: 'bg-green-50', border: 'border-green-200', icon: '🏠', color: 'text-green-700', label: 'Safe Zone', sub: 'You\'re within 10 km of home. Low risk.' },
    near:     { bg: 'bg-blue-50',  border: 'border-blue-200',  icon: '📍', color: 'text-blue-700',  label: 'Near Home', sub: `${distance} km from home — acceptable range.` },
    far:      { bg: 'bg-orange-50',border: 'border-orange-200',icon: '⚠️', color: 'text-orange-700',label: 'Far from Home', sub: `${distance} km from home — moderate risk applied.` },
    very_far: { bg: 'bg-red-50',   border: 'border-red-200',   icon: '🚨', color: 'text-red-700',   label: 'Very Far', sub: `${distance} km — high location risk. Extra verification required.` },
  };
  const c = cfg[status] || cfg.near;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
      <div className={`w-20 h-20 ${c.bg} border-2 ${c.border} rounded-full flex items-center justify-center mx-auto mb-4 text-3xl`}>
        {c.icon}
      </div>
      <p className={`font-black text-xl mb-1 ${c.color}`}>{c.label}</p>
      <p className="text-sm text-dark/60 mb-3">{c.sub}</p>
      <div className={`inline-flex items-center gap-2 ${c.bg} border ${c.border} rounded-xl px-4 py-2.5`}>
        <MapPin className={`w-4 h-4 ${c.color}`} />
        <span className={`font-black text-lg ${c.color}`}>{distance} km</span>
        <span className={`text-xs ${c.color} opacity-70`}>from registered home</span>
      </div>
      {status === 'safe' && (
        <p className="text-xs text-green-600 mt-3 font-semibold">
          ✓ Face verification still required to confirm your identity
        </p>
      )}
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// STEP 2 — BIOMETRIC (face-api.js live match vs stored embedding)
// ══════════════════════════════════════════════════════════════
function BiometricStep({ user, locationTier, onResult }) {
  const videoRef   = useRef(null);
  const streamRef  = useRef(null);
  const faceapiRef = useRef(null);
  const loopRef    = useRef(null);

  const [phase, setPhase] = useState('checking'); // 'checking' | 'idle' | 'loading_models' | ...
  const [faceDetected, setFaceDetected] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [hasEmbedding, setHasEmbedding] = useState(false);

  const isInSafeZone = locationTier === 'safe';

  // Check fresh from DB on mount — don't trust stale user context
  useEffect(() => {
    api.get('/payments/gate/biometric/status')
      .then(res => {
        const has = res.data?.hasEmbedding === true;
        setHasEmbedding(has);
        setPhase(has ? 'idle' : 'no_embedding');
      })
      .catch(() => {
        // Fallback to user prop if API fails
        const has = user?.biometric?.has_embedding === true;
        setHasEmbedding(has);
        setPhase(has ? 'idle' : 'no_embedding');
      });
  }, [user]);

  useEffect(() => () => { stopCamera(); clearInterval(loopRef.current); }, []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const loadAndStart = useCallback(async () => {
    setPhase('loading_models');
    try {
      const faceapi = await import('face-api.js');
      faceapiRef.current = faceapi;
      // MUST match DataCollection exactly — same CDN, same models
      const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL), // full model, NOT tiny
      ]);
      await startCamera();
      setPhase('camera');
    } catch (err) {
      console.error('[Face-api]', err);
      toast.error('Face engine failed to load — check network');
      setPhase('idle'); // go back to idle so user can retry
    }
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 } },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      throw new Error('Camera access denied');
    }
  };

  // Wire stream to video element once it mounts (phase changes to 'camera')
  useEffect(() => {
    if (phase === 'camera' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [phase]);

  // Continuous face detection loop once camera is active
  useEffect(() => {
    if (phase !== 'camera' || !faceapiRef.current) return;
    const faceapi = faceapiRef.current;
    loopRef.current = setInterval(async () => {
      if (!videoRef.current) return;
      const det = await faceapi.detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.45 })
      );
      setFaceDetected(!!det);
    }, 350);
    return () => clearInterval(loopRef.current);
  }, [phase]);

  const verifyFace = async () => {
    if (!faceapiRef.current || !videoRef.current) return;
    clearInterval(loopRef.current);
    setPhase('verifying');
    const faceapi = faceapiRef.current;
    try {
      const result = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224 }))
        .withFaceLandmarks()        // full landmarks — must match DataCollection
        .withFaceDescriptor();

      if (!result) {
        toast.error('No clear face detected — reposition and try again');
        setPhase('camera');
        return;
      }

      const embedding = Array.from(result.descriptor);
      const res = await api.post('/payments/gate/biometric', { faceEmbedding: embedding });
      const { passed, confidence: conf } = res.data;

      stopCamera();
      setConfidence(Math.round((conf || 0) * 100));

      if (passed) {
        setPhase('passed');
        setTimeout(() => onResult({ passed: true, confidence: Math.round((conf || 0) * 100), method: 'face' }), 1200);
      } else {
        setPhase('failed');
      }
    } catch (err) {
      console.error('[Biometric verify]', err);
      toast.error('Verification error — try again');
      setPhase('camera');
    }
  };

  const skip = () => { stopCamera(); onResult({ passed: false, confidence: 0, method: 'skipped' }); };

  // ── render: checking DB status ──
  if (phase === 'checking') return (
    <div className="text-center py-12">
      <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
      <p className="text-sm text-dark/50">Checking biometric status...</p>
    </div>
  );

  // ── render: no embedding ──
  if (phase === 'no_embedding') return (
    <div className="text-center py-6">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
        <XCircle className="w-8 h-8 text-red-400" />
      </div>
      <p className="font-bold text-dark mb-1">Biometric Not Registered</p>
      <p className="text-xs text-dark/50 mb-4 leading-relaxed">
        You must register your face before making payments.<br />
        Go to <strong>Data Collection → Biometric</strong> to set it up first.
      </p>
      {isInSafeZone && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-xs text-green-700 font-semibold mb-4">
          ✓ Safe zone detected — but biometric is still required for all payments
        </div>
      )}
      <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-semibold">
        ⚠ Biometric verification is mandatory. Payment cannot proceed without it.
      </div>
    </div>
  );

  // ── render: idle ──
  if (phase === 'idle') return (
    <div className="text-center py-2">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Scan className="w-9 h-9 text-primary" />
      </div>
      <p className="font-black text-dark text-lg mb-1">Face Verification Required</p>
      {isInSafeZone ? (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-xs text-green-700 font-semibold mb-3">
          🏠 Safe zone — you're within 10 km of home. Face match still required.
        </div>
      ) : (
        <p className="text-sm text-dark/50 mb-3">
          You're outside your home zone. Face verification is mandatory.
        </p>
      )}
      <p className="text-xs text-dark/40 mb-5">
        Your face will be matched against your registered biometric embedding.
      </p>
      <button onClick={loadAndStart} className="btn-primary w-full py-3">
        Start Face Scan
      </button>
    </div>
  );

  // ── render: loading models ──
  if (phase === 'loading_models') return (
    <div className="text-center py-12">
      <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
      <p className="font-bold text-dark">Loading Face Recognition Engine</p>
      <p className="text-xs text-dark/40 mt-1">Downloading neural network weights...</p>
      <div className="flex justify-center gap-1 mt-3">
        {[0,1,2].map(i => (
          <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
            className="w-1.5 h-1.5 bg-primary rounded-full" />
        ))}
      </div>
    </div>
  );

  // ── render: passed ──
  if (phase === 'passed') return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-10 h-10 text-green-500" />
      </div>
      <p className="font-black text-dark text-xl mb-1">Identity Confirmed ✓</p>
      <p className="text-sm text-green-600 font-bold">Match confidence: {confidence}%</p>
      <p className="text-xs text-dark/40 mt-1">Proceeding to OTP verification...</p>
    </motion.div>
  );

  // ── render: failed — must retry, no bypass ──
  if (phase === 'failed') return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
      <motion.div
        animate={{ x: [-6, 6, -5, 5, -3, 3, 0] }}
        transition={{ duration: 0.5 }}
        className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
      >
        <XCircle className="w-10 h-10 text-red-500" />
      </motion.div>
      <p className="font-black text-dark text-xl mb-1">Face Did Not Match</p>
      <p className="text-sm text-dark/50 mb-2 leading-relaxed">
        Your face doesn't match the stored biometric.<br />
        Please try again in better lighting.
      </p>
      <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-semibold mb-4">
        ⚠ Biometric verification is mandatory. You must pass to proceed.
      </div>
      <button onClick={() => setPhase('idle')} className="btn-primary px-8">Try Again</button>
    </motion.div>
  );

  // ── render: camera / verifying ──
  return (
    <div className="text-center">
      {/* Live camera preview */}
      <div className="relative mx-auto mb-4 rounded-2xl overflow-hidden" style={{ width: 300, height: 220 }}>
        <video
          ref={videoRef}
          autoPlay muted playsInline
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Animated face guide box */}
        <motion.div
          animate={{
            borderColor: faceDetected ? '#22c55e' : '#722f37',
            boxShadow: faceDetected ? '0 0 0 2px rgba(34,197,94,0.3)' : 'none',
          }}
          transition={{ duration: 0.3 }}
          className="absolute inset-6 rounded-2xl border-2 pointer-events-none"
        />

        {/* Corner brackets */}
        {[['top-5 left-5', 'border-t-2 border-l-2'], ['top-5 right-5', 'border-t-2 border-r-2'],
          ['bottom-5 left-5', 'border-b-2 border-l-2'], ['bottom-5 right-5', 'border-b-2 border-r-2']].map(([pos, br], i) => (
          <div key={i} className={`absolute w-5 h-5 ${pos} ${br} ${faceDetected ? 'border-green-400' : 'border-primary/60'} rounded-sm transition-colors`} />
        ))}

        {/* Status badge */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold text-white transition-colors ${faceDetected ? 'bg-green-500' : 'bg-dark/60'}`}>
          {faceDetected ? '✓ Face Detected' : '⬤ Searching...'}
        </div>

        {/* Verifying overlay */}
        {phase === 'verifying' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 bg-dark/70 flex flex-col items-center justify-center gap-2 rounded-2xl"
          >
            <Loader2 className="w-8 h-8 text-white animate-spin" />
            <p className="text-white text-sm font-bold">Matching identity...</p>
            <motion.div
              animate={{ scaleX: [0, 1] }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="h-0.5 bg-primary w-24 rounded-full"
            />
          </motion.div>
        )}
      </div>

      <p className="text-xs text-dark/50 mb-4">
        {faceDetected
          ? '✓ Face in frame — click Verify when ready'
          : 'Position your face within the green frame'}
      </p>

      <div className="flex gap-2 justify-center">
        <button
          onClick={verifyFace}
          disabled={!faceDetected || phase === 'verifying'}
          className={`btn-primary px-8 py-2.5 ${(!faceDetected || phase === 'verifying') ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          {phase === 'verifying' ? 'Verifying...' : 'Verify Face'}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// STEP 3 — OTP (6-digit, server-generated, demo-visible)
// ══════════════════════════════════════════════════════════════
function OTPStep({ user, onResult }) {
  const [phase, setPhase] = useState('idle'); // idle | sent | verifying | passed
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [demoCode, setDemoCode] = useState('');
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);

  const phone = user?.phone;
  const masked = phone
    ? `+91 ···· ···${String(phone).slice(-4)}`
    : 'your registered number';

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const send = async () => {
    try {
      const res = await api.post('/payments/gate/otp/request');
      setDemoCode(res.data.demoCode || '');
      setPhase('sent');
      setResendCooldown(30);
      setDigits(['', '', '', '', '', '']);
      setError('');
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
      toast.success('OTP sent!', { icon: '📱' });
    } catch {
      toast.error('Failed to send OTP — check server connection');
    }
  };

  const handleDigit = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...digits];
    next[i] = val.slice(-1);
    setDigits(next);
    setError('');
    if (val && i < 5) setTimeout(() => inputRefs.current[i + 1]?.focus(), 0);
  };

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) {
      setDigits(paste.split(''));
      setTimeout(() => inputRefs.current[5]?.focus(), 0);
    }
  };

  const verify = async () => {
    const code = digits.join('');
    if (code.length < 6) { setError('Enter the complete 6-digit OTP'); return; }
    setPhase('verifying');
    try {
      const res = await api.post('/payments/gate/otp/verify', { otp: code });
      if (res.data.passed) {
        setPhase('passed');
        setTimeout(() => onResult({ passed: true }), 900);
      } else {
        setPhase('sent');
        setError(res.data.reason === 'otp_expired' ? 'OTP expired — please resend' : 'Incorrect OTP. Try again.');
        setDigits(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch {
      setPhase('sent');
      setError('Verification failed — try again');
    }
  };

  if (phase === 'idle') return (
    <div className="text-center py-2">
      <div className="w-20 h-20 bg-purple-50 border-2 border-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <KeyRound className="w-9 h-9 text-purple-500" />
      </div>
      <p className="font-black text-dark text-lg mb-1">OTP Verification</p>
      <p className="text-sm text-dark/50 mb-1">A 6-digit code will be sent to</p>
      <p className="text-sm font-bold text-dark mb-5">{masked}</p>
      <button onClick={send} className="btn-primary w-full py-3 mb-2">Send OTP</button>
      <button onClick={() => onResult({ passed: false, skipped: true })}
        className="w-full py-2 text-xs text-dark/40 hover:text-dark/60 transition-colors">
        Skip (increases transaction risk)
      </button>
    </div>
  );

  if (phase === 'passed') return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-10 h-10 text-green-500" />
      </div>
      <p className="font-black text-dark text-xl">OTP Verified ✓</p>
      <p className="text-xs text-dark/40 mt-1">All checks passed — proceeding to payment</p>
    </motion.div>
  );

  return (
    <div className="text-center">
      <p className="font-bold text-dark text-base mb-1">Enter OTP</p>
      <p className="text-xs text-dark/50 mb-3">Sent to <strong>{masked}</strong></p>

      {/* Demo code reveal */}
      {demoCode && (
        <motion.div
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 mb-4 inline-block"
        >
          <p className="text-xs text-amber-600 font-semibold mb-0.5">📱 Demo mode — your OTP:</p>
          <p className="text-3xl font-black text-amber-800 tracking-[0.4em]">{demoCode}</p>
        </motion.div>
      )}

      {/* 6-box input */}
      <div className="flex gap-2 justify-center mb-3" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={el => inputRefs.current[i] = el}
            type="text" inputMode="numeric" maxLength={1}
            value={d}
            onChange={e => handleDigit(i, e.target.value)}
            onKeyDown={e => handleKey(i, e)}
            className={`w-11 h-12 text-center text-xl font-black rounded-xl border-2 outline-none transition-all focus:ring-2 focus:ring-primary/40 ${
              d ? 'border-primary bg-cream-light' : 'border-cream-dark/30 bg-white'
            } ${error ? 'border-red-400 bg-red-50' : ''}`}
          />
        ))}
      </div>

      {error && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-500 mb-3">
          {error}
        </motion.p>
      )}

      <div className="flex gap-2 justify-center mb-2">
        <button
          onClick={verify}
          disabled={phase === 'verifying'}
          className="btn-primary px-8 py-2.5"
        >
          {phase === 'verifying'
            ? <><Loader2 className="w-4 h-4 animate-spin inline mr-1.5" />Verifying...</>
            : 'Verify OTP'}
        </button>
      </div>
      <button
        onClick={send}
        disabled={resendCooldown > 0}
        className={`text-xs font-semibold transition-colors ${resendCooldown > 0 ? 'text-dark/30 cursor-not-allowed' : 'text-primary hover:underline'}`}
      >
        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN GATE COMPONENT
// ══════════════════════════════════════════════════════════════
export default function PaymentGate({ user, onComplete, onCancel }) {
  const [step, setStep] = useState('location');
  const [results, setResults] = useState({ location: null, biometric: null, otp: null });

  const handleLocation = r => {
    setResults(p => ({ ...p, location: r }));
    setStep('biometric');
  };
  const handleBiometric = r => {
    setResults(p => ({ ...p, biometric: r }));
    setStep('otp');
  };
  const handleOTP = r => {
    const final = { ...results, otp: r };
    setResults(final);
    setStep('complete');
    setTimeout(() => onComplete(final), 600);
  };

  const locationTier = results.location?.tier || 'unknown';

  const riskFlags = [];
  if (results.biometric && !results.biometric.passed) {
    riskFlags.push(results.biometric.method === 'face_failed' ? '❌ Biometric face mismatch' : '⚠ Biometric skipped');
  }
  if (results.location?.distanceKm > 50) riskFlags.push(`📍 ${results.location.distanceKm} km from home`);
  if (results.otp && !results.otp.passed) riskFlags.push('⚠ OTP skipped');

  const stepIdx = { location: 0, biometric: 1, otp: 2, complete: 3 };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(10,5,5,0.75)', backdropFilter: 'blur(10px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
        initial={{ scale: 0.88, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      >
        {/* Header */}
        <div className="bg-primary rounded-t-3xl px-6 pt-5 pb-4 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cream/80" />
              <span className="text-cream font-black text-xs uppercase tracking-widest">
                Sovereign Payment Gate
              </span>
            </div>
            <button onClick={onCancel} className="text-cream/50 hover:text-cream text-xs transition-colors px-2 py-1">
              ✕
            </button>
          </div>
          <p className="text-cream/50 text-[10px]">
            {stepIdx[step] + 1 > 3 ? 'All checks complete' : `Step ${stepIdx[step] + 1} of 3`} — 3-factor payment security
          </p>
        </div>

        <div className="px-6 py-5">
          {/* Step dots */}
          {step !== 'complete' && <StepDots current={step} />}

          {/* Step content */}
          <AnimatePresence mode="wait">
            {step === 'location' && (
              <motion.div key="location" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
                <LocationStep user={user} onResult={handleLocation} />
              </motion.div>
            )}

            {step === 'biometric' && (
              <motion.div key="biometric" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
                <BiometricStep user={user} locationTier={locationTier} onResult={handleBiometric} />
              </motion.div>
            )}

            {step === 'otp' && (
              <motion.div key="otp" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
                <OTPStep user={user} onResult={handleOTP} />
              </motion.div>
            )}

            {step === 'complete' && (
              <motion.div key="complete" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                <motion.div
                  animate={{ scale: [1, 1.12, 1] }}
                  transition={{ duration: 0.5 }}
                  className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle2 className="w-11 h-11 text-green-500" />
                </motion.div>
                <p className="font-black text-dark text-xl mb-1">All Checks Passed</p>
                <p className="text-sm text-dark/50 mb-3">Proceeding to AI analysis...</p>

                {riskFlags.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left">
                    <p className="text-xs font-bold text-amber-700 mb-1.5">Risk factors noted:</p>
                    {riskFlags.map((f, i) => (
                      <p key={i} className="text-xs text-amber-600 mb-0.5">{f}</p>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
