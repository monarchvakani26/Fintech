// ============================================================
// Rakshak AI - Sidebar Component
// Navigation with active states matching design images
// ============================================================

import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, CreditCard, Shield, ScrollText,
  Settings, HelpCircle, LogOut, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
  { to: '/payments', label: 'PAYMENTS', icon: CreditCard },
  { to: '/security-hub', label: 'SECURITY HUB', icon: Shield },
  { to: '/audit', label: 'AUDIT TRAIL', icon: ScrollText },
  { to: '/settings', label: 'SETTINGS', icon: Settings },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out of Sovereign Archive');
    navigate('/login');
  };

  return (
    <aside className="w-52 min-h-screen bg-cream flex flex-col border-r border-cream-dark/20">
      {/* Logo */}
      <div className="px-5 pt-7 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-primary" strokeWidth={2.5} />
          <span className="text-primary font-black text-lg tracking-tight">RAKSHAK AI</span>
        </div>
        <p className="text-dark/40 text-xs font-medium uppercase tracking-wider">THE SOVEREIGN ARCHIVE</p>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-dark/50 hover:text-dark hover:bg-cream-dark/30'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Items */}
      <div className="px-3 pb-6 space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-dark/50 hover:text-dark hover:bg-cream-dark/30 transition-all duration-200">
          <HelpCircle className="w-4 h-4" strokeWidth={2} />
          <span>SUPPORT</span>
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-dark/50 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" strokeWidth={2} />
          <span>LOGOUT</span>
        </button>
      </div>
    </aside>
  );
}
