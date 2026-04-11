// ============================================================
// Rakshak AI - Header Component
// Top navigation bar with tabs, notifications, user avatar
// ============================================================

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const headerTabs = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/payments', label: 'Payments' },
  { to: '/audit', label: 'Audit' },
  { to: '/security-hub', label: 'Fraud Check' },
];

export default function Header() {
  const location = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b-2 border-[#d9c9a8] px-6 py-0 flex items-center sticky top-0 z-20 h-14 flex-shrink-0">
      {/* Left spacer — mirrors right side width so tabs stay centered */}
      <div className="w-32 flex-shrink-0" />

      {/* Tabs — centered */}
      <nav className="flex-1 flex items-center justify-center gap-1 h-full">
        {headerTabs.map(({ to, label }) => {
          const isActive = location.pathname === to ||
            (to === '/payments' && location.pathname.startsWith('/payments'));
          return (
            <Link
              key={to}
              to={to}
              className={`relative px-5 h-14 flex items-center text-sm font-semibold transition-colors duration-200 ${
                isActive
                  ? 'text-primary'
                  : 'text-dark/45 hover:text-dark'
              }`}
            >
              {label}
              {isActive && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-t-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Right Side */}
      <div className="w-32 flex-shrink-0 flex items-center gap-2 justify-end">
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-cream transition-colors">
          <Bell className="w-4.5 h-4.5 text-dark/50" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <button
          onClick={() => navigate('/settings')}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-cream transition-colors"
        >
          <Settings className="w-4.5 h-4.5 text-dark/50" />
        </button>
        <button
          onClick={() => navigate('/settings')}
          className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-white text-xs font-bold hover:bg-primary-dark transition-colors"
        >
          {user?.avatar || user?.name?.substring(0, 2)?.toUpperCase() || 'AS'}
        </button>
      </div>
    </header>
  );
}
