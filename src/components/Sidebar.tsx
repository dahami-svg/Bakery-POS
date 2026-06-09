'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  ChefHat,
  ClipboardList,
  Package,
  Utensils,
  Wrench,
  Cake,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTenant } from '@/context/TenantContext';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Analytics', href: '/', module: 'analytics' },
  { icon: ShoppingBag, label: 'POS', href: '/pos', module: 'pos' },
  { icon: ChefHat, label: 'Kitchen', href: '/kds', module: 'kds' },
  { icon: ClipboardList, label: 'Inventory', href: '/inventory', module: 'inventory' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { tenants, activeTenant, loading, selectTenant } = useTenant();
  const { user } = useAuth();

  const isSuperAdmin = user?.role === 'super_admin';
  const canManageCatalog = user?.role === 'super_admin' || user?.role === 'tenant_admin';

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

  const filteredNavItems = navItems.filter((item) =>
    activeTenant?.enabledModules.includes(item.module as any)
  );

  return (
    <aside className="w-64 bg-surface-container-low border-r border-outline-variant flex flex-col h-screen shrink-0">
      <div className="h-16 px-5 border-b border-outline-variant bg-surface-container-lowest/40 flex items-center">
        <div className="flex items-center gap-3 min-w-0 w-full">
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
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
        {!loading && isSuperAdmin && tenants.length > 0 && (
          <div className="px-3 pb-4 mb-4 border-b border-outline-variant/60">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              Active Tenant
            </label>
            <div className="relative">
              <select
                value={activeTenant?._id || ''}
                onChange={(e) => selectTenant(e.target.value)}
                className="w-full bg-surface-container-high text-on-surface text-xs font-bold py-2 px-3 pr-8 rounded-lg border border-outline-variant outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
              >
                {tenants.map((tenant) => (
                  <option key={tenant._id} value={tenant._id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[8px] font-black">
                v
              </div>
            </div>
          </div>
        )}

        {!loading &&
          filteredNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer',
                  isActive
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'
                )}
              >
                <item.icon size={20} />
                <p className="text-sm font-semibold">{item.label}</p>
              </Link>
            );
          })}

        {!loading && activeTenant?.enabledModules.includes('pos') && canManageCatalog && (
          <Link
            href="/catalog"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer',
              pathname === '/catalog'
                ? 'bg-secondary-container text-on-secondary-container'
                : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'
            )}
          >
            <Package size={20} />
            <p className="text-sm font-semibold">Products</p>
          </Link>
        )}

        {!loading && filteredNavItems.length === 0 && (
          <div className="p-4 text-center text-on-surface-variant text-xs opacity-50">
            No modules enabled.
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-outline-variant px-3 space-y-1">
          {isSuperAdmin && (
            <Link
              href="/super-admin"
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer border border-dashed border-secondary/20 hover:border-secondary/60',
                pathname === '/super-admin'
                  ? 'bg-secondary-container text-on-secondary-container border-solid border-secondary'
                  : 'text-on-surface-variant hover:bg-surface-variant hover:text-secondary'
              )}
            >
              <ShieldCheck size={20} className="text-secondary" />
              <p className="text-sm font-bold">Super Admin</p>
            </Link>
          )}
        </div>
      </nav>
    </aside>
  );
}
