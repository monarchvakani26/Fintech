// ============================================================
// Rakshak AI - Payments Page
// + Real-time risk preview as user types
// ============================================================

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, BookOpen, Shield, ArrowRight, AtSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout';
import { generateDeviceFingerprint, collectDeviceSignals } from '../utils/deviceFingerprint';
import api from '../services/api';

function formatAmountInput(value) {
  const nums = value.replace(/[^\d.]/g, '');
  const parts = nums.split('.');
  if (parts.length > 2) return value.slice(0, -1);
  if (parts[1]?.length > 2) return value.slice(0, -1);
  return nums;
}

export default function Payments() {
  const [vpa, setVpa] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [vpaError, setVpaError] = useState('');
  const [previewRisk, setPreviewRisk] = useState(null);
  const navigate = useNavigate();

  const validateVPA = (value) => {
    if (!value) return 'Recipient VPA is required';
    if (!value.includes('@')) return 'Must be a valid UPI ID (e.g. name@bank)';
    return '';
  };

  const handleVpaChange = (e) => {
    setVpa(e.target.value);
    if (vpaError) setVpaError(validateVPA(e.target.value));
  };

  const handleAmountChange = (e) => {
    const formatted = formatAmountInput(e.target.value);
    setAmount(formatted);
  };

  // Real-time client-side risk preview
  useEffect(() => {
    const numAmount = parseFloat(amount) || 0;
    if (numAmount <= 0) { setPreviewRisk(null); return; }

    let score = 0;
    if (numAmount <= 10000) score = 5;
    else if (numAmount <= 50000) score = 15;
    else if (numAmount <= 100000) score = 30;
    else score = 50;

    // Add VPA risk
    if (vpa && !vpa.includes('@')) score += 5;

    setPreviewRisk(score);
  }, [amount, vpa]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const vpaErr = validateVPA(vpa);
    if (vpaErr) { setVpaError(vpaErr); return; }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const fingerprint = generateDeviceFingerprint();
      const signals = collectDeviceSignals();

      const initiateRes = await api.post('/payments/initiate', {
        recipientVPA: vpa,
        amount: parseFloat(amount),
        note,
        deviceFingerprint: fingerprint,
      });

      if (!initiateRes.data.success) throw new Error(initiateRes.data.message);

      const { transactionId } = initiateRes.data;
      toast.success('Transaction initiated — running AI analysis...', { icon: '🛡️' });

      navigate(`/payments/analyze/${transactionId}`, {
        state: {
          transactionId,
          amount: parseFloat(amount),
          recipientVPA: vpa,
          note,
          deviceFingerprint: fingerprint,
          deviceSignals: signals,
          isDemo: false,
        },
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to initiate payment';
      toast.error(msg);
      setLoading(false);
    }
  };

  const riskColor = previewRisk === null ? '' :
    previewRisk <= 20 ? 'text-green-600' :
    previewRisk <= 40 ? 'text-orange-500' : 'text-red-600';

  const riskDotColor = previewRisk === null ? '' :
    previewRisk <= 20 ? 'bg-green-500' :
    previewRisk <= 40 ? 'bg-orange-400' : 'bg-red-500';

  const riskLabel = previewRisk === null ? '' :
    previewRisk <= 20 ? 'LOW RISK' :
    previewRisk <= 40 ? 'MODERATE RISK' : 'HIGH RISK — full AI analysis runs on submit';

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <div className="grid grid-cols-2 gap-10 items-start">
          {/* ====== LEFT: Branding ====== */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 bg-green-100 border border-green-200 text-green-700 rounded-full px-4 py-1.5 text-xs font-semibold mb-6">
              <Shield className="w-3.5 h-3.5" />
              SECURE PROTOCOL 2.4
            </div>

            <h1 className="text-4xl font-black text-dark leading-tight mb-4">
              The Sovereign<br />Checkout<br />Experience
            </h1>

            <p className="text-dark/60 text-sm leading-relaxed mb-8">
              Execute secure transactions with Rakshak AI's proprietary encryption layer.
              Your data is protected by high-end financial broadsheet security.
            </p>

            <div className="space-y-4">
              <div className="card-cream p-4 flex items-start gap-4">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-dark text-sm uppercase tracking-wider">Encrypted Gateway</p>
                  <p className="text-dark/50 text-sm mt-1">256-bit AES encryption applied to all outgoing payment packets.</p>
                </div>
              </div>

              <div className="card-cream p-4 flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-dark text-sm uppercase tracking-wider">Audit Ledger</p>
                  <p className="text-dark/50 text-sm mt-1">Every payment is recorded in your personal immutable audit trail.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ====== RIGHT: Payment Form ====== */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black text-dark">Initiate Payment</h2>
                <div className="w-8 h-8 bg-cream-light rounded-lg flex items-center justify-center">
                  <Lock className="w-4 h-4 text-dark/40" />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Recipient VPA */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-dark/50 mb-2">
                    Recipient VPA (UPI ID)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={vpa}
                      onChange={handleVpaChange}
                      placeholder="example@okaxis"
                      className={`input-field pr-10 ${vpaError ? 'border-red-400' : ''}`}
                    />
                    <AtSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark/30" />
                  </div>
                  {vpaError && <p className="text-red-500 text-xs mt-1">{vpaError}</p>}
                  {vpa.includes('@') && !vpaError && (
                    <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Valid UPI format
                    </p>
                  )}
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-dark/50 mb-2">
                    Transfer Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark/50 font-bold text-sm">₹</span>
                    <input
                      type="text"
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder="0.00"
                      className="input-field pl-8 text-xl font-bold"
                    />
                  </div>
                  {/* Real-time risk preview */}
                  {previewRisk !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-center gap-2 text-xs font-semibold mt-2 ${riskColor}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${riskDotColor}`} />
                      Preliminary Risk Preview: {riskLabel}
                    </motion.div>
                  )}
                </div>

                {/* Note */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-dark/50 mb-2">
                    Internal Note (Optional)
                  </label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Reference for ledger..."
                    rows={3}
                    className="input-field resize-none"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-4 text-sm uppercase tracking-widest flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Initiating...
                    </>
                  ) : (
                    <>
                      Pay Now
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-3 text-xs text-dark/30 mt-2">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  <span>|</span>
                  <Shield className="w-3.5 h-3.5" />
                  <span className="uppercase tracking-wider font-semibold">PCI-DSS Compliant</span>
                </div>
              </form>
            </div>

            <div className="flex items-center justify-between mt-4 px-2">
              <span className="text-xs text-dark/50 font-semibold uppercase tracking-wider">Transaction Fee</span>
              <span className="text-xs font-bold text-primary">₹0.00 (Waived)</span>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
