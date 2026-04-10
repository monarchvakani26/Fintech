// ============================================================
// Rakshak AI - Dashboard Layout
// Sidebar + Header + main content wrapper
// ============================================================

import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <Header />
        <main className="flex-1 overflow-auto p-8 bg-cream">
          {children}
        </main>
      </div>
    </div>
  );
}
