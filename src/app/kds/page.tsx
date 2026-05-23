'use client';

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, AlertCircle, Timer, ShieldAlert, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTenant } from '@/context/TenantContext';
import Link from 'next/link';

export default function KdsPage() {
  const { activeTenant, loading: tenantLoading } = useTenant();
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'preparing' | 'ready'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOrders = async (showSilently = false) => {
    if (!activeTenant) return;
    if (!showSilently) setLoadingOrders(true);
    
    try {
      const res = await fetch(`/api/orders?tenantId=${activeTenant._id}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        // KDS only cares about active orders (new, preparing, ready)
        const activeOrders = data.data.filter((o: any) => o.status !== 'completed' && o.status !== 'cancelled');
        setOrders(activeOrders);
      }
    } catch (err) {
      console.error('Failed to load kitchen queue:', err);
    } finally {
      if (!showSilently) setLoadingOrders(false);
    }
  };

  // Initial load and periodic polling (every 10s)
  useEffect(() => {
    if (!activeTenant) return;
    fetchOrders();

    const interval = setInterval(() => {
      fetchOrders(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [activeTenant]);

  // Update order status in database
  const handleUpdateStatus = async (orderId: string, nextStatus: 'preparing' | 'ready' | 'completed') => {
    setActionLoading(orderId);
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          status: nextStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        // Update local state or re-fetch
        await fetchOrders(true);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle individual item ready status
  const handleToggleItemStatus = async (order: any, itemIndex: number) => {
    const item = order.items[itemIndex];
    const newStatus = item.status === 'ready' ? 'pending' : 'ready';
    
    setActionLoading(`${order._id}-${itemIndex}`);
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: order._id,
          items: [
            {
              id: item._id,
              status: newStatus
            }
          ]
        })
      });
      const data = await res.json();
      if (data.success) {
        await fetchOrders(true);
      }
    } catch (err) {
      console.error('Failed to toggle item status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Loading indicator
  if (tenantLoading || (activeTenant && loadingOrders)) {
    return (
      <div className="flex items-center justify-center h-full bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Loading Kitchen Queue...</p>
        </div>
      </div>
    );
  }

  // No Tenant State
  if (!activeTenant) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-surface text-center p-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
          <Clock size={36} />
        </div>
        <h1 className="text-2xl font-black text-on-surface">No active shop selected</h1>
        <p className="text-on-surface-variant text-sm mt-2 max-w-md">
          Please select or provision a shop environment first.
        </p>
        <Link href="/super-admin" className="mt-6 px-5 py-2.5 bg-primary text-on-primary rounded-lg text-xs font-bold active:scale-95 transition-all">
          Super Admin Console
        </Link>
      </div>
    );
  }

  // Check Module Access
  if (!activeTenant.enabledModules.includes('kds')) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-surface text-center p-8">
        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center text-error mb-4">
          <ShieldAlert size={36} />
        </div>
        <h1 className="text-2xl font-black text-on-surface">Kitchen Display System Disabled</h1>
        <p className="text-on-surface-variant text-sm mt-2 max-w-md">
          The Kitchen (KDS) module is not enabled for <span className="font-bold text-on-surface">{activeTenant.name}</span>.
          {activeTenant.type === 'hardware' && ' As a hardware shop, this environment does not have a kitchen section.'}
        </p>
        <Link href="/super-admin" className="mt-6 px-5 py-2.5 bg-surface-container-high hover:bg-surface-variant border border-outline-variant rounded-lg text-xs font-bold text-on-surface active:scale-95 transition-all">
          Manage Modules (Super Admin)
        </Link>
      </div>
    );
  }

  // Filtering orders
  const filteredOrders = orders.filter(o => filter === 'all' || o.status === filter);

  return (
    <div className="flex flex-col h-full bg-surface-container-lowest p-8 scrollbar-hide overflow-y-auto">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-on-surface">Kitchen Queue</h1>
          <p className="text-on-surface-variant text-sm mt-1">Station: {activeTenant.name} • {orders.length} active orders</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchOrders()}
            className="p-2 bg-surface-container border border-outline-variant hover:bg-surface-variant text-on-surface-variant hover:text-on-surface rounded-lg cursor-pointer transition-colors active:scale-95"
            title="Refresh Queue"
          >
            <RotateCw size={18} />
          </button>
          
          <div className="flex bg-surface-container p-1 rounded-lg border border-outline-variant overflow-x-auto no-scrollbar">
            {(['all', 'new', 'preparing', 'ready'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-1.5 text-sm font-semibold rounded-md capitalize transition-all cursor-pointer whitespace-nowrap",
                  filter === f 
                    ? "bg-primary text-on-primary shadow-sm" 
                    : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                {f === 'all' ? 'All Orders' : `${f} (${orders.filter(o => o.status === f).length})`}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredOrders.map(order => {
          const isPreparing = order.status === 'preparing';
          const isNew = order.status === 'new';
          const isReady = order.status === 'ready';
          
          const timeElapsed = Math.round((Date.now() - new Date(order.createdAt).getTime()) / 60000);

          return (
            <div 
              key={order._id} 
              className={cn(
                "flex flex-col rounded-xl overflow-hidden border transition-all bg-surface-container",
                isPreparing ? "border-orange-500/50" : "border-outline-variant"
              )}
            >
              <div className={cn(
                "px-4 py-2 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.1em]",
                isPreparing ? "bg-orange-500/20 text-orange-400" : 
                isNew ? "bg-primary/20 text-primary" : "bg-surface-container-high text-on-surface-variant"
              )}>
                <span>{isPreparing ? 'Urgent • preparing' : order.status}</span>
                <span>{timeElapsed}m ago</span>
              </div>

              <div className="p-5 flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-on-surface">#{order._id.slice(-4).toUpperCase()}</h3>
                    <p className="text-xs text-on-surface-variant mt-1 capitalize">
                      {order.type.replace('-', ' ')} {order.tableNumber && `• Table ${order.tableNumber}`}
                    </p>
                  </div>
                  {isPreparing && (
                    <span className="bg-orange-950 text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">preparing</span>
                  )}
                </div>

                <div className="space-y-3 py-4 border-y border-outline-variant/30">
                  {order.items.map((item: any, idx: number) => {
                    const product = item.productId;
                    if (!product) return null;
                    const isItemReady = item.status === 'ready' || item.status === 'delivered';
                    const isItemToggling = actionLoading === `${order._id}-${idx}`;

                    return (
                      <div 
                        key={item._id || idx} 
                        onClick={() => handleToggleItemStatus(order, idx)}
                        className={cn(
                          "flex justify-between items-center group cursor-pointer transition-opacity",
                          isItemToggling ? "opacity-50 pointer-events-none" : ""
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-on-surface">{item.quantity}x</span>
                          <div className="flex flex-col">
                            <span className={cn(
                              "text-sm font-medium",
                              isItemReady ? "text-on-surface/40 line-through" : "text-on-surface"
                             )}>
                              {product.name}
                            </span>
                            {item.note && (
                              <span className="text-[10px] text-secondary font-semibold italic">{item.note}</span>
                            )}
                          </div>
                        </div>
                        <div className={cn(
                          "size-5 rounded-full border flex items-center justify-center transition-colors shrink-0",
                          isItemReady ? "bg-primary border-primary text-on-primary" : "border-outline-variant"
                        )}>
                          {isItemReady && <CheckCircle2 size={12} />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <Timer size={14} />
                    <span className="text-xs font-mono">{timeElapsed} min elapsed</span>
                  </div>
                  
                  {isReady ? (
                    <button 
                      onClick={() => handleUpdateStatus(order._id, 'completed')}
                      disabled={actionLoading === order._id}
                      className="bg-primary text-on-primary text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary-container active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      Dispatch
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleUpdateStatus(order._id, isNew ? 'preparing' : 'ready')}
                      disabled={actionLoading === order._id}
                      className={cn(
                        "text-xs font-bold px-4 py-2 rounded-lg active:scale-95 transition-all cursor-pointer disabled:opacity-50",
                        isNew ? "bg-secondary text-on-secondary hover:opacity-90" : "bg-primary text-on-primary hover:opacity-90"
                      )}
                    >
                      {isNew ? 'Start Prep' : 'Complete'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-20 text-on-surface-variant bg-surface-container/20 border border-dashed border-outline-variant rounded-2xl max-w-xl mx-auto my-10">
          <CheckCircle2 size={48} className="mx-auto mb-4 text-primary" strokeWidth={1} />
          <p className="text-sm font-bold">No active orders in this status.</p>
        </div>
      )}

      <footer className="mt-auto pt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-surface-container p-4 rounded-xl border border-outline-variant flex items-center gap-4">
            <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Timer size={24} />
            </div>
            <div>
              <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">Avg Prep Time</p>
              <p className="text-xl font-bold text-on-surface">6.2 min</p>
            </div>
         </div>
         <div className="bg-surface-container p-4 rounded-xl border border-outline-variant flex items-center gap-4">
            <div className="size-12 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">Kitchen Load</p>
              <p className="text-xl font-bold text-on-surface">{orders.length > 5 ? 'High Load' : 'Optimal'}</p>
            </div>
         </div>
         <div className="bg-surface-container p-4 rounded-xl border border-outline-variant flex items-center gap-4">
            <div className="size-12 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">Est. Wait Time</p>
              <p className="text-xl font-bold text-on-surface">~{orders.length * 3} min</p>
            </div>
         </div>
      </footer>
    </div>
  );
}
