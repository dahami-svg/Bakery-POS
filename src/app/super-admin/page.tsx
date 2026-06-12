'use client';

import React, { useState } from 'react';
import { useTenant, Tenant } from '@/context/TenantContext';
import {
  ShieldAlert,
  Trash2,
  Database,
  Check,
  LayoutDashboard,
  ShoppingBag,
  ChefHat,
  ClipboardList,
  Sparkles,
  MailCheck,
  Store,
  Copy,
  UserRoundPlus,
  X,
} from 'lucide-react';

type TenantFormState = {
  name: string;
  type: 'bakery' | 'restaurant' | 'hardware' | 'cake_shop';
  contactEmail: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  ownerName: string;
  ownerEmail: string;
  enabledModules: string[];
};

type InvitationState = {
  ownerEmail: string;
  setupUrl: string;
  emailDelivered: boolean;
  emailError?: string | null;
} | null;

const emptyTenantForm: TenantFormState = {
  name: '',
  type: 'bakery',
  contactEmail: '',
  contactPhone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  ownerName: '',
  ownerEmail: '',
  enabledModules: ['analytics', 'pos'],
};

export default function SuperAdminPage() {
  const { tenants, activeTenant, selectTenant, refreshTenants } = useTenant();

  const [tenantForm, setTenantForm] = useState<TenantFormState>(emptyTenantForm);
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [latestInvitation, setLatestInvitation] = useState<InvitationState>(null);

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggleModule = async (
    tenant: Tenant,
    moduleKey: 'analytics' | 'pos' | 'kds' | 'inventory'
  ) => {
    setTogglingId(`${tenant._id}-${moduleKey}`);
    const alreadyEnabled = tenant.enabledModules.includes(moduleKey);
    let updatedModules = [...tenant.enabledModules];

    if (alreadyEnabled) {
      updatedModules = updatedModules.filter((moduleName) => moduleName !== moduleKey);
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
    } catch {
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !tenantForm.name.trim() ||
      !tenantForm.contactEmail.trim() ||
      !tenantForm.contactPhone.trim() ||
      !tenantForm.addressLine1.trim() ||
      !tenantForm.city.trim() ||
      !tenantForm.ownerName.trim() ||
      !tenantForm.ownerEmail.trim()
    ) {
      setCreateError('Complete all required shop and owner details.');
      return;
    }

    setCreateError('');
    setCreateSuccess('');
    setLatestInvitation(null);
    setCreating(true);

    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tenantForm),
      });
      const data = await res.json();
      if (data.success) {
        setTenantForm(emptyTenantForm);
        setCreateSuccess(`Tenant created for ${data.invitation.ownerEmail}.`);
        setLatestInvitation(data.invitation);
        setIsTenantModalOpen(false);
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

  const handleDeleteTenant = async (id: string) => {
    if (!confirm('Delete this shop? Tenant-linked records may become orphaned.')) {
      return;
    }

    try {
      const res = await fetch(`/api/tenants/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await refreshTenants();
      }
    } catch {
    }
  };

  const handleModuleCheckbox = (moduleKey: string) => {
    setTenantForm((prev) => ({
      ...prev,
      enabledModules: prev.enabledModules.includes(moduleKey)
        ? prev.enabledModules.filter((moduleName) => moduleName !== moduleKey)
        : [...prev.enabledModules, moduleKey],
    }));
  };

  const updateTenantForm = (field: keyof TenantFormState, value: string) => {
    setTenantForm((prev) => ({ ...prev, [field]: value }));
  };

  const openTenantModal = () => {
    setCreateError('');
    setCreateSuccess('');
    setIsTenantModalOpen(true);
  };

  const closeTenantModal = () => {
    if (creating) return;
    setCreateError('');
    setIsTenantModalOpen(false);
  };

  const copyInvitationUrl = async () => {
    if (!latestInvitation?.setupUrl) return;
    await navigator.clipboard.writeText(latestInvitation.setupUrl);
    setCreateSuccess('Invitation URL copied to clipboard.');
  };

  return (
    <div className="flex flex-col h-full bg-surface overflow-y-auto scrollbar-hide">
      <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 mx-auto w-full">
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-on-surface">Registered Tenants ({tenants.length})</h2>
            <button
              type="button"
              onClick={openTenantModal}
              className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-xs font-black uppercase tracking-wider text-on-primary hover:opacity-90"
            >
              New Tenant
            </button>
          </div>

          <div className="space-y-4">
            {tenants.map((tenant) => (
              <div
                key={tenant._id}
                className={`p-4 lg:p-6 rounded-xl bg-surface-container border transition-all ${
                  activeTenant?._id === tenant._id ? 'border-primary shadow-lg shadow-primary/5' : 'border-outline-variant'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={
                        tenant.logoUrl ||
                        'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100&h=100&fit=crop'
                      }
                      alt={tenant.name}
                      className="size-12 rounded-lg object-cover border border-outline-variant bg-surface shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-on-surface truncate">{tenant.name}</h3>
                      <p className="text-[10px] text-on-surface-variant uppercase font-black tracking-widest mt-0.5">
                        Type: {tenant.type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-2 truncate">
                        {tenant.ownerName} • {tenant.ownerEmail}
                      </p>
                      <p className="text-xs text-on-surface-variant truncate">
                        {tenant.addressLine1}, {tenant.city}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
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
                      { key: 'inventory', label: 'Inventory', icon: ClipboardList },
                    ].map((moduleItem) => {
                      const isEnabled = tenant.enabledModules.includes(moduleItem.key as any);
                      const isToggling = togglingId === `${tenant._id}-${moduleItem.key}`;
                      return (
                        <button
                          key={moduleItem.key}
                          onClick={() => handleToggleModule(tenant, moduleItem.key as any)}
                          disabled={isToggling}
                          className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all text-xs font-bold cursor-pointer select-none ${
                            isEnabled
                              ? 'bg-primary/10 border-primary/40 text-primary'
                              : 'bg-surface-container-high/40 border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'
                          } ${isToggling ? 'opacity-50' : ''}`}
                        >
                          <moduleItem.icon size={14} className={isEnabled ? 'text-primary' : 'text-on-surface-variant'} />
                          <span className="truncate">{moduleItem.label}</span>
                          <div
                            className={`size-3.5 rounded-full border ml-auto flex items-center justify-center shrink-0 ${
                              isEnabled ? 'bg-primary border-primary text-on-primary' : 'border-outline-variant'
                            }`}
                          >
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
                <p className="text-sm text-on-surface-variant">No tenants found yet. Create a shop to get started.</p>
              </div>
            )}
          </div>
        </section>

        <aside className="flex flex-col gap-8">
          <section className="space-y-6">
            {latestInvitation && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-wider text-on-surface">Invitation Ready</p>
                    <p className="text-sm text-on-surface-variant truncate">
                      Owner login instructions prepared for {latestInvitation.ownerEmail}
                    </p>
                  </div>
                  <span className="rounded-full bg-surface px-3 py-1 text-[10px] font-black uppercase tracking-wider text-primary shrink-0">
                    {latestInvitation.emailDelivered ? 'Email Sent' : 'Share Manually'}
                  </span>
                </div>

                <div className="rounded-xl border border-outline-variant bg-surface px-3 py-3 text-xs text-on-surface-variant break-all">
                  {latestInvitation.setupUrl}
                </div>

                {latestInvitation.emailError && (
                  <p className="text-xs text-on-surface-variant">
                    Email provider error: {latestInvitation.emailError}
                  </p>
                )}

                <button
                  type="button"
                  onClick={copyInvitationUrl}
                  className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-container-high"
                >
                  <Copy size={14} />
                  Copy login URL
                </button>
              </div>
            )}
          </section>

        </aside>
      </div>

      {isTenantModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 px-4 py-4 lg:py-6 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-outline-variant bg-surface-container shadow-2xl mx-4">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 rounded-t-3xl border-b border-outline-variant bg-surface-container px-4 lg:px-6 py-5">
              <div className="min-w-0">
                <div className="flex items-center gap-3 text-secondary">
                  <UserRoundPlus size={20} />
                  <h3 className="text-xl font-bold text-on-surface">Create Tenant Workspace</h3>
                </div>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Add the shop profile, owner access, and enabled modules in one flow.
                </p>
              </div>

              <button
                type="button"
                onClick={closeTenantModal}
                disabled={creating}
                className="rounded-xl border border-outline-variant p-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface disabled:opacity-40 shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-5 p-4 lg:p-6">
              <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-low/50 p-4 space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Store size={16} />
                  <p className="text-xs font-black uppercase tracking-wider text-on-surface">Shop Details</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-on-surface-variant">Shop Name</label>
                  <input
                    type="text"
                    value={tenantForm.name}
                    onChange={(e) => updateTenantForm('name', e.target.value)}
                    placeholder="e.g. Builders Supply Hardware"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-on-surface-variant">Shop Category</label>
                  <select
                    value={tenantForm.type}
                    onChange={(e) => updateTenantForm('type', e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="bakery">Bakery Shop</option>
                    <option value="restaurant">Restaurant / Bistro</option>
                    <option value="hardware">Hardware Shop</option>
                    <option value="cake_shop">Specialty Cake Shop</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-on-surface-variant">Shop Email</label>
                    <input
                      type="email"
                      value={tenantForm.contactEmail}
                      onChange={(e) => updateTenantForm('contactEmail', e.target.value)}
                      placeholder="shop@example.com"
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-on-surface-variant">Phone</label>
                    <input
                      type="text"
                      value={tenantForm.contactPhone}
                      onChange={(e) => updateTenantForm('contactPhone', e.target.value)}
                      placeholder="+94 77 123 4567"
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-on-surface-variant">Address Line 1</label>
                  <input
                    type="text"
                    value={tenantForm.addressLine1}
                    onChange={(e) => updateTenantForm('addressLine1', e.target.value)}
                    placeholder="No. 24, Main Street"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-on-surface-variant">Address Line 2</label>
                    <input
                      type="text"
                      value={tenantForm.addressLine2}
                      onChange={(e) => updateTenantForm('addressLine2', e.target.value)}
                      placeholder="Optional"
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-on-surface-variant">City</label>
                    <input
                      type="text"
                      value={tenantForm.city}
                      onChange={(e) => updateTenantForm('city', e.target.value)}
                      placeholder="Colombo"
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-low/50 p-4 space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <MailCheck size={16} />
                  <p className="text-xs font-black uppercase tracking-wider text-on-surface">Owner Access</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-on-surface-variant">Owner Name</label>
                    <input
                      type="text"
                      value={tenantForm.ownerName}
                      onChange={(e) => updateTenantForm('ownerName', e.target.value)}
                      placeholder="Shop owner full name"
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-on-surface-variant">Owner Email</label>
                    <input
                      type="email"
                      value={tenantForm.ownerEmail}
                      onChange={(e) => updateTenantForm('ownerEmail', e.target.value)}
                      placeholder="owner@example.com"
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-on-surface-variant">
                  After you create the tenant, the owner receives a login URL by email or terminal output and creates their own password.
                </p>
              </div>

              <div className="space-y-2 rounded-2xl border border-outline-variant/60 bg-surface-container-low/50 p-4">
                <label className="text-[10px] font-black uppercase text-on-surface-variant block mb-1">Select Access Modules</label>
                {[
                  { key: 'analytics', label: 'Analytics' },
                  { key: 'pos', label: 'POS Terminal' },
                  { key: 'kds', label: 'Kitchen Display (KDS)' },
                  { key: 'inventory', label: 'Inventory Logistics' },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-3 text-xs font-bold text-on-surface-variant hover:text-on-surface cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={tenantForm.enabledModules.includes(item.key)}
                      onChange={() => handleModuleCheckbox(item.key)}
                      className="size-4 accent-primary rounded bg-surface-container-low border-outline-variant"
                    />
                    {item.label}
                  </label>
                ))}
              </div>

              {createError && <p className="text-xs text-error font-medium">{createError}</p>}
              {createSuccess && <p className="text-xs text-primary font-medium">{createSuccess}</p>}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeTenantModal}
                  disabled={creating}
                  className="rounded-xl border border-outline-variant px-4 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-primary px-5 py-3 text-sm font-black uppercase tracking-widest text-on-primary hover:opacity-90 disabled:opacity-50"
                >
                  {creating ? 'Creating Tenant...' : 'Add Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
