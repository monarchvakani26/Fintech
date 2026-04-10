// ============================================================
// Rakshak AI - Payment Analysis Page
// Animated 8-step fraud detection loading - matches Image 5
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Shield, Fingerprint, Globe, BarChart2,
  Brain, Percent, Link, CheckCircle, AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

const ANALYSIS_STEPS = [
  { id: 1, label: 'Initializing Sovereign Protocol', sub: 'Bootstrapping secure analysis environment', icon: Shield, duration: 1200 },
  { id: 2, label: 'Capturing Device Fingerprint', sub: 'Encrypted hardware ID verified', icon: Fingerprint, duration: 1400 },
  { id: 3, label: 'Verifying Location Consistency', sub: 'Matching IP with historical geofencing...', icon: Globe, duration: 1400 },
  { id: 4, label: 'Analyzing Transaction Patterns', sub: 'Comparing against 4.2B financial patterns', icon: BarChart2, duration: 1600 },
  { id: 5, label: 'Running AI Risk Assessment', sub: '5-node consensus network computing...', icon: Brain, duration: 1400 },
  { id: 6, label: 'Calculating Final Risk Score', sub: 'Aggregating multi-vector analysis', icon: Percent, duration: 1000 },
  { id: 7, label: 'Generating Blockchain Proof', sub: 'SHA-256 immutable transaction hash', icon: Link, duration: 800 },
  { id: 8, label: 'Consensus Reached', sub: 'Analysis complete', icon: CheckCircle, duration: 600 },
];

export default function PaymentAnalysis() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};

  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [scoreCount, setScoreCount] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [bgTint, setBgTint] = useState('#EFDFBB');
  const analysisTriggered = useRef(false);

  const totalDuration = ANALYSIS_STEPS.reduce((s, step) => s + step.duration, 0);

  // Run the analysis in the background
  useEffect(() => {
    if (analysisTriggered.current) return;
    analysisTriggered.current = true;

    const runAnalysis = async () => {
      try {
        const res = await api.post(`/payments/analyze/${id}`, {
          deviceFingerprint: state.deviceFingerprint || 'trusted-device-001',
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          country: 'India',
          city: 'Mumbai',
        });
        setAnalysisResult(res.data);
      } catch (err) {
        console.error('Analysis error:', err);
        toast.error('Analysis error — please try again');
        setTimeout(() => navigate('/payments'), 2000);
      }
    };
    runAnalysis();
  }, [id]);

  // Animate the steps sequentially
  useEffect(() => {
    let elapsed = 0;
    const timeouts = [];

    ANALYSIS_STEPS.forEach((step, i) => {
      const timeout = setTimeout(() => {
        setCurrentStep(i + 1);
        const totalElapsed = ANALYSIS_STEPS.slice(0, i + 1).reduce((s, st) => s + st.duration, 0);
        setProgress(Math.round((totalElapsed / totalDuration) * 100));
      }, elapsed);
      timeouts.push(timeout);
      elapsed += step.duration;
    });

    // After all steps, navigate to result
    const finalTimeout = setTimeout(() => {
      if (analysisResult) {
        navigate(`/payments/result/${id}`, { state: { analysisResult } });
      } else {
        // Wait for result
        const wait = setInterval(() => {
          if (analysisResult) {
            clearInterval(wait);
            navigate(`/payments/result/${id}`, { state: { analysisResult } });
          }
        }, 200);
        setTimeout(() => {
          clearInterval(wait);
          navigate(`/payments/result/${id}`);
        }, 5000);
      }
    }, elapsed + 500);
    timeouts.push(finalTimeout);

    return () => timeouts.forEach(clearTimeout);
  }, [analysisResult]);

  // Animate score count when on step 6+
  useEffect(() => {
    if (currentStep >= 6 && analysisResult) {
      const targetScore = analysisResult.riskScore || 50;
      let count = 0;
      const interval = setInterval(() => {
        count += Math.ceil(targetScore / 20);
        if (count >= targetScore) {
          setScoreCount(targetScore);
          clearInterval(interval);
          // Set background tint based on risk
          if (targetScore <= 30) setBgTint('#f0fdf4');
          else if (targetScore <= 69) setBgTint('#fff7ed');
          else setBgTint('#fef2f2');
        } else {
          setScoreCount(count);
        }
      }, 60);
      return () => clearInterval(interval);
    }
  }, [currentStep, analysisResult]);

  const stepStatus = (stepIdx) => {
    if (stepIdx + 1 < currentStep) return 'completed';
    if (stepIdx + 1 === currentStep) return 'active';
    return 'pending';
  };

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-1000"
      style={{ backgroundColor: bgTint }}
    >
      {/* Top header bar (minimal) */}
      <header className="px-8 py-4 flex items-center justify-between border-b border-black/5">
        <div className="flex items-center gap-2">
          <span className="text-primary font-black text-lg">RAKSHAK AI</span>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium text-dark/50">
          {['Dashboard', 'Payments', 'Audit', 'Fraud Check'].map(tab => (
            <span key={tab} className={tab === 'Fraud Check' ? 'text-primary font-semibold underline underline-offset-4' : ''}>
              {tab}
            </span>
          ))}
        </div>
        <div className="w-8 h-8 bg-primary rounded-lg" />
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="grid grid-cols-2 gap-16 max-w-5xl w-full items-center">
          {/* LEFT: Analysis steps */}
          <div>
            {/* Live protocol badge */}
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 text-xs font-semibold text-primary mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              LIVE PROTOCOL
            </div>

            <h1 className="text-5xl font-black text-dark mb-2 leading-tight">
              Analyzing<br />
              <span className="text-primary">transaction...</span>
            </h1>
            <p className="text-dark/50 text-sm mb-8 leading-relaxed">
              Our Sovereign Archive intelligence is validating this request against 4.2B financial patterns.
            </p>

            {/* Steps list */}
            <div className="space-y-4">
              {ANALYSIS_STEPS.slice(0, 3).map((step, i) => {
                const status = stepStatus(i);
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                      status === 'completed' ? 'bg-green-100' :
                      status === 'active' ? 'bg-primary/10 ring-2 ring-primary/30' :
                      'bg-cream-dark/20'
                    }`}>
                      {status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : status === 'active' ? (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Icon className="w-4 h-4 text-dark/30" />
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-bold uppercase tracking-wider ${
                        status === 'pending' ? 'text-dark/30' : 'text-dark'
                      }`}>
                        {step.label.toUpperCase()}
                      </p>
                      <p className={`text-xs ${status === 'pending' ? 'text-dark/20' : 'text-dark/50'}`}>
                        {status === 'completed' ? step.sub.replace('...', '') :
                         status === 'active' ? step.sub :
                         'Waiting for preceding telemetry...'}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Transaction card */}
          <div className="relative">
            {/* Main card */}
            <motion.div
              initial={{ opacity: 0, y: 20, rotate: -2 }}
              animate={{ opacity: 1, y: 0, rotate: -1 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-3xl p-8 shadow-2xl relative z-10"
              style={{ transform: 'rotate(-1deg)' }}
            >
              {/* Score */}
              <div className="text-center mb-6">
                <div className="text-7xl font-black text-dark tabular-nums mb-1">
                  {currentStep >= 6 ? scoreCount : '--'}
                </div>
                <p className="text-dark/50 text-sm font-semibold uppercase tracking-widest">Shield Score</p>
              </div>

              {/* Transaction ID */}
              <div className="text-center mb-6">
                <p className="text-xs text-dark/40 uppercase tracking-wider mb-1">Transaction ID</p>
                <div className="inline-block bg-cream-light rounded-full px-4 py-1.5 text-xs font-mono font-bold text-dark/70">
                  {id?.substring(0, 16).toUpperCase() || 'TXN-ANALYZING'}
                </div>
              </div>

              {/* Amount & Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-cream-light rounded-xl p-4">
                  <p className="text-xs text-dark/40 uppercase tracking-wider mb-1">Amount</p>
                  <p className="text-lg font-black text-dark">
                    {state.amount ? formatCurrency(state.amount) : '---'}
                  </p>
                </div>
                <div className="bg-cream-light rounded-xl p-4">
                  <p className="text-xs text-dark/40 uppercase tracking-wider mb-1">Currency</p>
                  <p className="text-lg font-black text-dark">INR</p>
                </div>
              </div>
            </motion.div>

            {/* Vault protection badge */}
            <motion.div
              initial={{ opacity: 0, x: 20, y: -20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 0.8 }}
              className="absolute -top-4 -right-4 bg-primary rounded-2xl p-4 w-52 z-20"
            >
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-white" />
                <p className="text-white text-xs font-bold uppercase tracking-wider">Vault Protection</p>
              </div>
              <p className="text-white/60 text-xs leading-relaxed">
                AI models are currently verifying the authenticity of this high-value asset transfer via multi-vector analysis.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-cream-dark/20">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Footer */}
      <footer className="px-8 py-3 flex items-center justify-between border-t border-black/5">
        <div className="flex items-center gap-6 text-xs text-dark/40">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            SYSTEM: OPERATIONAL
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            NEURAL ENGINE: ACTIVE
          </span>
        </div>
        <p className="text-xs text-dark/30 font-medium">© 2024 RAKSHAK AI SOVEREIGN LEDGER 🔒</p>
      </footer>
    </div>
  );
}
