import React, { useState } from 'react';
import { Package, AlertTriangle, Trash2, Edit2, Plus, Search, Calendar, History } from 'lucide-react';
import { cn } from '../lib/utils';
import { Ingredient } from '../types';

const MOCK_INGREDIENTS: Ingredient[] = [
  { id: '1', name: 'Bread Flour', category: 'Pantry / Dry', currentStock: 85, unit: 'kg', bestBefore: 'Oct 24, 2024' },
  { id: '2', name: 'Organic Eggs', category: 'Fridge / Dairy', currentStock: 12, unit: 'dozen', bestBefore: 'Oct 12, 2024' },
  { id: '3', name: 'Caster Sugar', category: 'Pantry / Dry', currentStock: 40, unit: 'kg', bestBefore: 'Dec 05, 2024' },
  { id: '4', name: 'Unsalted Butter', category: 'Fridge / Dairy', currentStock: 18, unit: 'kg', bestBefore: 'Oct 30, 2024' }
];

export function InventoryPage() {
  const [tab, setTab] = useState<'inventory' | 'waste' | 'expiry'>('inventory');

  return (
    <div className="flex flex-col h-full bg-surface">
      <header className="px-10 py-6 border-b border-outline-variant bg-surface-container-low/50">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-on-surface">Bakery Logistics</h1>
            <p className="text-on-surface-variant text-sm mt-1">Inventory Management & Supply Chain tracking</p>
          </div>
          <div className="flex gap-3">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                <input 
                  type="text"
                  placeholder="Search Inventory..." 
                  className="h-10 w-64 rounded-lg border-none bg-surface-container-high pl-10 text-sm text-on-surface placeholder:text-on-surface-variant focus:ring-1 focus:ring-primary outline-none"
                />
             </div>
             <button className="bg-primary text-on-primary px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-primary/10">
                <Plus size={16} />
                Add Ingredient
             </button>
          </div>
        </div>

        <div className="flex gap-8">
          {(['inventory', 'waste', 'expiry'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "pb-3 text-sm font-bold tracking-wider uppercase transition-all relative",
                tab === t ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <span className="capitalize">{t}</span>
              {tab === t && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-full" />}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 p-10 overflow-y-auto scrollbar-hide grid grid-cols-12 gap-8">
        {/* Stats Row */}
        <div className="col-span-12 flex gap-4 overflow-x-auto no-scrollbar">
          {[
            { label: 'Total Items', val: '124', delta: '+2%', icon: Package, color: 'text-primary' },
            { label: 'Low Stock', val: '8', delta: 'Needs attention', icon: AlertTriangle, color: 'text-orange-400' },
            { label: 'Waste (24h)', val: 'Rs. 42.5', icon: Trash2, color: 'text-error' },
            { label: 'Expiring Soon', val: '15', delta: 'Within 48h', icon: Calendar, color: 'text-on-surface' }
          ].map((stat, i) => (
            <div key={i} className="min-w-[240px] flex-1 bg-surface-container border border-outline-variant p-6 rounded-xl space-y-2">
              <div className="flex justify-between items-start">
                <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">{stat.label}</p>
                <stat.icon className={stat.color} size={18} />
              </div>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-black text-on-surface">{stat.val}</p>
                {stat.delta && <p className={cn("text-[10px] font-bold mb-1", stat.color)}>{stat.delta}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Inventory List */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
           <h2 className="text-xl font-bold text-on-surface">Live Inventory</h2>
           <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-surface-container-high/50 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">
                    <th className="px-6 py-4">Ingredient</th>
                    <th className="px-6 py-4">Current Stock</th>
                    <th className="px-6 py-4">Expiry</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-outline-variant/30">
                 {MOCK_INGREDIENTS.map(item => (
                   <tr key={item.id} className="hover:bg-surface-container-high/40 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-on-surface">{item.name}</p>
                        <p className="text-[10px] text-on-surface-variant font-medium">{item.category}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                            <div 
                              className={cn("h-full transition-all", item.currentStock < 20 ? "bg-orange-500" : "bg-primary")} 
                              style={{ width: `${Math.min(100, item.currentStock)}%` }} 
                            />
                          </div>
                          <span className={cn("text-xs font-bold", item.currentStock < 20 ? "text-orange-400" : "text-on-surface")}>
                            {item.currentStock} {item.unit}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-[10px] text-on-surface-variant">
                        {item.bestBefore}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="size-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button className="size-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>

        {/* Sidebar: Logic Forms */}
        <aside className="col-span-12 lg:col-span-4 flex flex-col gap-8">
           <section className="bg-surface-container p-6 rounded-xl border border-outline-variant space-y-6">
              <div className="flex items-center gap-3 text-secondary">
                <Trash2 size={20} />
                <h3 className="text-lg font-bold">Log Waste Entry</h3>
              </div>
              <form className="space-y-4">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-on-surface-variant">Ingredient</label>
                   <select className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none">
                      <option>Select ingredient...</option>
                      {MOCK_INGREDIENTS.map(i => <option key={i.id}>{i.name}</option>)}
                   </select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-on-surface-variant">Amount</label>
                      <input type="number" step="0.1" className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface outline-none" placeholder="0.0" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-on-surface-variant">Unit</label>
                      <select className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface outline-none">
                         <option>kg</option>
                         <option>dozen</option>
                         <option>units</option>
                      </select>
                    </div>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-on-surface-variant">Reason</label>
                   <select className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface outline-none">
                      <option>Expired</option>
                      <option>Spilled / Damaged</option>
                      <option>Quality Rejection</option>
                   </select>
                 </div>
                 <button type="button" className="w-full bg-secondary text-on-secondary py-3 rounded-lg font-black text-sm uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all">Submit Log</button>
              </form>
           </section>

           <section className="bg-surface-container p-6 rounded-xl border border-outline-variant space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase text-on-surface">Critical Actions</h3>
                <History size={16} className="text-on-surface-variant" />
              </div>
              <div className="space-y-3">
                 <div className="flex items-center gap-4 p-3 bg-error/10 border-l-4 border-error rounded-r-lg">
                    <AlertTriangle className="text-error" size={18} />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-on-surface">Organic Eggs reach zero</p>
                      <p className="text-[10px] text-error/80">Refill required by 4 PM</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 p-3 bg-secondary/10 border-l-4 border-secondary rounded-r-lg">
                    <Calendar className="text-secondary" size={18} />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-on-surface">Milk Expiry Imminent</p>
                      <p className="text-[10px] text-secondary/80">4L expires in 6 hours</p>
                    </div>
                 </div>
              </div>
           </section>
        </aside>
      </main>
    </div>
  );
}
