// ============================================================
// Rakshak AI - Login Page
// Split screen institutional login matching design image exactly
// ============================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Fingerprint, Eye, EyeOff, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { generateDeviceFingerprint, getDeviceInfo } from '../utils/deviceFingerprint';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const fingerprint = generateDeviceFingerprint();
      const deviceInfo = getDeviceInfo();
      const res = await login(email, password, fingerprint);

      if (res.success) {
        toast.success('Welcome to the Sovereign Archive', {
          icon: '🛡️',
          style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' },
        });
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Authentication failed';
      setError(msg);
      setShake(true);
      setTimeout(() => setShake(false), 600);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometric = async () => {
    setBiometricLoading(true);
    try {
      const res = await (await import('../services/api')).default.post('/auth/biometric', { email: email || 'demo@rakshak.ai' });
      if (res.data.success) {
        localStorage.setItem('rakshak_token', res.data.token);
        localStorage.setItem('rakshak_user', JSON.stringify(res.data.user));
        toast.success('Biometric authentication successful', { icon: '👆' });
        window.location.href = '/dashboard';
      }
    } catch (err) {
      toast.error('Biometric verification failed');
    } finally {
      setBiometricLoading(false);
    }
  };

  // Quick demo login fill
  const fillDemo = () => {
    setEmail('demo@rakshak.ai');
    setPassword('Demo@123');
  };

  return (
    <div className="min-h-screen flex">
      {/* ====== LEFT PANEL (cream) ====== */}
      <div className="w-1/2 bg-cream flex flex-col justify-between p-12">
        {/* Logo */}
        <div>
          <div className="flex items-center gap-2 mb-2">
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
            Access your institutional dashboard.
          </motion.p>

          {/* Quick demo button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={fillDemo}
            className="mt-6 text-xs text-primary/60 hover:text-primary underline underline-offset-2 transition-colors"
          >
            Fill demo credentials →
          </motion.button>
        </div>

        {/* Security Protocol badge */}
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
          {/* Progress bar */}
          <div className="h-1.5 bg-cream rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-primary"
              style={{ width: '85%' }}
            />
          </div>
          <p className="text-dark/50 text-xs mt-2 uppercase tracking-wider font-medium">
            Encryption Strength: Maximal
          </p>
        </motion.div>
      </div>

      {/* ====== RIGHT PANEL (white) ====== */}
      <div className="w-1/2 bg-cream-light flex flex-col justify-center px-16">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className={shake ? 'animate-shake' : ''}
        >
          <h2 className="text-3xl font-black text-dark mb-1">Institutional Login</h2>
          <p className="text-dark/50 text-sm mb-8">Enter your credentials to access the ledger.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-dark/60 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@organization.ai"
                className="input-field"
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-dark/60">
                  Security Token
                </label>
                <button type="button" className="text-xs text-primary font-semibold hover:text-primary-dark">
                  FORGOT?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="input-field pr-12"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-dark/30 hover:text-dark/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-600 text-sm font-medium bg-red-50 border border-red-100 rounded-lg px-4 py-2"
              >
                {error}
              </motion.p>
            )}

            {/* Submit */}
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
              ) : (
                'Initialize Session'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-cream-dark/40" />
            <span className="text-xs text-dark/40 font-medium uppercase tracking-widest">Alternative Gateway</span>
            <div className="flex-1 h-px bg-cream-dark/40" />
          </div>

          {/* Biometric */}
          <button
            onClick={handleBiometric}
            disabled={biometricLoading}
            className="w-full btn-ghost py-4 flex items-center justify-center gap-3 text-sm font-semibold"
          >
            {biometricLoading ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Fingerprint className="w-5 h-5 text-primary" />
            )}
            Biometric Authentication
          </button>

          {/* Footer links */}
          <div className="mt-10">
            <div className="flex items-center justify-center gap-6 text-xs text-dark/40 mb-3">
              <button className="hover:text-dark/60 transition-colors uppercase tracking-wider">Privacy Policy</button>
              <button className="hover:text-dark/60 transition-colors uppercase tracking-wider">Audit Terms</button>
              <button className="hover:text-dark/60 transition-colors uppercase tracking-wider">System Status</button>
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
