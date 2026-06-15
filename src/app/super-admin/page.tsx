"use client";

import React, { useState } from "react";
import { useTenant, Tenant } from "@/context/TenantContext";
import {
  Trash2,
  Database,
  Check,
  LayoutDashboard,
  ShoppingBag,
  ChefHat,
  ClipboardList,
  MailCheck,
  Store,
  Copy,
  UserRoundPlus,
  Pencil,
  Power,
  X,
  LassoSelect,
  ShoppingBagIcon,
} from "lucide-react";
import {
  getDefaultPosOrderTypes,
  getPosOrderTypeLabel,
  normalizePosOrderTypes,
  PosOrderType,
  posOrderTypeOptions,
} from "@/lib/pos-order-types";

type TenantFormState = {
  name: string;
  type: "bakery" | "restaurant" | "hardware" | "cake_shop";
  contactEmail: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  ownerName: string;
  ownerEmail: string;
  enabledModules: string[];
  posOrderTypes: PosOrderType[];
};

type InvitationState = {
  ownerEmail: string;
  setupUrl: string;
  emailDelivered: boolean;
  emailError?: string | null;
} | null;

const emptyTenantForm: TenantFormState = {
  name: "",
  type: "bakery",
  contactEmail: "",
  contactPhone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  ownerName: "",
  ownerEmail: "",
  enabledModules: ["analytics", "pos"],
  posOrderTypes: getDefaultPosOrderTypes("bakery", ["analytics", "pos"]),
};

const getTenantFormState = (tenant?: Tenant | null): TenantFormState => {
  if (!tenant) {
    return emptyTenantForm;
  }

  return {
    name: tenant.name,
    type: tenant.type,
    contactEmail: tenant.contactEmail,
    contactPhone: tenant.contactPhone,
    addressLine1: tenant.addressLine1,
    addressLine2: tenant.addressLine2 || "",
    city: tenant.city,
    ownerName: tenant.ownerName,
    ownerEmail: tenant.ownerEmail,
    enabledModules: [...tenant.enabledModules],
    posOrderTypes: tenant.posOrderTypes?.length
      ? [...tenant.posOrderTypes]
      : getDefaultPosOrderTypes(tenant.type, tenant.enabledModules),
  };
};

export default function SuperAdminPage() {
  const { tenants, activeTenant, selectTenant, refreshTenants } = useTenant();

  const [tenantForm, setTenantForm] =
    useState<TenantFormState>(emptyTenantForm);
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [tenantStatusFeedback, setTenantStatusFeedback] = useState("");
  const [latestInvitation, setLatestInvitation] =
    useState<InvitationState>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [statusActionId, setStatusActionId] = useState<string | null>(null);

  const handleToggleModule = async (
    tenant: Tenant,
    moduleKey: "analytics" | "pos" | "kds" | "inventory",
  ) => {
    setTogglingId(`${tenant._id}-${moduleKey}`);
    const alreadyEnabled = tenant.enabledModules.includes(moduleKey);
    let updatedModules = [...tenant.enabledModules];

    if (alreadyEnabled) {
      updatedModules = updatedModules.filter(
        (moduleName) => moduleName !== moduleKey,
      );
    } else {
      updatedModules.push(moduleKey);
    }

    try {
      const normalizedOrderTypes = normalizePosOrderTypes(
        tenant.posOrderTypes,
        tenant.type,
        updatedModules,
      );
      const res = await fetch(`/api/tenants/${tenant._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabledModules: updatedModules,
          posOrderTypes: normalizedOrderTypes,
        }),
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

  const handleSubmitTenant = async (e: React.FormEvent) => {
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
      setCreateError("Complete all required shop and owner details.");
      return;
    }

    setCreateError("");
    setCreateSuccess("");
    if (!editingTenantId) {
      setLatestInvitation(null);
    }
    setCreating(true);

    try {
      const res = await fetch(
        editingTenantId ? `/api/tenants/${editingTenantId}` : "/api/tenants",
        {
          method: editingTenantId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tenantForm),
        },
      );
      const data = await res.json();
      if (data.success) {
        setTenantForm(emptyTenantForm);
        setEditingTenantId(null);
        if (editingTenantId) {
          setCreateSuccess(`Tenant updated for ${tenantForm.name}.`);
        } else {
          setCreateSuccess(`Tenant created for ${data.invitation.ownerEmail}.`);
          setLatestInvitation(data.invitation);
        }
        setIsTenantModalOpen(false);
        await refreshTenants();
      } else {
        setCreateError(
          data.message ||
            `Failed to ${editingTenantId ? "update" : "create"} shop.`,
        );
      }
    } catch (err: any) {
      setCreateError(err.message || "Error occurred.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTenant = async (id: string) => {
    if (
      !confirm("Delete this shop? Tenant-linked records may become orphaned.")
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/tenants/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await refreshTenants();
      }
    } catch {}
  };

  const handleToggleTenantStatus = async (tenant: Tenant) => {
    const isCurrentlyActive = tenant.isActive !== false;
    setStatusActionId(tenant._id);
    setTenantStatusFeedback("");

    try {
      const res = await fetch(`/api/tenants/${tenant._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isCurrentlyActive }),
      });
      const data = await res.json();
      if (data.success) {
        setTenantStatusFeedback(
          `${tenant.name} ${isCurrentlyActive ? "deactivated" : "activated"} successfully.`,
        );
        await refreshTenants();
      } else {
        setTenantStatusFeedback(
          data.message || "Failed to update tenant status.",
        );
      }
    } catch {
      setTenantStatusFeedback("Failed to update tenant status.");
    } finally {
      setStatusActionId(null);
    }
  };

  const handleModuleCheckbox = (moduleKey: string) => {
    setTenantForm((prev) => {
      const nextModules = prev.enabledModules.includes(moduleKey)
        ? prev.enabledModules.filter((moduleName) => moduleName !== moduleKey)
        : [...prev.enabledModules, moduleKey];

      return {
        ...prev,
        enabledModules: nextModules,
        posOrderTypes: normalizePosOrderTypes(
          prev.posOrderTypes,
          prev.type,
          nextModules,
        ),
      };
    });
  };

  const updateTenantForm = (field: keyof TenantFormState, value: string) => {
    setTenantForm((prev) => {
      if (field === "type") {
        const nextType = value as TenantFormState["type"];
        return {
          ...prev,
          type: nextType,
          posOrderTypes: normalizePosOrderTypes(
            prev.posOrderTypes,
            nextType,
            prev.enabledModules,
          ),
        };
      }

      return { ...prev, [field]: value };
    });
  };

  const handleTenantOrderTypeToggle = async (
    tenant: Tenant,
    orderType: PosOrderType,
  ) => {
    const currentOrderTypes = tenant.posOrderTypes?.length
      ? tenant.posOrderTypes
      : getDefaultPosOrderTypes(tenant.type, tenant.enabledModules);
    const nextOrderTypes = currentOrderTypes.includes(orderType)
      ? currentOrderTypes.filter((item) => item !== orderType)
      : [...currentOrderTypes, orderType];

    const normalizedOrderTypes = normalizePosOrderTypes(
      nextOrderTypes,
      tenant.type,
      tenant.enabledModules,
    );

    try {
      const res = await fetch(`/api/tenants/${tenant._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posOrderTypes: normalizedOrderTypes }),
      });
      const data = await res.json();
      if (data.success) {
        await refreshTenants();
      }
    } catch {}
  };

  const handleFormOrderTypeToggle = (orderType: PosOrderType) => {
    setTenantForm((prev) => ({
      ...prev,
      posOrderTypes: normalizePosOrderTypes(
        prev.posOrderTypes.includes(orderType)
          ? prev.posOrderTypes.filter((item) => item !== orderType)
          : [...prev.posOrderTypes, orderType],
        prev.type,
        prev.enabledModules,
      ),
    }));
  };

  const openTenantModal = (tenant?: Tenant) => {
    setCreateError("");
    setCreateSuccess("");
    setEditingTenantId(tenant?._id || null);
    setTenantForm(getTenantFormState(tenant));
    setIsTenantModalOpen(true);
  };

  const closeTenantModal = () => {
    if (creating) return;
    setCreateError("");
    setEditingTenantId(null);
    setTenantForm(emptyTenantForm);
    setIsTenantModalOpen(false);
  };

  const copyInvitationUrl = async () => {
    if (!latestInvitation?.setupUrl) return;
    await navigator.clipboard.writeText(latestInvitation.setupUrl);
    setCreateSuccess("Invitation URL copied to clipboard.");
  };

  return (
    <div className="flex flex-col h-full bg-surface overflow-y-auto scrollbar-hide">
      <div className="mx-auto w-full space-y-6 p-4 lg:space-y-8 lg:p-8">
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-on-surface">
              Registered Tenants ({tenants.length})
            </h2>
            <button
              type="button"
              onClick={() => openTenantModal()}
              className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold tracking-wider text-on-primary hover:opacity-90"
            >
              New Tenant
            </button>
          </div>

          <div className="space-y-4">
            {tenantStatusFeedback && (
              <div className="rounded-xl border border-outline-variant bg-surface px-4 py-3 text-sm text-on-surface-variant">
                {tenantStatusFeedback}
              </div>
            )}

            {tenants.map((tenant) =>
              (() => {
                const isTenantActive = tenant.isActive !== false;

                return (
                  <div
                    key={tenant._id}
                    className={`rounded-xl border bg-surface-container p-4 transition-all lg:p-6 ${
                      activeTenant?._id === tenant._id
                        ? "border-primary shadow-lg shadow-primary/5"
                        : "border-outline-variant"
                    }`}
                  >
                    <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="flex min-w-0 items-center gap-4">
                        <img
                          src={
                            tenant.logoUrl ||
                            "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100&h=100&fit=crop"
                          }
                          alt={tenant.name}
                          className="size-12 shrink-0 rounded-lg border border-outline-variant bg-surface object-cover"
                        />
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-bold text-on-surface">
                            {tenant.name}
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <p className="text-[10px] font-bold tracking-widest text-on-surface-variant">
                              Type: {tenant.type.replace("_", " ")}
                            </p>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                                isTenantActive
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : "bg-amber-500/10 text-amber-600"
                              }`}
                            >
                              {isTenantActive
                                ? "Active workspace"
                                : "Deactivated"}
                            </span>
                          </div>
                          <p className="mt-2 truncate text-xs text-on-surface-variant">
                            {tenant.ownerName} | {tenant.ownerEmail}
                          </p>
                          <p className="truncate text-xs text-on-surface-variant">
                            {tenant.addressLine1}, {tenant.city}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-end gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => selectTenant(tenant._id)}
                          className={`rounded-md px-3 py-1 text-xs font-bold transition-all ${
                            activeTenant?._id === tenant._id
                              ? "bg-primary text-on-primary"
                              : "bg-surface-container-high text-on-surface hover:bg-surface-variant"
                          }`}
                        >
                          {activeTenant?._id === tenant._id
                            ? "Active"
                            : "Select"}
                        </button>

                        <button
                          type="button"
                          onClick={() => openTenantModal(tenant)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-outline-variant px-3 py-1 text-xs font-bold text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface"
                        >
                          <Pencil size={13} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleTenantStatus(tenant)}
                          disabled={statusActionId === tenant._id}
                          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold transition-all ${
                            isTenantActive
                              ? "border border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15"
                              : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15"
                          } disabled:opacity-50`}
                        >
                          <Power size={13} />
                          {statusActionId === tenant._id
                            ? "Saving..."
                            : isTenantActive
                              ? "Deactivate"
                              : "Activate"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteTenant(tenant._id)}
                          className="cursor-pointer rounded-md p-1 text-on-surface-variant transition-all hover:bg-error/10 hover:text-error"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-outline-variant/30 pt-4">
                      <p className="mb-3 text-xs font-black uppercase tracking-wider text-on-surface-variant">
                        Enabled Modules
                      </p>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                          {
                            key: "analytics",
                            label: "Analytics",
                            icon: LayoutDashboard,
                          },
                          {
                            key: "pos",
                            label: "POS System",
                            icon: ShoppingBag,
                          },
                          { key: "kds", label: "Kitchen (KDS)", icon: ChefHat },
                          {
                            key: "inventory",
                            label: "Inventory",
                            icon: ClipboardList,
                          },
                        ].map((moduleItem) => {
                          const isEnabled = tenant.enabledModules.includes(
                            moduleItem.key as any,
                          );
                          const isToggling =
                            togglingId === `${tenant._id}-${moduleItem.key}`;
                          return (
                            <button
                              key={moduleItem.key}
                              type="button"
                              onClick={() =>
                                handleToggleModule(
                                  tenant,
                                  moduleItem.key as any,
                                )
                              }
                              disabled={isToggling}
                              className={`flex cursor-pointer select-none items-center gap-2.5 rounded-lg border p-2.5 text-left text-xs font-bold transition-all ${
                                isEnabled
                                  ? "border-primary/40 bg-primary/10 text-primary"
                                  : "border-outline-variant/30 bg-surface-container-high/40 text-on-surface-variant hover:bg-surface-container-high"
                              } ${isToggling ? "opacity-50" : ""}`}
                            >
                              <moduleItem.icon
                                size={14}
                                className={
                                  isEnabled
                                    ? "text-primary"
                                    : "text-on-surface-variant"
                                }
                              />
                              <span className="truncate">
                                {moduleItem.label}
                              </span>
                              <div
                                className={`ml-auto flex size-3.5 shrink-0 items-center justify-center rounded-full border ${
                                  isEnabled
                                    ? "border-primary bg-primary text-on-primary"
                                    : "border-outline-variant"
                                }`}
                              >
                                {isEnabled && (
                                  <Check size={10} strokeWidth={3} />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4 border-t border-outline-variant/30 pt-4">
                      <p className="mb-3 text-xs font-black uppercase tracking-wider text-on-surface-variant">
                        POS Order Types
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {posOrderTypeOptions.map((orderType) => {
                          const activeOrderTypes = tenant.posOrderTypes?.length
                            ? tenant.posOrderTypes
                            : getDefaultPosOrderTypes(
                                tenant.type,
                                tenant.enabledModules,
                              );
                          const isEnabled = activeOrderTypes.includes(
                            orderType.key,
                          );
                          return (
                            <button
                              key={orderType.key}
                              type="button"
                              onClick={() =>
                                handleTenantOrderTypeToggle(
                                  tenant,
                                  orderType.key,
                                )
                              }
                              className={`rounded-full border px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-all ${
                                isEnabled
                                  ? "border-primary/40 bg-primary/10 text-primary"
                                  : "border-outline-variant/30 bg-surface-container-high/40 text-on-surface-variant hover:bg-surface-container-high"
                              }`}
                            >
                              {orderType.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })(),
            )}

            {tenants.length === 0 && (
              <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container/20 py-16 text-center">
                <Database
                  className="mx-auto mb-4 text-on-surface-variant/40"
                  size={48}
                  strokeWidth={1}
                />
                <p className="text-sm text-on-surface-variant">
                  No tenants found yet. Create a shop to get started.
                </p>
              </div>
            )}
          </div>
        </section>

        <aside className="flex flex-col gap-8">
          <section className="space-y-6">
            {latestInvitation && (
              <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-wider text-on-surface">
                      Invitation Ready
                    </p>
                    <p className="truncate text-sm text-on-surface-variant">
                      Owner login instructions prepared for{" "}
                      {latestInvitation.ownerEmail}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-surface px-3 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
                    {latestInvitation.emailDelivered
                      ? "Email Sent"
                      : "Share Manually"}
                  </span>
                </div>

                <div className="break-all rounded-xl border border-outline-variant bg-surface px-3 py-3 text-xs text-on-surface-variant">
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
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 px-4 py-4 backdrop-blur-sm lg:py-6">
          <div className="mx-4 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-outline-variant bg-surface-container shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 rounded-t-3xl border-b border-outline-variant bg-surface-container px-4 py-5 lg:px-6">
              <div className="min-w-0">
                <div className="flex items-center gap-3 text-secondary">
                  <UserRoundPlus size={20} />
                  <h3 className="text-xl font-bold text-on-surface">
                    {editingTenantId
                      ? "Edit Tenant Workspace"
                      : "Create Tenant Workspace"}
                  </h3>
                </div>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {editingTenantId
                    ? "Update the shop profile and owner access in one place."
                    : "Add the shop profile, owner access, and enabled modules in one flow."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeTenantModal}
                disabled={creating}
                className="shrink-0 rounded-xl border border-outline-variant p-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface disabled:opacity-40"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSubmitTenant}
              className="space-y-5 p-4 lg:p-6"
            >
              <div className="space-y-4 rounded-2xl border border-outline-variant/60 bg-surface-container-low/50 p-4">
                <div className="flex items-center gap-2 text-primary">
                  <Store size={16} />
                  <p className="text-xs font-black uppercase tracking-wider text-on-surface">
                    Shop Details
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant">
                    Shop Name
                  </label>
                  <input
                    type="text"
                    value={tenantForm.name}
                    onChange={(e) => updateTenantForm("name", e.target.value)}
                    placeholder="e.g. Builders Supply Hardware"
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low p-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant">
                    Shop Category
                  </label>
                  <select
                    value={tenantForm.type}
                    onChange={(e) => updateTenantForm("type", e.target.value)}
                    className="w-full cursor-pointer rounded-lg border border-outline-variant bg-surface-container-low p-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="bakery">Bakery Shop</option>
                    <option value="restaurant">Restaurant / Bistro</option>
                    <option value="hardware">Hardware Shop</option>
                    <option value="cake_shop">Specialty Cake Shop</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant">
                      Shop Email
                    </label>
                    <input
                      type="email"
                      value={tenantForm.contactEmail}
                      onChange={(e) =>
                        updateTenantForm("contactEmail", e.target.value)
                      }
                      placeholder="shop@example.com"
                      className="w-full rounded-lg border border-outline-variant bg-surface-container-low p-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={tenantForm.contactPhone}
                      onChange={(e) =>
                        updateTenantForm("contactPhone", e.target.value)
                      }
                      placeholder="+94 77 123 4567"
                      className="w-full rounded-lg border border-outline-variant bg-surface-container-low p-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    value={tenantForm.addressLine1}
                    onChange={(e) =>
                      updateTenantForm("addressLine1", e.target.value)
                    }
                    placeholder="No. 24, Main Street"
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low p-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      value={tenantForm.addressLine2}
                      onChange={(e) =>
                        updateTenantForm("addressLine2", e.target.value)
                      }
                      placeholder="Optional"
                      className="w-full rounded-lg border border-outline-variant bg-surface-container-low p-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant">
                      City
                    </label>
                    <input
                      type="text"
                      value={tenantForm.city}
                      onChange={(e) => updateTenantForm("city", e.target.value)}
                      placeholder="Colombo"
                      className="w-full rounded-lg border border-outline-variant bg-surface-container-low p-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-outline-variant/60 bg-surface-container-low/50 p-4">
                <div className="flex items-center gap-2 text-primary">
                  <MailCheck size={16} />
                  <p className="text-xs font-black uppercase tracking-wider text-on-surface">
                    Owner Access
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant">
                      Owner Name
                    </label>
                    <input
                      type="text"
                      value={tenantForm.ownerName}
                      onChange={(e) =>
                        updateTenantForm("ownerName", e.target.value)
                      }
                      placeholder="Shop owner full name"
                      className="w-full rounded-lg border border-outline-variant bg-surface-container-low p-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant">
                      Owner Email
                    </label>
                    <input
                      type="email"
                      value={tenantForm.ownerEmail}
                      onChange={(e) =>
                        updateTenantForm("ownerEmail", e.target.value)
                      }
                      placeholder="owner@example.com"
                      className="w-full rounded-lg border border-outline-variant bg-surface-container-low p-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-on-surface-variant">
                  {editingTenantId
                    ? "If you update the owner email here, the tenant admin login email updates too."
                    : "After you create the tenant, the owner receives a login URL by email or terminal output and creates their own password."}
                </p>
              </div>

              <div className="space-y-3 rounded-2xl border border-outline-variant/60 bg-surface-container-low/50 p-4">
                <div className="mb-3 flex items-center gap-2 text-primary">
                  <LassoSelect size={16} />
                  <p className="text-xs font-black uppercase tracking-wider text-on-surface">
                    Select Access Modules
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { key: "analytics", label: "Analytics" },
                    { key: "pos", label: "POS Terminal" },
                    { key: "kds", label: "Kitchen Display (KDS)" },
                    { key: "inventory", label: "Inventory Logistics" },
                  ].map((item) => {
                    const isSelected = tenantForm.enabledModules.includes(
                      item.key,
                    );

                    return (
                      <label
                        key={item.key}
                        className={`flex min-h-[52px] cursor-pointer select-none items-center gap-3 rounded-xl border px-3 py-3 text-xs font-bold transition-all ${
                          isSelected
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "border-outline-variant bg-surface text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleModuleCheckbox(item.key)}
                          className="size-4 shrink-0 rounded border-outline-variant bg-surface-container-low accent-primary"
                        />
                        <span className="leading-relaxed">{item.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-outline-variant/60 bg-surface-container-low/50 p-4">
                <div>
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <ShoppingBagIcon size={16} />
                    <p className="text-xs font-black uppercase tracking-wider text-on-surface">
                      POS Order Types
                    </p>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    Choose the transaction flow this shop should see in the
                    sales terminal.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {posOrderTypeOptions.map((orderType) => {
                    const isEnabled = tenantForm.posOrderTypes.includes(
                      orderType.key,
                    );
                    return (
                      <button
                        key={orderType.key}
                        type="button"
                        onClick={() => handleFormOrderTypeToggle(orderType.key)}
                        className={`rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-wider transition-all ${
                          isEnabled
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "border-outline-variant/30 bg-surface-container-high/40 text-on-surface-variant hover:bg-surface-container-high"
                        }`}
                      >
                        {getPosOrderTypeLabel(orderType.key)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {createError && (
                <p className="text-xs font-medium text-error">{createError}</p>
              )}
              {createSuccess && (
                <p className="text-xs font-medium text-primary">
                  {createSuccess}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-primary px-5 py-3 text-sm font-bold tracking-widest text-on-primary hover:opacity-90 disabled:opacity-50"
                >
                  {creating
                    ? editingTenantId
                      ? "Saving Changes..."
                      : "Creating Tenant..."
                    : editingTenantId
                      ? "Save Changes"
                      : "Add Tenant"}
                </button>
                <button
                  type="button"
                  onClick={closeTenantModal}
                  disabled={creating}
                  className="rounded-xl border border-outline-variant px-4 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface disabled:opacity-40"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
