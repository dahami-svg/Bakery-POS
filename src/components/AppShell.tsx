'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useLayout } from '@/context/LayoutContext';
import { useTheme } from '@/context/ThemeContext';
import { useTenant } from '@/context/TenantContext';
import { LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen, Sun, User } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useLayout();
  const { theme, toggleTheme } = useTheme();
  const { activeTenant } = useTenant();
  const isLoginPage = pathname === '/login' || pathname === '/setup-password';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setSidebarOpen(window.innerWidth >= 1280);
  }, []);

  if (isLoginPage) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const inventoryTitle = activeTenant?.enabledModules.includes('inventory')
    ? 'Stock & Inventory'
    : 'Inventory';
  const kdsTitle = activeTenant?.type === 'hardware' ? 'Fulfillment Board' : 'Kitchen Queue';
  const catalogTitle = activeTenant?.type === 'hardware' ? 'Item Catalog' : 'Product Manager';

  const currentPageTitle = (() => {
    if (pathname === '/') return 'Owner Analytics';
    if (pathname === '/orders') return 'All Orders';
    if (pathname === '/pos') return 'Sales Terminal';
    if (pathname === '/kds') return kdsTitle;
    if (pathname === '/inventory') return inventoryTitle;
    if (pathname === '/catalog') return catalogTitle;
    if (pathname === '/super-admin') return 'Control Center';
    return 'Dashboard';
  })();

  return (
    <div className="flex bg-surface h-screen w-full overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0 h-full flex flex-col">
        <header className="h-14 lg:h-16 shrink-0 border-b border-outline-variant bg-surface-container-low/70 backdrop-blur-md px-4 lg:px-6">
          <div className="h-full flex items-center justify-between gap-2 lg:gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setSidebarOpen((prev) => !prev)}
                className="size-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors cursor-pointer"
                aria-label={sidebarOpen ? 'Collapse sidebar' : 'Open sidebar'}
              >
                <span className="md:hidden">
                  <Menu size={20} />
                </span>
                <span className="hidden md:inline xl:hidden">
                  {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
                </span>
                <span className="hidden xl:inline">
                  {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
                </span>
              </button>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-on-surface truncate">{currentPageTitle}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="relative inline-flex h-9 w-[72px] shrink-0 cursor-pointer items-center rounded-full border border-outline-variant bg-surface-container transition-colors lg:h-10 lg:w-20"
                aria-label="Toggle theme"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <span
                  className={`absolute left-1 top-1 h-7 w-7 rounded-full bg-primary transition-transform lg:h-8 lg:w-8 ${
                    theme === 'dark' ? 'translate-x-8 lg:translate-x-10' : 'translate-x-0'
                  }`}
                />
                <span className="relative z-10 grid h-full w-full grid-cols-2 text-on-surface-variant">
                  <span className="flex h-full items-center justify-center">
                    <Sun size={13} className={theme === 'dark' ? 'opacity-50' : 'text-on-primary'} />
                  </span>
                  <span className="flex h-full items-center justify-center">
                    <Moon size={13} className={theme === 'dark' ? 'text-on-primary' : 'opacity-50'} />
                  </span>
                </span>
              </button>

              {user && (
                <div className="flex items-center gap-2 rounded-2xl border border-outline-variant bg-surface-container px-2 lg:px-3 py-1.5 lg:py-2">
                  <div className="size-7 lg:size-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <User size={13} className="text-primary" />
                  </div>
                  <div className="hidden sm:block min-w-0">
                    <p className="text-xs font-bold text-on-surface truncate max-w-[80px] lg:max-w-none">{user.name}</p>
                    <p className="text-[9px] uppercase font-bold tracking-widest text-on-surface-variant truncate">
                      {user.role.replace('_', ' ')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1 rounded-xl border border-outline-variant px-2 lg:px-2.5 py-1.5 lg:py-2 text-xs font-bold text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors cursor-pointer"
                    title="Sign out"
                  >
                    <LogOut size={13} />
                    <span className="hidden lg:inline">Logout</span>
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
