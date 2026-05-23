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
  Sparkles,
  Utensils,
  Wrench,
  Cake,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTenant } from '@/context/TenantContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Analytics', href: '/', module: 'analytics' },
  { icon: ShoppingBag, label: 'POS', href: '/pos', module: 'pos' },
  { icon: ChefHat, label: 'Kitchen', href: '/kds', module: 'kds' },
  { icon: ClipboardList, label: 'Inventory', href: '/inventory', module: 'inventory' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { tenants, activeTenant, loading, selectTenant } = useTenant();

  const getTenantIcon = (type?: string) => {
    switch (type) {
      case 'restaurant':
        return Utensils;
      case 'hardware':
        return Wrench;
      case 'cake_shop':
        return Cake;
      case 'bakery':
      default:
        return ChefHat;
    }
  };

  const TenantIcon = getTenantIcon(activeTenant?.type);

  // Filter nav items based on enabled modules of the active tenant
  const filteredNavItems = navItems.filter(item => 
    activeTenant?.enabledModules.includes(item.module as any)
  );

  return (
    <aside className="w-64 bg-surface-container-low border-r border-outline-variant flex flex-col h-screen shrink-0">
      {/* Brand Header & Switcher */}
      <div className="p-5 border-b border-outline-variant bg-surface-container-lowest/40">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary">
            {loading ? (
              <div className="size-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <TenantIcon size={22} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-on-surface text-sm font-black leading-tight truncate">
              {loading ? 'Loading...' : activeTenant?.name || 'No Active Shop'}
            </h1>
            <p className="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest mt-0.5">
              {loading ? 'POS System' : activeTenant?.type.replace('_', ' ') || 'Universal POS'}
            </p>
          </div>
        </div>

        {/* Tenant Switcher Dropdown */}
        {!loading && tenants.length > 0 && (
          <div className="relative">
            <select
              value={activeTenant?._id || ''}
              onChange={(e) => selectTenant(e.target.value)}
              className="w-full bg-surface-container-high text-on-surface text-xs font-bold py-2 px-3 pr-8 rounded-lg border border-outline-variant outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              {tenants.map(t => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[8px] font-black">
              ▼
            </div>
          </div>
        )}
      </div>

      {/* Main Nav Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
        {!loading && filteredNavItems.map((item) => {
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
              <p className="text-sm font-semibold">{item.label}</p>
            </Link>
          );
        })}

        {/* Access Denied / Empty Navigation Indicator */}
        {!loading && filteredNavItems.length === 0 && (
          <div className="p-4 text-center text-on-surface-variant text-xs opacity-50">
            No modules enabled.
          </div>
        )}

        {/* Divider and Admin section */}
        <div className="mt-6 pt-6 border-t border-outline-variant px-3 space-y-1">
          <Link
            href="/super-admin"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer border border-dashed border-secondary/20 hover:border-secondary/60",
              pathname === '/super-admin'
                ? "bg-secondary-container text-on-secondary-container border-solid border-secondary"
                : "text-on-surface-variant hover:bg-surface-variant hover:text-secondary"
            )}
          >
            <ShieldCheck size={20} className="text-secondary" />
            <p className="text-sm font-bold">Super Admin</p>
          </Link>
          
          <button className="w-full flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-colors cursor-pointer text-left">
            <Settings size={20} />
            <p className="text-sm font-medium">Settings</p>
          </button>
        </div>
      </nav>

      {/* AI Insights & Quick Stats */}
      {!loading && activeTenant && (
        <div className="p-4 mt-auto border-t border-outline-variant bg-surface-container-lowest/20">
          <div className="bg-surface-container p-3 rounded-lg border border-outline-variant">
            <div className="flex items-center gap-2 mb-2 text-primary">
              <Sparkles size={14} />
              <p className="text-xs font-semibold uppercase tracking-wider">AI Copilot</p>
            </div>
            <p className="text-[11px] leading-relaxed text-on-surface-variant">
              {activeTenant.type === 'bakery' && 'Sourdough demand is up 15%. Recommend baking +10 units.'}
              {activeTenant.type === 'hardware' && 'Stock low on WD-40. Recommend ordering 20 cans soon.'}
              {activeTenant.type === 'restaurant' && 'Friday traffic expected to peak between 7 PM and 9 PM.'}
              {activeTenant.type === 'cake_shop' && 'Strawberry prices down 5%. Good time for promotional cakes!'}
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
