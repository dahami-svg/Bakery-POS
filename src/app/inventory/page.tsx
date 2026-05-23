'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  AlertTriangle, 
  Trash2, 
  Edit2, 
  Plus, 
  Search, 
  Calendar, 
  History,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTenant } from '@/context/TenantContext';
import Link from 'next/link';

export default function InventoryPage() {
  const { activeTenant, loading: tenantLoading } = useTenant();
  const [inventory, setInventory] = useState<any[]>([]);
  const [wasteLogs, setWasteLogs] = useState<any[]>([]);
  
  const [loadingData, setLoadingData] = useState(true);
  const [tab, setTab] = useState<'inventory' | 'waste' | 'expiry'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');

  // Form States: New Inventory Item
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemStock, setNewItemStock] = useState<number>(0);
  const [newItemUnit, setNewItemUnit] = useState('kg');
  const [newItemExpiry, setNewItemExpiry] = useState('');
  const [addingItem, setAddingItem] = useState(false);

  // Form States: New Waste Entry
  const [wasteItemId, setWasteItemId] = useState('');
  const [wasteAmount, setWasteAmount] = useState<number | ''>('');
  const [wasteReason, setWasteReason] = useState('Expired');
  const [loggingWaste, setLoggingWaste] = useState(false);

  const fetchData = async (silent = false) => {
    if (!activeTenant) return;
    if (!silent) setLoadingData(true);
    try {
      const [invRes, wasteRes] = await Promise.all([
        fetch(`/api/inventory?tenantId=${activeTenant._id}`),
        fetch(`/api/inventory/waste?tenantId=${activeTenant._id}`)
      ]);
      
      const invData = await invRes.json();
      const wasteData = await wasteRes.json();

      if (invData.success) setInventory(invData.data);
      if (wasteData.success) setWasteLogs(wasteData.data);
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    } finally {
      if (!silent) setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!activeTenant) return;
    fetchData();
    setShowAddForm(false);
    setWasteItemId('');
    setWasteAmount('');
  }, [activeTenant]);

  // Submit New Inventory Item
  const handleAddInventoryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemCategory.trim() || !newItemUnit.trim()) {
      alert('Please fill out all required fields.');
      return;
    }

    setAddingItem(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenant?._id,
          name: newItemName,
          category: newItemCategory,
          currentStock: newItemStock,
          unit: newItemUnit,
          bestBefore: newItemExpiry || 'N/A'
        })
      });

      const data = await res.json();
      if (data.success) {
        setNewItemName('');
        setNewItemCategory('');
        setNewItemStock(0);
        setNewItemExpiry('');
        setShowAddForm(false);
        await fetchData(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingItem(false);
    }
  };

  // Submit Waste Log
  const handleLogWaste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wasteItemId || !wasteAmount || Number(wasteAmount) <= 0) {
      alert('Please select an item and specify a valid waste amount.');
      return;
    }

    setLoggingWaste(true);
    try {
      const res = await fetch('/api/inventory/waste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenant?._id,
          ingredientId: wasteItemId,
          amount: Number(wasteAmount),
          reason: wasteReason
        })
      });

      const data = await res.json();
      if (data.success) {
        setWasteAmount('');
        await fetchData(true);
        alert('Waste logged successfully! Inventory stock has been updated.');
      } else {
        alert('Failed to log waste: ' + data.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoggingWaste(false);
    }
  };

  // Loading indicator
  if (tenantLoading || (activeTenant && loadingData)) {
    return (
      <div className="flex items-center justify-center h-full bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Loading Inventory...</p>
        </div>
      </div>
    );
  }

  // No Tenant State
  if (!activeTenant) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-surface text-center p-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
          <Package size={36} />
        </div>
        <h1 className="text-2xl font-black text-on-surface">No Shop Selected</h1>
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
  if (!activeTenant.enabledModules.includes('inventory')) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-surface text-center p-8">
        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center text-error mb-4">
          <ShieldAlert size={36} />
        </div>
        <h1 className="text-2xl font-black text-on-surface">Inventory Module Disabled</h1>
        <p className="text-on-surface-variant text-sm mt-2 max-w-md">
          The inventory tracking module is not enabled for <span className="font-bold text-on-surface">{activeTenant.name}</span>. Please visit the Super Admin settings to configure features.
        </p>
        <Link href="/super-admin" className="mt-6 px-5 py-2.5 bg-surface-container-high hover:bg-surface-variant border border-outline-variant rounded-lg text-xs font-bold text-on-surface active:scale-95 transition-all">
          Manage Shop Configuration
        </Link>
      </div>
    );
  }

  // Statistics
  const totalItemsCount = inventory.length;
  // Low stock threshold: hardware has lower counts, bakery has higher
  const lowStockThreshold = activeTenant.type === 'hardware' ? 6 : 20;
  const lowStockItems = inventory.filter(item => item.currentStock < lowStockThreshold);
  const lowStockCount = lowStockItems.length;

  const totalWasteSum = wasteLogs.reduce((sum, w) => sum + (w.amount * 2.5), 0); // Mock cost per unit
  const expiringSoonCount = inventory.filter(item => item.bestBefore && item.bestBefore !== 'N/A' && item.bestBefore !== 'N/A').length;

  // Filter lists
  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-surface">
      <header className="px-10 py-6 border-b border-outline-variant bg-surface-container-low/50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-on-surface">
              {activeTenant.type === 'hardware' ? 'Hardware Stock' : 'Bakery Logistics'}
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">Inventory Management & Supply Chain tracking for {activeTenant.name}</p>
          </div>
          <div className="flex gap-3 items-center">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                <input 
                  type="text"
                  placeholder="Search stock..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-64 rounded-lg border-none bg-surface-container-high pl-10 text-sm text-on-surface placeholder:text-on-surface-variant focus:ring-1 focus:ring-primary outline-none"
                />
             </div>
             <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-primary text-on-primary px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-primary/10 cursor-pointer"
             >
                <Plus size={16} />
                {showAddForm ? 'View List' : 'Add Item'}
             </button>
          </div>
        </div>

        <div className="flex gap-8">
          {(['inventory', 'waste', 'expiry'] as const).map(t => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setShowAddForm(false);
              }}
              className={cn(
                "pb-3 text-sm font-bold tracking-wider uppercase transition-all relative cursor-pointer",
                tab === t && !showAddForm ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <span className="capitalize">{t}</span>
              {tab === t && !showAddForm && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-full" />}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 p-10 overflow-y-auto scrollbar-hide grid grid-cols-12 gap-8">
        
        {/* Stats Row */}
        <div className="col-span-12 flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {[
            { label: 'Total Items', val: totalItemsCount.toString(), delta: 'Items in DB', icon: Package, color: 'text-primary' },
            { label: 'Low Stock', val: lowStockCount.toString(), delta: lowStockCount > 0 ? 'Requires refill' : 'All optimal', icon: AlertTriangle, color: lowStockCount > 0 ? 'text-orange-400' : 'text-on-surface-variant' },
            { label: 'Wasted Qty', val: wasteLogs.reduce((sum, w) => sum + w.amount, 0).toString(), icon: Trash2, color: 'text-error' },
            { label: 'Dated Items', val: expiringSoonCount.toString(), delta: 'Tracked expiration', icon: Calendar, color: 'text-on-surface' }
          ].map((stat, i) => (
            <div key={i} className="min-w-[240px] flex-1 bg-surface-container border border-outline-variant p-6 rounded-xl space-y-2">
              <div className="flex justify-between items-start">
                <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">{stat.label}</p>
                <stat.icon className={stat.color} size={18} />
              </div>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-black text-on-surface">{stat.val}</p>
                {stat.delta && <p className="text-[10px] font-bold mb-1 text-on-surface-variant">{stat.delta}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Content Section */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {showAddForm ? (
            /* Add Item Form */
            <div className="bg-surface-container p-8 rounded-xl border border-outline-variant space-y-6">
              <h2 className="text-xl font-bold text-on-surface">Register New Inventory Item</h2>
              
              <form onSubmit={handleAddInventoryItem} className="space-y-4 max-w-lg">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-on-surface-variant">Item / Ingredient Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Screws M6 or Fresh Milk"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-on-surface-variant">Category</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Hand Tools or Dairy"
                      value={newItemCategory}
                      onChange={(e) => setNewItemCategory(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-on-surface-variant">Unit</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. units, sets, kg, dozen"
                      value={newItemUnit}
                      onChange={(e) => setNewItemUnit(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-on-surface-variant">Opening Stock Level</label>
                    <input 
                      type="number" 
                      min="0"
                      value={newItemStock}
                      onChange={(e) => setNewItemStock(Number(e.target.value))}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-on-surface-variant">Best Before / Expiry (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Oct 24, 2026 or N/A"
                      value={newItemExpiry}
                      onChange={(e) => setNewItemExpiry(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={addingItem}
                  className="bg-primary text-on-primary px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {addingItem ? 'Saving Item...' : 'Save Stock Record'}
                </button>
              </form>
            </div>
          ) : tab === 'inventory' ? (
            /* Live Stock Table */
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-on-surface">Live Inventory</h2>
              <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-high/50 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">
                       <th className="px-6 py-4">Item Name</th>
                       <th className="px-6 py-4">Current Stock</th>
                       <th className="px-6 py-4">Expiry Tracking</th>
                       <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {filteredInventory.map(item => {
                      const isLow = item.currentStock < lowStockThreshold;
                      return (
                        <tr key={item._id} className="hover:bg-surface-container-high/40 transition-colors group">
                           <td className="px-6 py-4">
                             <p className="text-sm font-bold text-on-surface">{item.name}</p>
                             <p className="text-[10px] text-on-surface-variant font-medium">{item.category}</p>
                           </td>
                           <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                               <div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden shrink-0">
                                 <div 
                                   className={cn("h-full transition-all", isLow ? "bg-orange-500" : "bg-primary")} 
                                   style={{ width: `${Math.min(100, (item.currentStock / 100) * 100)}%` }} 
                                 />
                               </div>
                               <span className={cn("text-xs font-bold whitespace-nowrap", isLow ? "text-orange-400" : "text-on-surface")}>
                                 {item.currentStock} {item.unit}
                               </span>
                             </div>
                           </td>
                           <td className="px-6 py-4 font-mono text-[10px] text-on-surface-variant">
                             {item.bestBefore || 'N/A'}
                           </td>
                           <td className="px-6 py-4 text-right">
                             <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button className="size-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
                                 <Edit2 size={14} />
                               </button>
                               <button className="size-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error transition-colors cursor-pointer">
                                 <Trash2 size={14} />
                               </button>
                             </div>
                           </td>
                        </tr>
                      );
                    })}

                    {filteredInventory.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-10 text-on-surface-variant opacity-50 text-xs">
                          No inventory records matched your filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : tab === 'waste' ? (
            /* Waste Logs Table */
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-on-surface">Logged Waste Incidents</h2>
              <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-high/50 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">
                       <th className="px-6 py-4">Wasted Item</th>
                       <th className="px-6 py-4">Amount Logged</th>
                       <th className="px-6 py-4">Reason</th>
                       <th className="px-6 py-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {wasteLogs.map(log => {
                      const item = log.ingredientId;
                      return (
                        <tr key={log._id} className="hover:bg-surface-container-high/40 transition-colors">
                           <td className="px-6 py-4">
                             <p className="text-sm font-bold text-on-surface">{item?.name || 'Deleted Item'}</p>
                             <p className="text-[10px] text-on-surface-variant font-medium">{item?.category || 'N/A'}</p>
                           </td>
                           <td className="px-6 py-4 text-sm font-semibold text-error">
                             -{log.amount} {item?.unit || ''}
                           </td>
                           <td className="px-6 py-4">
                             <span className="bg-surface-container-high px-2.5 py-1 rounded text-xs font-bold text-on-surface">
                               {log.reason}
                             </span>
                           </td>
                           <td className="px-6 py-4 text-xs font-mono text-on-surface-variant">
                             {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </td>
                        </tr>
                      );
                    })}

                    {wasteLogs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-10 text-on-surface-variant opacity-50 text-xs">
                          No waste incidents logged yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Expiry Warnings list */
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-on-surface">Expirations & Critical Dates</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {inventory.filter(i => i.bestBefore && i.bestBefore !== 'N/A').map(item => (
                  <div key={item._id} className="p-5 rounded-xl bg-surface-container border border-outline-variant flex items-start gap-4">
                    <div className="size-10 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-on-surface">{item.name}</h3>
                      <p className="text-xs text-on-surface-variant mt-0.5">Stock Level: {item.currentStock} {item.unit}</p>
                      <div className="mt-3 text-xs font-black text-secondary uppercase tracking-widest flex items-center gap-1.5">
                        <AlertTriangle size={12} /> Expiry: {item.bestBefore}
                      </div>
                    </div>
                  </div>
                ))}

                {inventory.filter(i => i.bestBefore && i.bestBefore !== 'N/A').length === 0 && (
                  <div className="col-span-2 text-center py-10 text-on-surface-variant opacity-50 text-xs">
                    No items require expiration tracking in this shop.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar forms */}
        <aside className="col-span-12 lg:col-span-4 flex flex-col gap-8">
           
           {/* Log Waste form */}
           <section className="bg-surface-container p-6 rounded-xl border border-outline-variant space-y-6">
              <div className="flex items-center gap-3 text-secondary">
                <Trash2 size={20} />
                <h3 className="text-lg font-bold text-on-surface">Log Damage / Waste</h3>
              </div>
              
              <form onSubmit={handleLogWaste} className="space-y-4">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-on-surface-variant">Select Item</label>
                   <select 
                      value={wasteItemId}
                      onChange={(e) => setWasteItemId(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                   >
                      <option value="">Choose item...</option>
                      {inventory.map(i => <option key={i._id} value={i._id}>{i.name} ({i.currentStock} {i.unit})</option>)}
                   </select>
                 </div>
                 
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-on-surface-variant">Amount to Deduct</label>
                   <input 
                      type="number" 
                      step="0.1" 
                      min="0.1"
                      required
                      placeholder="0.0" 
                      value={wasteAmount}
                      onChange={(e) => setWasteAmount(e.target.value !== '' ? Number(e.target.value) : '')}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface outline-none" 
                   />
                 </div>
                 
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-on-surface-variant">Deduction Reason</label>
                   <select 
                      value={wasteReason}
                      onChange={(e) => setWasteReason(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface outline-none cursor-pointer"
                   >
                      <option>Expired</option>
                      <option>Spilled / Damaged</option>
                      <option>Quality Rejection</option>
                   </select>
                 </div>
                 
                 <button 
                    type="submit" 
                    disabled={loggingWaste || !wasteItemId}
                    className="w-full bg-secondary text-on-secondary py-3 rounded-lg font-black text-sm uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                 >
                    {loggingWaste && <Loader2 size={14} className="animate-spin" />}
                    Submit Log
                 </button>
              </form>
           </section>

           {/* Stock Warning Panel */}
           <section className="bg-surface-container p-6 rounded-xl border border-outline-variant space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase text-on-surface">Stock Alerts</h3>
                <History size={16} className="text-on-surface-variant" />
              </div>
              <div className="space-y-3">
                 {lowStockItems.slice(0, 3).map((item) => (
                   <div key={item._id} className="flex items-center gap-4 p-3 bg-error/10 border-l-4 border-error rounded-r-lg">
                      <AlertTriangle className="text-error" size={18} />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-on-surface">{item.name} low stock</p>
                        <p className="text-[10px] text-error/80">Only {item.currentStock} {item.unit} remaining</p>
                      </div>
                   </div>
                 ))}
                 
                 {lowStockItems.length === 0 && (
                   <div className="text-xs text-on-surface-variant text-center py-4 bg-primary/5 rounded border border-dashed border-primary/20">
                     All stock quantities are currently healthy.
                   </div>
                 )}
              </div>
           </section>
        </aside>
      </main>
    </div>
  );
}
