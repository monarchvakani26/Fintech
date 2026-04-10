// ============================================================
// Rakshak AI - Settings Page
// Profile, Security, Device Management
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Shield, Bell, Smartphone, ChevronRight,
  Lock, Eye, EyeOff, CheckCircle, AlertCircle,
  Fingerprint, BellRing, Monitor, Trash2, Mail,
  Phone, Camera,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import TrustScoreGauge from '../components/dashboard/TrustScoreGauge';
import { getTrustScoreInfo } from '../utils/formatters';

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-primary' : 'bg-cream-dark'
      }`}
    >
      <motion.div
        animate={{ x: checked ? 24 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
      />
    </button>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const trustInfo = getTrustScoreInfo(user?.trustScore || 50);

  // Security toggles state
  const [securityToggles, setSecurityToggles] = useState({
    twoFactor: true,
    biometric: true,
    txnAlerts: true,
    deviceAlerts: true,
  });

  // Notification toggles state
  const [notifToggles, setNotifToggles] = useState({
    approved: true,
    blocked: true,
    review: true,
    deviceLogin: true,
    trustScore: false,
    weeklyReport: false,
  });

  // Password visibility
  const [showPass, setShowPass] = useState({ current: false, newp: false, confirm: false });

  const toggleSecurity = (key) =>
    setSecurityToggles(s => ({ ...s, [key]: !s[key] }));
  const toggleNotif = (key) =>
    setNotifToggles(s => ({ ...s, [key]: !s[key] }));

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User, desc: 'Account info' },
    { id: 'security', label: 'Security', icon: Shield, desc: 'Auth & tokens' },
    { id: 'devices', label: 'Devices', icon: Smartphone, desc: 'Trusted devices' },
    { id: 'notifications', label: 'Alerts', icon: Bell, desc: 'Notifications' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        {/* Page Header */}
        <div className="mb-8">
          <p className="text-dark/50 text-xs font-semibold uppercase tracking-widest mb-1">Account</p>
          <h1 className="text-4xl font-black text-dark">Settings</h1>
        </div>

        <div className="flex gap-6">
          {/* Left Tab Nav */}
          <div className="w-52 flex-shrink-0 space-y-2">
            {/* User card */}
            <div className="card p-4 mb-4 text-center">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white text-xl font-black mx-auto mb-3 shadow-md">
                {user?.avatar || user?.name?.substring(0, 2)?.toUpperCase() || 'AS'}
              </div>
              <p className="font-black text-dark text-sm leading-tight">{user?.name}</p>
              <p className="text-dark/40 text-xs mt-0.5 truncate">{user?.email}</p>
              <span
                className={`text-xs font-bold mt-2 inline-block px-2 py-0.5 rounded-md ${trustInfo.bgColor} ${trustInfo.textColor}`}
              >
                {user?.trustStatus}
              </span>
            </div>

            {tabs.map(({ id, label, icon: Icon, desc }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                  activeTab === id
                    ? 'bg-primary text-white shadow-md'
                    : 'text-dark/60 hover:bg-cream-dark/40 hover:text-dark'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  activeTab === id ? 'bg-white/20' : 'bg-cream-light group-hover:bg-cream-dark/20'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold leading-tight">{label}</p>
                  <p className={`text-xs ${activeTab === id ? 'text-white/60' : 'text-dark/40'}`}>{desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Content Panel */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >

                {/* ── PROFILE ── */}
                {activeTab === 'profile' && (
                  <div className="space-y-5">
                    <div className="card p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-black text-dark text-base">Personal Information</h3>
                          <p className="text-xs text-dark/40">Update your name and contact details</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-dark/50 uppercase font-bold tracking-wider mb-1.5">Full Name</label>
                          <input defaultValue={user?.name} className="input-field" />
                        </div>
                        <div>
                          <label className="block text-xs text-dark/50 uppercase font-bold tracking-wider mb-1.5">
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> Phone Number</span>
                          </label>
                          <input defaultValue={user?.phone} className="input-field" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs text-dark/50 uppercase font-bold tracking-wider mb-1.5">
                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> Email Address</span>
                          </label>
                          <div className="relative">
                            <input defaultValue={user?.email} type="email" className="input-field pr-24" disabled />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-md">Verified</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => toast.success('Profile saved successfully')}
                        className="btn-primary mt-6 text-sm px-6 py-2.5"
                      >
                        Save Changes
                      </button>
                    </div>

                    {/* Trust Score Card */}
                    <div
                      className="card p-6 flex items-center justify-between overflow-hidden relative"
                      style={{ background: 'linear-gradient(135deg, #722f37 0%, #5a1f26 100%)' }}
                    >
                      <div className="absolute inset-0 opacity-5"
                        style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)', backgroundSize: '12px 12px' }}
                      />
                      <div className="relative z-10">
                        <p className="text-white/50 text-xs uppercase tracking-wider mb-1 font-semibold">Your Trust Score</p>
                        <p className="text-white text-4xl font-black tabular-nums">{user?.trustScore}<span className="text-white/40 text-2xl">/100</span></p>
                        <span className={`text-xs font-bold mt-2 inline-block px-2 py-0.5 rounded-md ${trustInfo.bgColor} ${trustInfo.textColor}`}>
                          {user?.trustStatus}
                        </span>
                      </div>
                      <div className="relative z-10">
                        <TrustScoreGauge score={user?.trustScore || 50} status={user?.trustStatus || 'MODERATE'} small />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── SECURITY ── */}
                {activeTab === 'security' && (
                  <div className="space-y-5">
                    {/* Toggles */}
                    <div className="card p-6">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                          <Shield className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-black text-dark text-base">Security Controls</h3>
                          <p className="text-xs text-dark/40">Manage authentication and alerts</p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        {[
                          { key: 'twoFactor', icon: Shield, label: 'Two-Factor Authentication', desc: 'Require OTP on every sign-in' },
                          { key: 'biometric', icon: Fingerprint, label: 'Biometric Login', desc: 'Allow fingerprint authentication' },
                          { key: 'txnAlerts', icon: BellRing, label: 'Transaction Alerts', desc: 'Get notified for every transaction' },
                          { key: 'deviceAlerts', icon: Monitor, label: 'New Device Alerts', desc: 'Alert when a new device signs in' },
                        ].map(({ key, icon: Icon, label, desc }) => (
                          <div key={key} className="flex items-center justify-between py-3.5 px-4 rounded-xl hover:bg-cream-light/60 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${securityToggles[key] ? 'bg-primary/10' : 'bg-cream-dark/30'}`}>
                                <Icon className={`w-4 h-4 ${securityToggles[key] ? 'text-primary' : 'text-dark/30'}`} />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-dark">{label}</p>
                                <p className="text-xs text-dark/40 mt-0.5">{desc}</p>
                              </div>
                            </div>
                            <Toggle checked={securityToggles[key]} onChange={() => toggleSecurity(key)} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Change Token */}
                    <div className="card p-6">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
                          <Lock className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                          <h3 className="font-black text-dark text-base">Change Security Token</h3>
                          <p className="text-xs text-dark/40">Use a strong token with at least 8 characters</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {[
                          { key: 'current', label: 'Current Token', placeholder: 'Enter current token' },
                          { key: 'newp', label: 'New Token', placeholder: 'Enter new token' },
                          { key: 'confirm', label: 'Confirm New Token', placeholder: 'Confirm new token' },
                        ].map(({ key, label, placeholder }) => (
                          <div key={key}>
                            <label className="block text-xs text-dark/50 uppercase font-bold tracking-wider mb-1.5">{label}</label>
                            <div className="relative">
                              <input
                                type={showPass[key] ? 'text' : 'password'}
                                placeholder={placeholder}
                                className="input-field pr-10"
                              />
                              <button
                                onClick={() => setShowPass(s => ({ ...s, [key]: !s[key] }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/30 hover:text-dark transition-colors"
                              >
                                {showPass[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => toast.success('Security token updated')}
                        className="btn-primary mt-5 text-sm px-6 py-2.5"
                      >
                        Update Token
                      </button>
                    </div>
                  </div>
                )}

                {/* ── DEVICES ── */}
                {activeTab === 'devices' && (
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-black text-dark text-base">Registered Devices</h3>
                          <p className="text-xs text-dark/40">{(user?.devices || []).length} device{(user?.devices || []).length !== 1 ? 's' : ''} linked to your account</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {(user?.devices || []).map((device, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center justify-between p-4 bg-cream-light rounded-2xl border border-cream-dark/20 hover:border-primary/20 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Monitor className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-dark">{device.platform || 'Unknown Device'}</p>
                              <p className="text-xs text-dark/50 mt-0.5">{device.screenResolution || 'Unknown Resolution'}</p>
                              <p className="text-xs text-dark/30 mt-0.5">
                                First seen: {device.firstSeen
                                  ? new Date(device.firstSeen).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
                                  : 'Unknown'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {device.trusted ? (
                              <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-lg">
                                <CheckCircle className="w-3 h-3" /> Trusted
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs font-bold text-orange-700 bg-orange-100 px-2.5 py-1 rounded-lg">
                                <AlertCircle className="w-3 h-3" /> Pending
                              </span>
                            )}
                            <button
                              onClick={() => toast.error('Device removal requires verification')}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-dark/20 hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Remove device"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                      {(!user?.devices || user.devices.length === 0) && (
                        <div className="text-center py-12">
                          <Smartphone className="w-12 h-12 text-dark/15 mx-auto mb-3" />
                          <p className="text-dark/40 font-medium text-sm">No registered devices</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── NOTIFICATIONS ── */}
                {activeTab === 'notifications' && (
                  <div className="card p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Bell className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-black text-dark text-base">Notification Preferences</h3>
                        <p className="text-xs text-dark/40">Choose what alerts you want to receive</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {[
                        { key: 'approved', label: 'Transaction Approved', desc: 'When a payment is cleared', color: 'text-green-600 bg-green-100' },
                        { key: 'blocked', label: 'Transaction Blocked', desc: 'When a payment is denied', color: 'text-red-600 bg-red-100' },
                        { key: 'review', label: 'Under Review', desc: 'When a payment needs review', color: 'text-orange-600 bg-orange-100' },
                        { key: 'deviceLogin', label: 'New Device Login', desc: 'When signing in from a new device', color: 'text-blue-600 bg-blue-100' },
                        { key: 'trustScore', label: 'Trust Score Change', desc: 'When your trust score updates', color: 'text-purple-600 bg-purple-100' },
                        { key: 'weeklyReport', label: 'Weekly Security Report', desc: 'Summary of weekly activity', color: 'text-dark/60 bg-cream-dark/30' },
                      ].map(({ key, label, desc, color }) => (
                        <div key={key} className="flex items-center justify-between py-3.5 px-4 rounded-xl hover:bg-cream-light/60 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${color.split(' ')[1]}`}>
                              <div className={`w-2 h-2 rounded-full ${color.split(' ')[0].replace('text', 'bg')}`} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-dark">{label}</p>
                              <p className="text-xs text-dark/40 mt-0.5">{desc}</p>
                            </div>
                          </div>
                          <Toggle checked={notifToggles[key]} onChange={() => toggleNotif(key)} />
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 pt-5 border-t border-cream-dark/20 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setNotifToggles(Object.fromEntries(Object.keys(notifToggles).map(k => [k, true])));
                          toast.success('All notifications enabled');
                        }}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Enable all
                      </button>
                      <button
                        onClick={() => toast.success('Notification preferences saved')}
                        className="btn-primary text-sm px-6 py-2.5"
                      >
                        Save Preferences
                      </button>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
