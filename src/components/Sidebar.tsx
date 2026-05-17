'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ChefHat, 
  ClipboardList, 
  Settings, 
  Sparkles 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Analytics', href: '/' },
  { icon: ShoppingBag, label: 'POS', href: '/pos' },
  { icon: ChefHat, label: 'Kitchen', href: '/kds' },
  { icon: ClipboardList, label: 'Inventory', href: '/inventory' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-surface-container-low border-r border-outline-variant flex flex-col h-screen shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary">
          <ChefHat size={24} />
        </div>
        <div className="flex flex-col">
          <h1 className="text-on-surface text-base font-bold leading-tight">Bakery Manager</h1>
          <p className="text-on-surface-variant text-xs font-normal">Lumina Organic</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                isActive 
                  ? "bg-secondary-container text-on-secondary-container" 
                  : "text-on-surface-variant hover:bg-surface-variant hover:text-on-surface"
              )}
            >
              <item.icon size={20} />
              <p className="text-sm font-medium">{item.label}</p>
            </Link>
          );
        })}
        
        <div className="mt-8 pt-8 border-t border-outline-variant px-3">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-colors cursor-pointer">
            <Settings size={20} />
            <p className="text-sm font-medium">Settings</p>
          </button>
        </div>
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-surface-container p-3 rounded-lg border border-outline-variant">
          <div className="flex items-center gap-2 mb-2 text-primary">
            <Sparkles size={14} />
            <p className="text-xs font-semibold uppercase tracking-wider">AI Insights</p>
          </div>
          <p className="text-[11px] leading-relaxed text-on-surface-variant">
            Sourdough demand is up 15%. Recommend baking +10 units tomorrow morning.
          </p>
        </div>
      </div>
    </aside>
  );
}
