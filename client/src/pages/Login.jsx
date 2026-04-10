// ============================================================
// Rakshak AI - Login / Sign Up Page
// Split screen institutional auth with dramatic biometric scanning
// ============================================================
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Fingerprint, Eye, EyeOff, User, Mail, Phone, Lock, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { generateDeviceFingerprint, getDeviceInfo } from '../utils/deviceFingerprint';
import api from '../services/api';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Signup fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricPhase, setBiometricPhase] = useState('idle'); // idle|scanning|verifying|success|error
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const triggerError = (msg) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 600);
    toast.error(msg);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fingerprint = generateDeviceFingerprint();
      const res = await login(email, password, fingerprint);
      if (res.success) {
        toast.success(`Welcome back, ${res.user?.name?.split(' ')[0] || 'User'}`, {
          style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' },
        });
        navigate('/dashboard');
      }
    } catch (err) {
      triggerError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (signupPassword !== signupConfirm) {
      triggerError('Passwords do not match');
      return;
    }
    if (signupPassword.length < 8) {
      triggerError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await register(signupName, signupEmail, signupPassword, signupPhone);
      if (res.success) {
        toast.success(`Account created — welcome, ${signupName.split(' ')[0]}!`, {
          style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' },
        });
        navigate('/dashboard');
      }
    } catch (err) {
      triggerError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometric = async () => {
    if (biometricLoading) return;
    if (!email && mode === 'login') {
      triggerError('Enter your email first to use biometric login');
      return;
    }
    setBiometricLoading(true);
    setBiometricPhase('scanning');

    try {
      // Phase 1: scanning (1.2s)
      await new Promise(r => setTimeout(r, 1200));
      setBiometricPhase('verifying');

      // Phase 2: verifying (0.8s)
      await new Promise(r => setTimeout(r, 800));

      const res = await api.post('/auth/biometric', {
        email: email || 'demo@rakshak.ai',
        biometricData: 'fingerprint_hash_001',
      });
      if (res.data.success) {
        setBiometricPhase('success');
        localStorage.setItem('rakshak_token', res.data.token);
        localStorage.setItem('rakshak_user', JSON.stringify(res.data.user));
        toast.success('Biometric authentication successful', { icon: '🛡️' });
        await new Promise(r => setTimeout(r, 600));
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setBiometricPhase('error');
      triggerError(err.response?.data?.message || 'Biometric verification failed');
      await new Promise(r => setTimeout(r, 1500));
      setBiometricPhase('idle');
    } finally {
      setBiometricLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail('demo@rakshak.ai');
    setPassword('Demo@123');
  };

  // Biometric icon state renderer
  const BiometricIcon = () => {
    if (biometricPhase === 'success') return <CheckCircle className="w-6 h-6 text-green-500" />;
    if (biometricPhase === 'error') return <XCircle className="w-6 h-6 text-red-500" />;
    return <Fingerprint className={`w-6 h-6 ${biometricLoading ? 'text-primary' : 'text-primary'}`} />;
  };
  return (
    <div className="min-h-screen flex">
      {/* ====== LEFT PANEL ====== */}
      <div className="w-1/2 bg-cream flex flex-col justify-between p-12">
        {/* Logo */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="text-primary font-black text-xl tracking-tight">RAKSHAK AI</span>
          </div>
        </div>

        {/* Main copy */}
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl font-black text-dark leading-tight mb-6"
          >
            The Sovereign<br />Archive of<br />Finance.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-dark/60 text-base leading-relaxed max-w-xs"
          >
            Securing the global fintech ledger with editorial precision and unyielding integrity.
            {mode === 'login'
              ? ' Access your institutional dashboard.'
              : ' Create your account to get started.'}
          </motion.p>
          <AnimatePresence mode="wait">
            {mode === 'login' && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={fillDemo}
                className="mt-6 text-xs text-primary/60 hover:text-primary underline underline-offset-2 transition-colors"
                exit={{ opacity: 0 }}
              >
                Fill demo credentials →
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Security badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-xl p-5 max-w-xs shadow-card"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <span className="text-dark font-bold text-sm uppercase tracking-wider">Security Protocol 4.0</span>
          </div>
          <div className="h-1.5 bg-cream rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-primary" style={{ width: '85%' }} />
          </div>
          <p className="text-dark/50 text-xs mt-2 uppercase tracking-wider font-medium">
            Encryption Strength: Maximal
          </p>
        </motion.div>
      </div>

      {/* ====== RIGHT PANEL ====== */}
      <div className="w-1/2 bg-cream-light flex flex-col justify-center px-16 overflow-y-auto py-10">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className={shake ? 'animate-shake' : ''}
        >
          {/* Mode Tabs */}
          <div className="flex gap-1 mb-8 bg-cream-dark/15 rounded-xl p-1 w-fit">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
                mode === 'login'
                  ? 'bg-white text-dark shadow-sm'
                  : 'text-dark/40 hover:text-dark/60'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); }}
              className={`px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
                mode === 'signup'
                  ? 'bg-white text-dark shadow-sm'
                  : 'text-dark/40 hover:text-dark/60'
              }`}
            >
              Sign Up
            </button>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22 }}
              >
                <h2 className="text-3xl font-black text-dark mb-1">Welcome Back</h2>
                <p className="text-dark/50 text-sm mb-8">Sign in to access your dashboard.</p>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-dark/60 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="name@organization.ai"
                        className="input-field pl-10"
                        required
                        autoComplete="email"
                      />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark/30" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-dark/60 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="input-field pl-10 pr-12"
                        required
                        autoComplete="current-password"
                      />
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark/30" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-dark/30 hover:text-dark/60 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-600 text-sm font-medium bg-red-50 border border-red-100 rounded-lg px-4 py-2"
                    >
                      {error}
                    </motion.p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary py-4 text-sm uppercase tracking-widest"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Authenticating...
                      </span>
                    ) : 'Sign In'}
                  </button>
                </form>

                {/* Biometric */}
                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-cream-dark/40" />
                  <span className="text-xs text-dark/40 font-medium uppercase tracking-widest">Or</span>
                  <div className="flex-1 h-px bg-cream-dark/40" />
                </div>

                <div className="relative">
                  <button
                    onClick={handleBiometric}
                    disabled={biometricLoading}
                    className={`w-full py-4 flex items-center justify-center gap-3 text-sm font-semibold rounded-xl border-2 transition-all duration-300 ${
                      biometricPhase === 'success'
                        ? 'border-green-400 bg-green-50 text-green-700'
                        : biometricPhase === 'error'
                        ? 'border-red-400 bg-red-50 text-red-700'
                        : biometricPhase === 'scanning' || biometricPhase === 'verifying'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-cream-dark/30 bg-white hover:border-primary/40 text-dark/70 hover:text-dark'
                    }`}
                  >
                    {/* Pulsing rings for scanning */}
                    <div className="relative flex items-center justify-center">
                      {(biometricPhase === 'scanning' || biometricPhase === 'verifying') && (
                        <>
                          <motion.div
                            className="absolute w-10 h-10 rounded-full border-2 border-primary/40"
                            animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                          />
                          <motion.div
                            className="absolute w-10 h-10 rounded-full border-2 border-primary/30"
                            animate={{ scale: [1, 2.4], opacity: [0.4, 0] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                          />
                        </>
                      )}
                      <BiometricIcon />
                    </div>

                    <span>
                      {biometricPhase === 'idle' && 'Biometric Authentication'}
                      {biometricPhase === 'scanning' && 'Scanning Fingerprint...'}
                      {biometricPhase === 'verifying' && 'Verifying Identity...'}
                      {biometricPhase === 'success' && 'Identity Verified ✓'}
                      {biometricPhase === 'error' && 'Verification Failed'}
                    </span>
                  </button>

                  {biometricPhase === 'verifying' && (
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.8 }}
                      className="absolute bottom-0 left-0 h-0.5 bg-primary rounded-full"
                    />
                  )}
                </div>

                <p className="mt-6 text-center text-sm text-dark/40">
                  {"Don't have an account? "}
                  <button
                    onClick={() => { setMode('signup'); setError(''); }}
                    className="text-primary font-semibold hover:text-primary-dark"
                  >
                    Create one
                  </button>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22 }}
              >
                <h2 className="text-3xl font-black text-dark mb-1">Create Account</h2>
                <p className="text-dark/50 text-sm mb-8">Register to access your secure dashboard.</p>

                <form onSubmit={handleSignup} className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-dark/60 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={signupName}
                        onChange={e => setSignupName(e.target.value)}
                        placeholder="Arjun Sharma"
                        className="input-field pl-10"
                        required
                        autoComplete="name"
                      />
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark/30" />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-dark/60 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={signupEmail}
                        onChange={e => setSignupEmail(e.target.value)}
                        placeholder="name@organization.ai"
                        className="input-field pl-10"
                        required
                        autoComplete="email"
                      />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark/30" />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-dark/60 mb-2">
                      Phone <span className="text-dark/30 normal-case font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={signupPhone}
                        onChange={e => setSignupPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="input-field pl-10"
                        autoComplete="tel"
                      />
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark/30" />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-dark/60 mb-2">
                      Password <span className="text-dark/30 normal-case font-normal">(min 8 chars)</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={signupPassword}
                        onChange={e => setSignupPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="input-field pl-10 pr-12"
                        required
                        autoComplete="new-password"
                      />
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark/30" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-dark/30 hover:text-dark/60 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-dark/60 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={signupConfirm}
                        onChange={e => setSignupConfirm(e.target.value)}
                        placeholder="Re-enter your password"
                        className="input-field pl-10 pr-12"
                        required
                        autoComplete="new-password"
                      />
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark/30" />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-dark/30 hover:text-dark/60 transition-colors"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {signupConfirm && (
                      <p className={`text-xs mt-1 font-medium ${signupPassword === signupConfirm ? 'text-green-600' : 'text-red-500'}`}>
                        {signupPassword === signupConfirm ? '\u2713 Passwords match' : '\u2717 Passwords do not match'}
                      </p>
                    )}
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-600 text-sm font-medium bg-red-50 border border-red-100 rounded-lg px-4 py-2"
                    >
                      {error}
                    </motion.p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary py-4 text-sm uppercase tracking-widest"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating Account...
                      </span>
                    ) : 'Create Account'}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-dark/40">
                  Already have an account?{' '}
                  <button
                    onClick={() => { setMode('login'); setError(''); }}
                    className="text-primary font-semibold hover:text-primary-dark"
                  >
                    Sign in
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="mt-10">
            <div className="flex items-center justify-center gap-6 text-xs text-dark/40 mb-3">
              <span className="uppercase tracking-wider">Privacy Policy</span>
              <span className="uppercase tracking-wider">Audit Terms</span>
              <span className="uppercase tracking-wider">System Status</span>
            </div>
            <p className="text-center text-xs text-dark/30 italic">
              All transactions on Rakshak AI are monitored and immutable. Unauthorized access is strictly prohibited.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
// ============================================================
// Rakshak AI - Login / Sign Up Page
// Split screen institutional auth â€” real MongoDB credentials
