// ============================================================
// Rakshak AI — Financial Details Form
// Card last 4, card type, bank name, avg balance
// ============================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Building2, Wallet, CheckCircle, AlertTriangle } from 'lucide-react';

const CARD_TYPES = ['VISA', 'MASTERCARD', 'AMEX', 'RUPAY', 'DISCOVER'];
const BANKS = [
  'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank',
  'Kotak Mahindra Bank', 'Punjab National Bank', 'Bank of Baroda',
  'IndusInd Bank', 'Yes Bank', 'Other',
];

export default function FinancialForm({ data, onChange, disabled }) {
  const [touched, setTouched] = useState({});

  const handleChange = (field, value) => {
    if (field === 'card_last4') {
      value = value.replace(/\D/g, '').slice(0, 4);
    }
    if (field === 'avg_balance') {
      value = value === '' ? '' : Math.max(0, Number(value));
    }
    onChange({ ...data, [field]: value });
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const isValidCard = (v) => !v || /^\d{4}$/.test(v);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
          <CreditCard className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Financial Details</h3>
          <p className="text-sm text-white/50">Payment & banking information</p>
        </div>
      </div>

      {/* Card Last 4 */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0 }}>
        <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
          <CreditCard className="w-4 h-4" />
          Card Last 4 Digits
          <span className="text-red-400">*</span>
          {touched.card_last4 && isValidCard(data.card_last4) && data.card_last4?.length === 4 && (
            <CheckCircle className="w-4 h-4 text-emerald-400 ml-auto" />
          )}
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={data.card_last4 || ''}
            onChange={(e) => handleChange('card_last4', e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, card_last4: true }))}
            placeholder="4321"
            disabled={disabled}
            className={`
              w-full px-4 py-3 rounded-xl text-sm font-mono font-bold tracking-[0.3em] text-center
              bg-white/5 backdrop-blur-sm border transition-all duration-300
              text-white placeholder-white/30
              focus:outline-none focus:ring-2
              ${touched.card_last4 && data.card_last4 && !isValidCard(data.card_last4)
                ? 'border-red-500/50 focus:ring-red-500/30'
                : 'border-white/10 focus:ring-emerald-500/30 focus:border-emerald-500/50 hover:border-white/20'
              }
              disabled:opacity-40
            `}
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex gap-1 pointer-events-none">
            {[0, 1, 2].map(i => (
              <span key={i} className="text-white/20 text-xs font-bold tracking-wider">••••</span>
            ))}
          </div>
        </div>
        {touched.card_last4 && data.card_last4 && data.card_last4.length !== 4 && (
          <p className="text-xs text-amber-400 mt-1.5 ml-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Must be exactly 4 digits
          </p>
        )}
      </motion.div>

      {/* Card Type */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
        <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
          <CreditCard className="w-4 h-4" />
          Card Type
          <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {CARD_TYPES.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => handleChange('card_type', type)}
              disabled={disabled}
              className={`
                px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider
                border transition-all duration-300
                ${data.card_type === type
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-500/10'
                  : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white/70'
                }
                disabled:opacity-40
              `}
            >
              {type}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Bank Name */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
        <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
          <Building2 className="w-4 h-4" />
          Bank Name
          <span className="text-red-400">*</span>
        </label>
        <select
          value={data.bank_name || ''}
          onChange={(e) => handleChange('bank_name', e.target.value)}
          disabled={disabled}
          className="
            w-full px-4 py-3 rounded-xl text-sm font-medium
            bg-white/5 backdrop-blur-sm border border-white/10
            text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50
            hover:border-white/20 transition-all duration-300
            disabled:opacity-40 appearance-none cursor-pointer
          "
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.3)' stroke-width='2'%3E%3Cpath d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
        >
          <option value="" className="bg-gray-900">Select bank...</option>
          {BANKS.map(bank => (
            <option key={bank} value={bank} className="bg-gray-900">{bank}</option>
          ))}
        </select>
      </motion.div>

      {/* Average Balance */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
        <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
          <Wallet className="w-4 h-4" />
          Average Balance (₹)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">₹</span>
          <input
            type="number"
            value={data.avg_balance ?? ''}
            onChange={(e) => handleChange('avg_balance', e.target.value)}
            placeholder="50,000"
            disabled={disabled}
            min={0}
            className="
              w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium font-mono-nums
              bg-white/5 backdrop-blur-sm border border-white/10
              text-white placeholder-white/30
              focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50
              hover:border-white/20 transition-all duration-300
              disabled:opacity-40
            "
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
