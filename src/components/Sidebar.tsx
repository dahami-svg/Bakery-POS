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
  X,
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

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
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
  const HeaderIcon = isSuperAdmin ? ShieldCheck : TenantIcon;
  const headerTitle = isSuperAdmin ? 'Control Center' : loading ? 'Loading...' : activeTenant?.name || 'No Active Shop';
  const headerSubtitle = isSuperAdmin
    ? 'Super Admin'
    : loading
      ? 'POS System'
      : activeTenant?.type.replace('_', ' ') || 'Universal POS';

  const filteredNavItems = navItems.filter((item) =>
    activeTenant?.enabledModules.includes(item.module as any)
  );

  const sidebarContent = (
    <>
      <div className="h-16 px-5 border-b border-outline-variant bg-surface-container-lowest/40 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0">
            {loading ? (
              <div className="size-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <HeaderIcon size={22} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-on-surface text-sm font-black leading-tight truncate">{headerTitle}</h1>
            <p className="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest mt-0.5">
              {headerSubtitle}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden size-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
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
                onClick={onClose}
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
            onClick={onClose}
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
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer border border-dashed border-secondary/20 hover:border-secondary/60',
                pathname === '/super-admin'
                  ? 'bg-secondary-container text-on-secondary-container border-solid border-secondary'
                  : 'text-on-surface-variant hover:bg-surface-variant hover:text-secondary'
              )}
            >
              <ShieldCheck size={20} className="text-secondary" />
              <p className="text-sm font-bold">Control Center</p>
            </Link>
          )}
        </div>
      </nav>
    </>
  );

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          "bg-surface-container-low border-r border-outline-variant flex flex-col shrink-0 transition-transform duration-300 ease-in-out",
          "fixed inset-y-0 left-0 z-50 w-64",
          "lg:relative lg:z-auto lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
