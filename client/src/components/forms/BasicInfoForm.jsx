// ============================================================
// Rakshak AI — Basic Info Form
// Collects name, email, phone
// ============================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, CheckCircle } from 'lucide-react';

export default function BasicInfoForm({ data, onChange, disabled }) {
  const [touched, setTouched] = useState({});

  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone) => !phone || /^\+?[\d\s\-]{7,20}$/.test(phone);

  const fields = [
    {
      key: 'name',
      label: 'Full Name',
      icon: User,
      type: 'text',
      placeholder: 'Arjun Sharma',
      required: true,
      valid: data.name?.length >= 2,
    },
    {
      key: 'email',
      label: 'Email Address',
      icon: Mail,
      type: 'email',
      placeholder: 'arjun@rakshak.ai',
      required: true,
      valid: isValidEmail(data.email || ''),
    },
    {
      key: 'phone',
      label: 'Phone Number',
      icon: Phone,
      type: 'tel',
      placeholder: '+91 98765 43210',
      required: false,
      valid: isValidPhone(data.phone || ''),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
          <User className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Basic Information</h3>
          <p className="text-sm text-white/50">Personal identity details</p>
        </div>
      </div>

      {fields.map((field, idx) => {
        const Icon = field.icon;
        const hasError = touched[field.key] && field.required && !field.valid;

        return (
          <motion.div
            key={field.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
              <Icon className="w-4 h-4" />
              {field.label}
              {field.required && <span className="text-red-400">*</span>}
              {touched[field.key] && field.valid && (
                <CheckCircle className="w-4 h-4 text-emerald-400 ml-auto" />
              )}
            </label>
            <input
              type={field.type}
              value={data[field.key] || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, [field.key]: true }))}
              placeholder={field.placeholder}
              disabled={disabled}
              className={`
                w-full px-4 py-3 rounded-xl text-sm font-medium
                bg-white/5 backdrop-blur-sm border transition-all duration-300
                text-white placeholder-white/30
                focus:outline-none focus:ring-2
                ${hasError
                  ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500'
                  : 'border-white/10 focus:ring-blue-500/30 focus:border-blue-500/50 hover:border-white/20'
                }
                disabled:opacity-40 disabled:cursor-not-allowed
              `}
            />
            {hasError && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-xs text-red-400 mt-1.5 ml-1"
              >
                {field.key === 'email' ? 'Please enter a valid email' : `${field.label} is required`}
              </motion.p>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
