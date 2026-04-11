// ============================================================
// Rakshak AI - Sidebar Component
// Collapsible navigation with icon-only collapsed mode
// ============================================================

import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, CreditCard, Shield, ScrollText,
  Settings, HelpCircle, LogOut, ShieldCheck, Link2,
  ChevronLeft, ChevronRight, ClipboardList,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
  { to: '/data-collection', label: 'DATA COLLECTION', icon: ClipboardList },
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

  // Shared classes for bottom action buttons
  const actionBtnClass = `relative w-full flex items-center gap-3 rounded-xl transition-all duration-200 group ${
    collapsed ? 'px-0 py-2 justify-center' : 'px-3 py-2'
  }`;

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 228 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="h-screen sticky top-0 bg-[#f7f0e0] flex flex-col border-r-2 border-[#d5c8a5] relative flex-shrink-0 overflow-hidden"
      style={{ boxShadow: '3px 0 18px 0 rgba(0,0,0,0.06)' }}
    >
      {/* Logo */}
      <div className={`pt-6 pb-5 border-b border-[#ddd0b0]/60 flex-shrink-0 ${collapsed ? 'px-0 flex flex-col items-center' : 'px-5'}`}>
        <div className={`flex items-center gap-2.5 mb-0.5 ${collapsed ? 'justify-center' : ''}`}>
          <ShieldCheck className="w-6 h-6 text-primary flex-shrink-0" strokeWidth={2.5} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="text-primary font-black text-base tracking-tight whitespace-nowrap overflow-hidden"
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
              className="text-dark/35 text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap pl-0.5"
            >
              The Sovereign Archive
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-2.5 pt-3 pb-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : ''}
            className={({ isActive }) =>
              `relative flex items-center gap-3 rounded-xl transition-all duration-200 group overflow-hidden ${
                collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5'
              } ${
                isActive
                  ? 'text-primary bg-primary/10 font-semibold'
                  : 'text-dark/50 hover:text-dark hover:bg-black/[0.04]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && !collapsed && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-primary rounded-r-full" />
                )}
                <Icon
                  className={`w-[17px] h-[17px] flex-shrink-0 ${isActive ? 'text-primary' : 'text-dark/40'}`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap overflow-hidden"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {collapsed && (
                  <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-dark text-white text-[11px] font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                    {label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Control Section — Collapse toggle + Support + Logout */}
      <div className="flex-shrink-0 border-t border-[#ddd0b0]/60 bg-[#f2ebd8] px-2.5 pt-2.5 pb-3 space-y-0.5">
        {/* Collapse / Expand */}
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`${actionBtnClass} text-dark/40 hover:text-primary hover:bg-primary/[0.06]`}
        >
          {collapsed
            ? <ChevronRight className="w-[17px] h-[17px] flex-shrink-0" strokeWidth={2} />
            : <ChevronLeft className="w-[17px] h-[17px] flex-shrink-0" strokeWidth={2} />
          }
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap overflow-hidden"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
          {collapsed && (
            <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-dark text-white text-[11px] font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
              EXPAND
            </span>
          )}
        </button>

        {/* Support */}
        <button
          title={collapsed ? 'SUPPORT' : ''}
          className={`${actionBtnClass} text-dark/40 hover:text-dark hover:bg-black/[0.04]`}
        >
          <HelpCircle className="w-[17px] h-[17px] flex-shrink-0" strokeWidth={1.8} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap overflow-hidden"
              >
                Support
              </motion.span>
            )}
          </AnimatePresence>
          {collapsed && (
            <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-dark text-white text-[11px] font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
              SUPPORT
            </span>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title={collapsed ? 'LOGOUT' : ''}
          className={`${actionBtnClass} text-dark/40 hover:text-red-600 hover:bg-red-50`}
        >
          <LogOut className="w-[17px] h-[17px] flex-shrink-0" strokeWidth={1.8} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap overflow-hidden"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
          {collapsed && (
            <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-dark text-white text-[11px] font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
              LOGOUT
            </span>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
