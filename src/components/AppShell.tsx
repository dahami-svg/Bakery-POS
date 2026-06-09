'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useTenant } from '@/context/TenantContext';
import { LogOut, Moon, Sun, User } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { activeTenant } = useTenant();
  const isLoginPage = pathname === '/login' || pathname === '/setup-password';

  if (isLoginPage) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const currentPageTitle = (() => {
    if (pathname === '/') return 'Owner Analytics';
    if (pathname === '/pos') return 'New Transaction';
    if (pathname === '/kds') return 'Kitchen Queue';
    if (pathname === '/inventory') {
      return activeTenant?.type === 'hardware' ? 'Hardware Stock' : 'Bakery Logistics';
    }
    if (pathname === '/catalog') return 'Product Manager';
    if (pathname === '/super-admin') return 'Client & Feature Controller';
    return 'Dashboard';
  })();

  return (
    <div className="flex bg-surface h-screen w-full overflow-hidden">
      <Sidebar />
      <div className="flex-1 min-w-0 h-full flex flex-col">
        <header className="h-16 shrink-0 border-b border-outline-variant bg-surface-container-low/70 backdrop-blur-md px-6">
          <div className="h-full flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-on-surface truncate">{currentPageTitle}</h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="relative inline-flex h-10 w-20 items-center rounded-full border border-outline-variant bg-surface-container px-1 transition-colors"
                aria-label="Toggle theme"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <span
                  className={`absolute h-8 w-8 rounded-full bg-primary transition-transform ${
                    theme === 'dark' ? 'translate-x-10' : 'translate-x-0'
                  }`}
                />
                <span className="relative z-10 flex w-full items-center justify-between px-1 text-on-surface-variant">
                  <Sun size={14} className={theme === 'dark' ? 'opacity-50' : 'text-on-primary'} />
                  <Moon size={14} className={theme === 'dark' ? 'text-on-primary' : 'opacity-50'} />
                </span>
              </button>

              {user && (
                <div className="flex items-center gap-2 rounded-2xl border border-outline-variant bg-surface-container px-3 py-2">
                  <div className="size-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <User size={15} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-on-surface truncate">{user.name}</p>
                    <p className="text-[9px] uppercase font-bold tracking-widest text-on-surface-variant truncate">
                      {user.role.replace('_', ' ')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="ml-1 inline-flex items-center gap-1 rounded-xl border border-outline-variant px-2.5 py-2 text-xs font-bold text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors"
                    title="Sign out"
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 min-w-0 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
