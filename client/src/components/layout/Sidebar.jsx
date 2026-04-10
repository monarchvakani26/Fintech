// ============================================================
// Rakshak AI - Sidebar Component
// Collapsible navigation with icon-only collapsed mode
// ============================================================

import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, CreditCard, Shield, ScrollText,
  Settings, HelpCircle, LogOut, ShieldCheck, Link2,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
  { to: '/payments', label: 'PAYMENTS', icon: CreditCard },
  { to: '/security-hub', label: 'SECURITY HUB', icon: Shield },
  { to: '/blockchain', label: 'BLOCKCHAIN', icon: Link2 },
  { to: '/audit', label: 'AUDIT TRAIL', icon: ScrollText },
  { to: '/settings', label: 'SETTINGS', icon: Settings },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out of Sovereign Archive');
    navigate('/login');
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 208 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="min-h-screen bg-cream flex flex-col border-r border-cream-dark/20 relative flex-shrink-0 overflow-hidden"
    >
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-8 z-30 w-6 h-6 bg-white border border-cream-dark/30 rounded-full flex items-center justify-center shadow-sm hover:bg-cream transition-colors"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed
          ? <ChevronRight className="w-3 h-3 text-dark/50" />
          : <ChevronLeft className="w-3 h-3 text-dark/50" />
        }
      </button>

      {/* Logo */}
      <div className="px-4 pt-7 pb-6 overflow-hidden">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" strokeWidth={2.5} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="text-primary font-black text-lg tracking-tight whitespace-nowrap overflow-hidden"
              >
                RAKSHAK AI
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-dark/40 text-xs font-medium uppercase tracking-wider whitespace-nowrap"
            >
              THE SOVEREIGN ARCHIVE
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-2 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : ''}
            className={({ isActive }) =>
              `relative flex items-center gap-3 rounded-lg transition-all duration-200 group ${
                collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5'
              } ${
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-dark/50 hover:text-dark hover:bg-cream-dark/30'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary' : ''}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-xs font-semibold uppercase tracking-wider whitespace-nowrap overflow-hidden"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {/* Collapsed tooltip */}
                {collapsed && (
                  <span className="absolute left-full ml-2 px-2 py-1 bg-dark text-white text-xs font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                    {label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Items */}
      <div className="px-2 pb-6 space-y-1">
        <button
          title={collapsed ? 'SUPPORT' : ''}
          className={`relative w-full flex items-center gap-3 rounded-lg text-dark/50 hover:text-dark hover:bg-cream-dark/30 transition-all duration-200 group ${
            collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5'
          }`}
        >
          <HelpCircle className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="text-xs font-semibold uppercase tracking-wider whitespace-nowrap overflow-hidden"
              >
                SUPPORT
              </motion.span>
            )}
          </AnimatePresence>
          {collapsed && (
            <span className="absolute left-full ml-2 px-2 py-1 bg-dark text-white text-xs font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
              SUPPORT
            </span>
          )}
        </button>

        <button
          onClick={handleLogout}
          title={collapsed ? 'LOGOUT' : ''}
          className={`relative w-full flex items-center gap-3 rounded-lg text-dark/50 hover:text-red-600 hover:bg-red-50 transition-all duration-200 group ${
            collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5'
          }`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="text-xs font-semibold uppercase tracking-wider whitespace-nowrap overflow-hidden"
              >
                LOGOUT
              </motion.span>
            )}
          </AnimatePresence>
          {collapsed && (
            <span className="absolute left-full ml-2 px-2 py-1 bg-dark text-white text-xs font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
              LOGOUT
            </span>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
