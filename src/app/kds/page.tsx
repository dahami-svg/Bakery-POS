'use client';

import React, { useState } from 'react';
import { Clock, CheckCircle2, AlertCircle, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Order } from '@/types';

const MOCK_ORDERS: Order[] = [
  {
    id: '402',
    status: 'preparing',
    type: 'takeaway',
    tableNumber: 12,
    createdAt: '12:04',
    total: 35.10,
    items: [
      { id: '1', productId: 'p1', quantity: 2, status: 'ready', note: 'Almond Croissant' },
      { id: '2', productId: 'p2', quantity: 1, status: 'preparing', note: 'Rustic Sourdough' }
    ]
  },
  {
    id: '405',
    status: 'new',
    type: 'delivery',
    createdAt: '12:08',
    total: 18.50,
    items: [
      { id: '3', productId: 'p3', quantity: 1, status: 'pending', note: 'Pain au Chocolat' },
      { id: '4', productId: 'p4', quantity: 1, status: 'pending', note: 'Cinnamon Swirl' },
      { id: '5', productId: 'p5', quantity: 1, status: 'pending', note: 'Danish Apricot' }
    ]
  },
  {
    id: '398',
    status: 'ready',
    type: 'dine-in',
    tableNumber: 4,
    createdAt: '11:55',
    total: 22.00,
    items: [
      { id: '6', productId: 'p6', quantity: 2, status: 'ready', note: 'Avocado Toast' }
    ]
  }
];

export default function KdsPage() {
  const [filter, setFilter] = useState<'all' | 'new' | 'preparing' | 'ready'>('all');

  return (
    <div className="flex flex-col h-full bg-surface-container-lowest p-8 scrollbar-hide overflow-y-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-on-surface">Kitchen Queue</h1>
          <p className="text-on-surface-variant text-sm mt-1">Station: Pastry & Dough • 8 active tasks</p>
        </div>
        
        <div className="flex bg-surface-container p-1 rounded-lg border border-outline-variant">
          {(['all', 'new', 'preparing', 'ready'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-1.5 text-sm font-semibold rounded-md capitalize transition-all",
                filter === f 
                  ? "bg-primary text-on-primary shadow-sm" 
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              {f === 'all' ? 'All Orders' : `${f} (${MOCK_ORDERS.filter(o => o.status === f).length})`}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {MOCK_ORDERS.filter(o => filter === 'all' || o.status === filter).map(order => (
          <div 
            key={order.id} 
            className={cn(
              "flex flex-col rounded-xl overflow-hidden border transition-all",
              order.status === 'preparing' ? "border-orange-500/50 bg-surface-container" : "border-outline-variant bg-surface-container"
            )}
          >
            <div className={cn(
              "px-4 py-2 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.1em]",
              order.status === 'preparing' ? "bg-orange-500/20 text-orange-400" : 
              order.status === 'new' ? "bg-primary/20 text-primary" : "bg-surface-container-high text-on-surface-variant"
            )}>
              <span>{order.status === 'preparing' ? 'Urgent • Priority' : order.status}</span>
              <span>{order.createdAt}</span>
            </div>

            <div className="p-5 flex-1 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-on-surface">#{order.id}</h3>
                  <p className="text-xs text-on-surface-variant mt-1 capitalize">
                    {order.type} {order.tableNumber && `• Table ${order.tableNumber}`}
                  </p>
                </div>
                {order.status === 'preparing' && (
                  <span className="bg-orange-950 text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">preparing</span>
                )}
              </div>

              <div className="space-y-3 py-4 border-y border-outline-variant/30">
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between items-center group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-on-surface">{item.quantity}x</span>
                      <span className={cn(
                        "text-sm font-medium",
                        item.status === 'ready' ? "text-on-surface/40 line-through" : "text-on-surface"
                       )}>
                        {item.note}
                      </span>
                    </div>
                    <div className={cn(
                      "size-5 rounded-full border flex items-center justify-center transition-colors",
                      item.status === 'ready' ? "bg-primary border-primary text-on-primary" : "border-outline-variant"
                    )}>
                      {item.status === 'ready' && <CheckCircle2 size={12} />}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <Timer size={14} />
                  <span className="text-xs font-mono">04:12</span>
                </div>
                {order.status === 'ready' ? (
                  <button className="bg-primary text-on-primary text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary-container active:scale-95 transition-all">
                    Dispatch
                  </button>
                ) : (
                  <button className={cn(
                    "text-xs font-bold px-4 py-2 rounded-lg active:scale-95 transition-all",
                    order.status === 'new' ? "bg-secondary text-on-secondary" : "bg-primary text-on-primary"
                  )}>
                    {order.status === 'new' ? 'Start Prep' : 'Complete'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

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
              <p className="text-xl font-bold text-on-surface">85% Capacity</p>
            </div>
         </div>
         <div className="bg-surface-container p-4 rounded-xl border border-outline-variant flex items-center gap-4">
            <div className="size-12 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">Est. Wait Time</p>
              <p className="text-xl font-bold text-on-surface">~12 min</p>
            </div>
         </div>
      </footer>
    </div>
  );
}
