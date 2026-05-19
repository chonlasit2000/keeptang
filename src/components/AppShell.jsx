import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav.jsx';
import SidebarNav from './SidebarNav.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function AppShell() {
  const { seedError, clearSeedError } = useAuth();

  return (
    <div className="min-h-screen bg-cream text-ink md:px-6 md:py-6">
      <div className="mx-auto flex min-h-screen w-full max-w-md bg-cream shadow-soft md:min-h-[calc(100vh-3rem)] md:max-w-5xl md:overflow-hidden md:rounded-2xl">
        <SidebarNav />
        <main className="min-h-screen w-full min-w-0 px-5 pb-28 pt-6 md:min-h-0 md:flex-1 md:overflow-y-auto md:px-7 md:pb-8 md:pt-7 lg:px-9">
        {seedError ? (
          <div className="mb-4 rounded-2xl bg-expenseSoft p-4 text-sm font-semibold text-expense">
            <div className="flex items-start justify-between gap-3">
              <p>{seedError}</p>
              <button type="button" className="shrink-0 text-xs font-bold" onClick={clearSeedError}>
                ปิด
              </button>
            </div>
          </div>
        ) : null}
        <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
