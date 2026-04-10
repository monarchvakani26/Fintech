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
    <header className="bg-white/80 backdrop-blur-sm border-b border-cream-dark/20 px-8 py-0 flex items-center justify-between sticky top-0 z-20 h-14">
      {/* Tabs */}
      <nav className="flex items-center gap-1 h-full">
        {headerTabs.map(({ to, label }) => {
          const isActive = location.pathname === to ||
            (to === '/payments' && location.pathname.startsWith('/payments'));
          return (
            <Link
              key={to}
              to={to}
              className={`relative px-4 h-14 flex items-center text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? 'text-primary'
                  : 'text-dark/50 hover:text-dark'
              }`}
            >
              {label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-cream transition-colors">
          <Bell className="w-5 h-5 text-dark/50" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <button
          onClick={() => navigate('/settings')}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-cream transition-colors"
        >
          <Settings className="w-5 h-5 text-dark/50" />
        </button>
        <button
          onClick={() => navigate('/settings')}
          className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-white text-sm font-bold hover:bg-primary-dark transition-colors"
        >
          {user?.avatar || user?.name?.substring(0, 2)?.toUpperCase() || 'AS'}
        </button>
      </div>
    </header>
  );
}
