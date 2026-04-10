// ============================================================
// Rakshak AI - Settings Page
// Profile, Security, Device Management
// ============================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Shield, Bell, Key, Smartphone, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import TrustScoreGauge from '../components/dashboard/TrustScoreGauge';
import { getTrustScoreInfo } from '../utils/formatters';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const trustInfo = getTrustScoreInfo(user?.trustScore || 50);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'devices', label: 'Devices', icon: Smartphone },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <div className="mb-8">
          <p className="text-dark/50 text-xs font-semibold uppercase tracking-widest mb-1">Account</p>
          <h1 className="text-4xl font-black text-dark">Settings</h1>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {/* Sidebar tabs */}
          <div className="col-span-1 space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === id
                    ? 'bg-primary text-white'
                    : 'text-dark/60 hover:bg-cream-dark/30 hover:text-dark'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'profile' && (
                <div className="space-y-4">
                  {/* User profile card */}
                  <div className="card p-6">
                    <div className="flex items-center gap-5 mb-6">
                      <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white text-xl font-black">
                        {user?.avatar || 'AS'}
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-dark">{user?.name}</h3>
                        <p className="text-dark/50 text-sm">{user?.email}</p>
                        <span className={`text-xs font-bold mt-1 inline-block ${trustInfo.textColor}`}>
                          {user?.trustStatus}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-dark/50 uppercase font-bold tracking-wider mb-1.5">Full Name</label>
                        <input defaultValue={user?.name} className="input-field" />
                      </div>
                      <div>
                        <label className="block text-xs text-dark/50 uppercase font-bold tracking-wider mb-1.5">Phone Number</label>
                        <input defaultValue={user?.phone} className="input-field" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs text-dark/50 uppercase font-bold tracking-wider mb-1.5">Email Address</label>
                        <input defaultValue={user?.email} type="email" className="input-field" disabled />
                      </div>
                    </div>

                    <button
                      onClick={() => toast.success('Profile saved successfully')}
                      className="btn-primary mt-6 text-sm px-6 py-3"
                    >
                      Save Changes
                    </button>
                  </div>

                  {/* Trust Score */}
                  <div className="card-primary p-6 flex items-center justify-between">
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Your Trust Score</p>
                      <p className="text-white text-2xl font-black">{user?.trustScore}/100</p>
                      <p className="text-white/60 text-sm mt-1">{user?.trustStatus}</p>
                    </div>
                    <TrustScoreGauge score={user?.trustScore || 50} status={user?.trustStatus || 'MODERATE'} small />
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-4">
                  <div className="card p-6">
                    <h3 className="font-black text-dark mb-4">Security Settings</h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Two-Factor Authentication', desc: 'Add an extra layer of security', value: true },
                        { label: 'Biometric Login', desc: 'Allow fingerprint authentication', value: true },
                        { label: 'Transaction Alerts', desc: 'Get notified for every transaction', value: true },
                        { label: 'New Device Alerts', desc: 'Alert when new device signs in', value: true },
                      ].map(({ label, desc, value }) => (
                        <div key={label} className="flex items-center justify-between py-3 border-b border-cream last:border-0">
                          <div>
                            <p className="text-sm font-semibold text-dark">{label}</p>
                            <p className="text-xs text-dark/50 mt-0.5">{desc}</p>
                          </div>
                          <div className={`w-12 h-6 rounded-full transition-colors ${value ? 'bg-green-500' : 'bg-gray-200'} relative cursor-pointer`}>
                            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-0.5'}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card p-6">
                    <h3 className="font-black text-dark mb-1">Change Security Token</h3>
                    <p className="text-sm text-dark/50 mb-4">Use a strong token with at least 8 characters</p>
                    <div className="space-y-3">
                      <input type="password" placeholder="Current token" className="input-field" />
                      <input type="password" placeholder="New token" className="input-field" />
                      <input type="password" placeholder="Confirm new token" className="input-field" />
                    </div>
                    <button
                      onClick={() => toast.success('Security token updated')}
                      className="btn-primary mt-4 text-sm"
                    >
                      Update Token
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'devices' && (
                <div className="card p-6">
                  <h3 className="font-black text-dark mb-4">Registered Devices</h3>
                  <div className="space-y-3">
                    {(user?.devices || []).map((device, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-cream-light rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Smartphone className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-dark">{device.platform || 'Unknown Device'}</p>
                            <p className="text-xs text-dark/50">{device.screenResolution || 'Unknown Resolution'}</p>
                            <p className="text-xs text-dark/40 mt-0.5">
                              First seen: {device.firstSeen ? new Date(device.firstSeen).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {device.trusted ? (
                            <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-lg">Trusted</span>
                          ) : (
                            <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-lg">Pending</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {(!user?.devices || user.devices.length === 0) && (
                      <p className="text-dark/40 text-sm text-center py-8">No registered devices.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="card p-6">
                  <h3 className="font-black text-dark mb-4">Notification Preferences</h3>
                  <div className="space-y-3">
                    {[
                      'Transaction approved',
                      'Transaction blocked',
                      'Transaction under review',
                      'New device login',
                      'Trust score change',
                      'Weekly security report',
                    ].map(item => (
                      <div key={item} className="flex items-center justify-between py-3 border-b border-cream last:border-0">
                        <p className="text-sm font-medium text-dark">{item}</p>
                        <div className="w-12 h-6 rounded-full bg-primary relative cursor-pointer">
                          <div className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-white shadow" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => toast.success('Notification preferences saved')}
                    className="btn-primary mt-4 text-sm"
                  >
                    Save Preferences
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
