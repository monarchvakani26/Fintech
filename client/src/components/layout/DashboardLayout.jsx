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
    <div className="flex h-screen bg-cream overflow-hidden">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-8 bg-cream">
          {children}
        </main>
      </div>
    </div>
  );
}
