'use client';

import React, { useState } from 'react';
import { useTenant, Tenant } from '@/context/TenantContext';
import { 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Database, 
  Check, 
  LayoutDashboard, 
  ShoppingBag, 
  ChefHat, 
  ClipboardList,
  Sparkles
} from 'lucide-react';

export default function SuperAdminPage() {
  const { tenants, activeTenant, selectTenant, refreshTenants } = useTenant();
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  
  // New Tenant Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<'bakery' | 'restaurant' | 'hardware' | 'cake_shop'>('bakery');
  const [enabledModules, setEnabledModules] = useState<string[]>(['analytics', 'pos']);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Module toggle status tracking
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Trigger Database Seeding
  const handleSeed = async () => {
    setSeeding(true);
    setSeedSuccess(false);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSeedSuccess(true);
        await refreshTenants();
        setTimeout(() => setSeedSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSeeding(false);
    }
  };

  // Toggle Module in DB
  const handleToggleModule = async (tenant: Tenant, moduleKey: 'analytics' | 'pos' | 'kds' | 'inventory') => {
    setTogglingId(`${tenant._id}-${moduleKey}`);
    const alreadyEnabled = tenant.enabledModules.includes(moduleKey);
    let updatedModules = [...tenant.enabledModules];

    if (alreadyEnabled) {
      updatedModules = updatedModules.filter(m => m !== moduleKey);
    } else {
      updatedModules.push(moduleKey);
    }

    try {
      const res = await fetch(`/api/tenants/${tenant._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabledModules: updatedModules }),
      });
      const data = await res.json();
      if (data.success) {
        await refreshTenants();
      }
    } catch (err) {
      console.error('Failed to toggle module:', err);
    } finally {
      setTogglingId(null);
    }
  };

  // Create New Tenant
  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setCreateError('Shop name is required.');
      return;
    }
    setCreateError('');
    setCreating(true);

    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          enabledModules,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setName('');
        setType('bakery');
        setEnabledModules(['analytics', 'pos']);
        await refreshTenants();
      } else {
        setCreateError(data.message || 'Failed to create shop.');
      }
    } catch (err: any) {
      setCreateError(err.message || 'Error occurred.');
    } finally {
      setCreating(false);
    }
  };

  // Delete Tenant
  const handleDeleteTenant = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tenant? All data associated might become orphaned.')) {
      return;
    }
    try {
      const res = await fetch(`/api/tenants/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await refreshTenants();
      }
    } catch (err) {
      console.error('Failed to delete tenant:', err);
    }
  };

  const handleModuleCheckbox = (moduleKey: string) => {
    setEnabledModules(prev => 
      prev.includes(moduleKey) 
        ? prev.filter(m => m !== moduleKey) 
        : [...prev, moduleKey]
    );
  };

  return (
    <div className="flex flex-col h-full bg-surface overflow-y-auto scrollbar-hide">
      <header className="px-8 py-8 border-b border-outline-variant bg-surface-container-low/30 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-secondary mb-1">
              <ShieldAlert size={18} />
              <span className="text-[10px] font-black uppercase tracking-wider">Super Admin Console</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-on-surface">Client & Feature Controller</h1>
            <p className="text-on-surface-variant text-sm mt-1">Manage tenant environments, toggle features, and provision new shop databases.</p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container-high border border-outline-variant text-on-surface text-xs font-bold hover:bg-surface-variant active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Database size={14} className={seeding ? 'animate-spin' : ''} />
              {seeding ? 'Seeding...' : seedSuccess ? 'Database Seeded!' : 'Reset & Seed DB'}
            </button>
          </div>
        </div>
      </header>

      <div className="p-8 space-y-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Tenants List Section */}
        <section className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-on-surface">Registered Tenants ({tenants.length})</h2>
            {seedSuccess && (
              <span className="text-xs text-primary font-bold flex items-center gap-1">
                <Check size={14} /> Refresh Complete
              </span>
            )}
          </div>

          <div className="space-y-4">
            {tenants.map((tenant) => (
              <div 
                key={tenant._id} 
                className={`p-6 rounded-xl bg-surface-container border transition-all ${
                  activeTenant?._id === tenant._id ? 'border-primary shadow-lg shadow-primary/5' : 'border-outline-variant'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src={tenant.logoUrl || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100&h=100&fit=crop'} 
                      alt={tenant.name} 
                      className="size-12 rounded-lg object-cover border border-outline-variant bg-surface"
                    />
                    <div>
                      <h3 className="text-base font-bold text-on-surface">{tenant.name}</h3>
                      <p className="text-[10px] text-on-surface-variant uppercase font-black tracking-widest mt-0.5">
                        Type: {tenant.type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => selectTenant(tenant._id)}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        activeTenant?._id === tenant._id 
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container-high hover:bg-surface-variant text-on-surface'
                      }`}
                    >
                      {activeTenant?._id === tenant._id ? 'Active' : 'Select'}
                    </button>
                    
                    <button
                      onClick={() => handleDeleteTenant(tenant._id)}
                      className="p-1 rounded-md text-on-surface-variant hover:text-error hover:bg-error/10 transition-all cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="border-t border-outline-variant/30 pt-4">
                  <p className="text-xs font-black uppercase text-on-surface-variant tracking-wider mb-3">Enabled Modules</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { key: 'analytics', label: 'Analytics', icon: LayoutDashboard },
                      { key: 'pos', label: 'POS System', icon: ShoppingBag },
                      { key: 'kds', label: 'Kitchen (KDS)', icon: ChefHat },
                      { key: 'inventory', label: 'Inventory', icon: ClipboardList }
                    ].map((mod) => {
                      const isEnabled = tenant.enabledModules.includes(mod.key as any);
                      const isToggling = togglingId === `${tenant._id}-${mod.key}`;
                      return (
                        <button
                          key={mod.key}
                          onClick={() => handleToggleModule(tenant, mod.key as any)}
                          disabled={isToggling}
                          className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all text-xs font-bold cursor-pointer select-none ${
                            isEnabled 
                              ? 'bg-primary/10 border-primary/40 text-primary' 
                              : 'bg-surface-container-high/40 border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'
                          } ${isToggling ? 'opacity-50' : ''}`}
                        >
                          <mod.icon size={14} className={isEnabled ? 'text-primary' : 'text-on-surface-variant'} />
                          <span className="truncate">{mod.label}</span>
                          <div className={`size-3.5 rounded-full border ml-auto flex items-center justify-center ${
                            isEnabled ? 'bg-primary border-primary text-on-primary' : 'border-outline-variant'
                          }`}>
                            {isEnabled && <Check size={10} strokeWidth={3} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}

            {tenants.length === 0 && (
              <div className="text-center py-16 rounded-xl border border-dashed border-outline-variant bg-surface-container/20">
                <Database className="mx-auto text-on-surface-variant/40 mb-4" size={48} strokeWidth={1} />
                <p className="text-sm text-on-surface-variant">No tenants found. Click "Reset & Seed DB" to initialize sample data.</p>
              </div>
            )}
          </div>
        </section>

        {/* Action Panel: Create & System operations */}
        <aside className="lg:col-span-4 flex flex-col gap-8">
          
          {/* Create Tenant Form */}
          <section className="bg-surface-container p-6 rounded-xl border border-outline-variant space-y-6">
            <div className="flex items-center gap-3 text-secondary">
              <Plus size={20} />
              <h3 className="text-lg font-bold text-on-surface">Provision New Shop</h3>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-on-surface-variant">Shop Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Builders Supply Hardware"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-on-surface-variant">Shop Category</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="bakery">Bakery Shop</option>
                  <option value="restaurant">Restaurant / Bistro</option>
                  <option value="hardware">Hardware Shop</option>
                  <option value="cake_shop">Specialty Cake Shop</option>
                </select>
              </div>

              <div className="space-y-2 pt-2 border-t border-outline-variant/30">
                <label className="text-[10px] font-black uppercase text-on-surface-variant block mb-1">Select Access Modules</label>
                {[
                  { key: 'analytics', label: 'Analytics' },
                  { key: 'pos', label: 'POS Terminal' },
                  { key: 'kds', label: 'Kitchen Display (KDS)' },
                  { key: 'inventory', label: 'Inventory Logistics' }
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-3 text-xs font-bold text-on-surface-variant hover:text-on-surface cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={enabledModules.includes(item.key)}
                      onChange={() => handleModuleCheckbox(item.key)}
                      className="size-4 accent-primary rounded bg-surface-container-low border-outline-variant"
                    />
                    {item.label}
                  </label>
                ))}
              </div>

              {createError && (
                <p className="text-xs text-error font-medium">{createError}</p>
              )}

              <button 
                type="submit" 
                disabled={creating}
                className="w-full bg-primary text-on-primary py-3 rounded-lg font-black text-sm uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {creating ? 'Provisioning...' : 'Provision Environment'}
              </button>
            </form>
          </section>

          {/* Quick Guide Panel */}
          <section className="bg-surface-container p-6 rounded-xl border border-outline-variant space-y-4">
            <div className="flex items-center justify-between text-primary">
              <h3 className="text-sm font-black uppercase text-on-surface tracking-wider">Super Admin Guide</h3>
              <Sparkles size={16} />
            </div>
            
            <div className="space-y-3 text-xs leading-relaxed text-on-surface-variant">
              <p>
                <strong>Multi-Tenancy</strong>: Toggling modules here immediately updates the client-side experience for that shop. If a module is removed, the corresponding link hides from the sidebar.
              </p>
              <p>
                <strong>Restricted Sub-sections</strong>: If a shop is set to <span className="font-semibold text-on-surface">Hardware Shop</span>, the POS disables dining types (such as dine-in and table selections), aligning with a retail checkout.
              </p>
              <p>
                <strong>System Seeding</strong>: Click <span className="font-semibold text-on-surface">Reset & Seed DB</span> above to recreate the default MongoDB dataset (4 preconfigured shops with dummy products, orders, and inventories).
              </p>
            </div>
          </section>

        </aside>
      </div>
    </div>
  );
}
