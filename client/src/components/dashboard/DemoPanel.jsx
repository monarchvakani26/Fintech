// ============================================================
// Rakshak AI - Demo Panel Component
// Fixed: routes through animation screen, keyboard shortcuts
// ============================================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, AlertTriangle, ShieldX, ChevronUp, ChevronDown, FlaskConical } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function DemoPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(null);
  const navigate = useNavigate();

  const runDemo = async (type) => {
    setLoading(type);
    const toastId = toast.loading(`Initiating ${type} demo — intercepting transaction...`, {
      style: { background: '#1a0a0c', color: '#EFDFBB' },
    });

    try {
      const endpointMap = {
        safe: '/demo/safe-transaction',
        suspicious: '/demo/suspicious-transaction',
        fraud: '/demo/fraud-transaction',
      };

      const res = await api.post(endpointMap[type]);
      toast.dismiss(toastId);

      if (res.data.success) {
        toast.success(`Demo created — watch the AI intercept it in real-time!`, { duration: 3000 });
        // BUG FIX: Navigate through the ANALYSIS animation, not directly to result
        setTimeout(() => {
          navigate(`/payments/analyze/${res.data.transactionId}`, {
            state: {
              transactionId: res.data.transactionId,
              amount: res.data.analysis?.comparisonMatrix?.requestedAmount || 5000,
              isDemo: true,
              demoType: type,
            },
          });
        }, 800);
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error('Demo failed. Make sure the backend is running on port 5000.');
    } finally {
      setLoading(null);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey) {
        if (e.key === 'D') { setIsOpen(true); toast.success('Demo Panel opened (Ctrl+Shift+D)', { icon: '⌨️' }); }
        if (e.key === 'S') runDemo('safe');
        if (e.key === 'W') runDemo('suspicious');
        if (e.key === 'F') runDemo('fraud');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50" style={{ maxWidth: '280px' }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20 }}
            className="mb-2 bg-white rounded-2xl shadow-2xl border border-cream-dark/30 overflow-hidden w-72"
          >
            {/* Header */}
            <div className="bg-primary px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-white/80" />
                  <div>
                    <p className="text-white text-xs font-bold uppercase tracking-wider">Demo Mode</p>
                    <p className="text-white/50 text-xs">⌨ Ctrl+Shift+S/W/F</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-white/50 text-xs">LIVE</span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="p-3 space-y-2">
              <button
                onClick={() => runDemo('safe')}
                disabled={!!loading}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 font-semibold text-sm hover:bg-green-100 transition-all duration-200 disabled:opacity-50"
              >
                {loading === 'safe' ? (
                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                <div className="text-left">
                  <p className="font-bold text-xs">⚡ Safe Transaction</p>
                  <p className="text-green-600 text-xs font-normal">Risk Score: ~12 → APPROVED</p>
                </div>
              </button>

              <button
                onClick={() => runDemo('suspicious')}
                disabled={!!loading}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 font-semibold text-sm hover:bg-orange-100 transition-all duration-200 disabled:opacity-50"
              >
                {loading === 'suspicious' ? (
                  <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                <div className="text-left">
                  <p className="font-bold text-xs">⚠️ Suspicious Activity</p>
                  <p className="text-orange-600 text-xs font-normal">Risk Score: ~58 → REVIEW</p>
                </div>
              </button>

              <button
                onClick={() => runDemo('fraud')}
                disabled={!!loading}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold text-sm hover:bg-red-100 transition-all duration-200 disabled:opacity-50"
              >
                {loading === 'fraud' ? (
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ShieldX className="w-4 h-4" />
                )}
                <div className="text-left">
                  <p className="font-bold text-xs">🚫 Fraud Attempt</p>
                  <p className="text-red-600 text-xs font-normal">Risk Score: ~94 → BLOCKED</p>
                </div>
              </button>

              <p className="text-center text-dark/30 text-xs pt-1">
                Each demo plays the full 8-step AI analysis
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-primary text-white px-4 py-2 rounded-xl shadow-primary flex items-center gap-2 text-xs font-semibold hover:bg-primary-dark transition-colors"
        >
          <FlaskConical className="w-3.5 h-3.5" />
          Demo Mode
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
