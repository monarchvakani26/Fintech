// ============================================================
// Rakshak AI - Dashboard Layout
// Sidebar + Header + main content wrapper
// ============================================================

import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-auto p-8 bg-cream">
          {children}
        </main>
      </div>
    </div>
  );
}
