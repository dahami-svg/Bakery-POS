'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex bg-surface h-screen w-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 min-w-0 h-full">
        {children}
      </main>
    </div>
  );
}
