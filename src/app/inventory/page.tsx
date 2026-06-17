'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  AlertTriangle,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Plus,
  Search,
  Calendar,
  ShieldAlert,
  Loader2,
  FileSpreadsheet,
  Upload,
  X,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { cn } from '@/lib/utils';
import { useTenant } from '@/context/TenantContext';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { mapInventoryImportRows } from '@/lib/excel-import';

type InventoryForm = {
  id: string | null;
  name: string;
  category: string;
  currentStock: number;
  sku: string;
  barcode: string;
  unit: string;
  bestBefore: string;
};

const emptyInventoryForm: InventoryForm = {
  id: null,
  name: '',
  category: '',
  currentStock: 0,
  sku: '',
  barcode: '',
  unit: 'kg',
  bestBefore: '',
};

export default function InventoryPage() {
  const { activeTenant, loading: tenantLoading } = useTenant();
  const [inventory, setInventory] = useState<any[]>([]);
  const [wasteLogs, setWasteLogs] = useState<any[]>([]);

  const [loadingData, setLoadingData] = useState(true);
  const [tab, setTab] = useState<'inventory' | 'waste' | 'expiry'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [inventorySortKey, setInventorySortKey] = useState<'name' | 'currentStock' | 'bestBefore'>('name');
  const [inventorySortDirection, setInventorySortDirection] = useState<'asc' | 'desc'>('asc');
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryPageSize, setInventoryPageSize] = useState(5);
  const [wasteSearchQuery, setWasteSearchQuery] = useState('');
  const [wasteSortKey, setWasteSortKey] = useState<'name' | 'amount' | 'reason' | 'createdAt'>('createdAt');
  const [wasteSortDirection, setWasteSortDirection] = useState<'asc' | 'desc'>('desc');
  const [wastePage, setWastePage] = useState(1);
  const [wastePageSize, setWastePageSize] = useState(10);
  const [expirySearchQuery, setExpirySearchQuery] = useState('');
  const [expirySortKey, setExpirySortKey] = useState<'name' | 'currentStock' | 'bestBefore'>('bestBefore');
  const [expirySortDirection, setExpirySortDirection] = useState<'asc' | 'desc'>('asc');
  const [expiryPage, setExpiryPage] = useState(1);
  const [expiryPageSize, setExpiryPageSize] = useState(10);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [inventoryForm, setInventoryForm] = useState<InventoryForm>(emptyInventoryForm);
  const [savingItem, setSavingItem] = useState(false);
  const [importingInventory, setImportingInventory] = useState(false);
  const inventoryImportRef = useRef<HTMLInputElement | null>(null);

  const [wasteItemId, setWasteItemId] = useState('');
  const [wasteAmount, setWasteAmount] = useState<number | ''>('');
  const [wasteReason, setWasteReason] = useState('Expired');
  const [loggingWaste, setLoggingWaste] = useState(false);
  const [showWasteForm, setShowWasteForm] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [pendingDeleteItem, setPendingDeleteItem] = useState<{ id: string; name: string } | null>(null);

  const fetchData = async (silent = false) => {
    if (!activeTenant) return;
    if (!silent) setLoadingData(true);
    try {
      const [invRes, wasteRes] = await Promise.all([
        fetch(`/api/inventory?tenantId=${activeTenant._id}`),
        fetch(`/api/inventory/waste?tenantId=${activeTenant._id}`),
      ]);

      const invData = await invRes.json();
      const wasteData = await wasteRes.json();

      if (invData.success) setInventory(invData.data);
      if (wasteData.success) setWasteLogs(wasteData.data);
    } catch {
    } finally {
      if (!silent) setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!activeTenant) return;
    fetchData();
    setShowAddForm(false);
    setShowWasteForm(false);
    setWasteItemId('');
    setWasteAmount('');
    setInventoryForm(emptyInventoryForm);
    setFeedbackMessage('');
  }, [activeTenant]);

  useEffect(() => {
    setInventoryPage(1);
  }, [searchQuery, inventorySortKey, inventorySortDirection, inventoryPageSize, tab]);

  useEffect(() => {
    setWastePage(1);
  }, [wasteSearchQuery, wasteSortKey, wasteSortDirection, wastePageSize, tab]);

  useEffect(() => {
    setExpiryPage(1);
  }, [expirySearchQuery, expirySortKey, expirySortDirection, expiryPageSize, tab]);

  const updateInventoryForm = (field: keyof InventoryForm, value: string | number) => {
    setInventoryForm((prev) => ({ ...prev, [field]: value }));
  };

  const openCreateForm = () => {
    setFeedbackMessage('');
    setInventoryForm(emptyInventoryForm);
    setShowAddForm(true);
  };

  const openEditForm = (item: any) => {
    setFeedbackMessage('');
    setInventoryForm({
      id: item._id,
      name: item.name,
      category: item.category,
      currentStock: item.currentStock,
      sku: item.sku || '',
      barcode: item.barcode || '',
      unit: item.unit,
      bestBefore: item.bestBefore === 'N/A' ? '' : item.bestBefore || '',
    });
    setShowAddForm(true);
  };

  const closeAddForm = () => {
    if (savingItem) return;
    setShowAddForm(false);
    setInventoryForm(emptyInventoryForm);
  };

  const openImportForm = () => {
    setFeedbackMessage('');
    setShowImportForm(true);
  };

  const closeImportForm = () => {
    if (importingInventory) return;
    setShowImportForm(false);
  };

  const openWasteForm = () => {
    setFeedbackMessage('');
    setShowWasteForm(true);
  };

  const closeWasteForm = () => {
    if (loggingWaste) return;
    setShowWasteForm(false);
  };

  const handleSaveInventoryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inventoryForm.name.trim() || !inventoryForm.category.trim() || !inventoryForm.unit.trim()) {
      setFeedbackMessage('Please fill out all required inventory fields.');
      return;
    }

    setSavingItem(true);
    setFeedbackMessage('');

    try {
      const res = await fetch('/api/inventory', {
        method: inventoryForm.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: inventoryForm.id || undefined,
          tenantId: activeTenant?._id,
          name: inventoryForm.name.trim(),
          category: inventoryForm.category.trim(),
          currentStock: inventoryForm.currentStock,
          sku: inventoryForm.sku.trim(),
          barcode: inventoryForm.barcode.trim(),
          unit: inventoryForm.unit.trim(),
          bestBefore: inventoryForm.bestBefore.trim() || 'N/A',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setInventoryForm(emptyInventoryForm);
        setShowAddForm(false);
        setFeedbackMessage(inventoryForm.id ? 'Inventory item updated successfully.' : 'Inventory item added successfully.');
        await fetchData(true);
      } else {
        setFeedbackMessage(data.message || 'Failed to save inventory item.');
      }
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteInventoryItem = async (id: string) => {
    try {
      const res = await fetch(`/api/inventory?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        if (inventoryForm.id === id) {
          setInventoryForm(emptyInventoryForm);
          setShowAddForm(false);
        }
        setFeedbackMessage('Inventory item deleted successfully.');
        await fetchData(true);
      } else {
        setFeedbackMessage(data.message || 'Failed to delete inventory item.');
      }
    } catch {
      setFeedbackMessage('Network error while deleting inventory item.');
    }
  };

  const confirmDeleteInventoryItem = async () => {
    if (!pendingDeleteItem) return;
    await handleDeleteInventoryItem(pendingDeleteItem.id);
    setPendingDeleteItem(null);
  };

  const handleLogWaste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wasteItemId || !wasteAmount || Number(wasteAmount) <= 0) {
      setFeedbackMessage('Please select an item and specify a valid waste amount.');
      return;
    }

    setLoggingWaste(true);
    setFeedbackMessage('');
    try {
      const res = await fetch('/api/inventory/waste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenant?._id,
          ingredientId: wasteItemId,
          amount: Number(wasteAmount),
          reason: wasteReason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setWasteAmount('');
        setWasteItemId('');
        setWasteReason('Expired');
        setShowWasteForm(false);
        setFeedbackMessage('Waste logged successfully and stock was updated.');
        await fetchData(true);
      } else {
        setFeedbackMessage('Failed to log waste: ' + data.message);
      }
    } finally {
      setLoggingWaste(false);
    }
  };

  const handleImportInventory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeTenant?._id) return;

    setImportingInventory(true);
    setFeedbackMessage('');

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' });
      const rows = mapInventoryImportRows(rawRows);

      if (rows.length === 0) {
        throw new Error('No valid inventory rows were found in the Excel sheet.');
      }

      const res = await fetch('/api/inventory/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenant._id,
          rows,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedbackMessage(data.message || 'Inventory imported successfully.');
        await fetchData(true);
        setShowImportForm(false);
      } else {
        setFeedbackMessage(data.message || 'Failed to import inventory.');
      }
    } catch (error: any) {
      setFeedbackMessage(error.message || 'Failed to import the Excel file.');
    } finally {
      e.target.value = '';
      setImportingInventory(false);
    }
  };

  if (tenantLoading || (activeTenant && loadingData)) {
    return (
      <div className="flex items-center justify-center h-full bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant text-sm font-black tracking-widest">Loading Inventory...</p>
        </div>
      </div>
    );
  }

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

  const totalItemsCount = inventory.length;
  const lowStockThreshold = activeTenant.type === 'hardware' ? 6 : 20;
  const lowStockItems = inventory.filter((item) => item.currentStock < lowStockThreshold);
  const lowStockCount = lowStockItems.length;
  const expiringSoonItems = inventory.filter((item) => item.bestBefore && item.bestBefore !== 'N/A');
  const expiringSoonCount = expiringSoonItems.length;
  const totalWasteAmount = wasteLogs.reduce((sum, waste) => sum + waste.amount, 0);
  const wasteActionLabel = activeTenant.type === 'hardware' ? 'Log Damage / Loss' : 'Log Damage / Waste';

  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(item.sku || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(item.barcode || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedInventory = [...filteredInventory].sort((a, b) => {
    if (inventorySortKey === 'currentStock') {
      const valueA = Number(a.currentStock || 0);
      const valueB = Number(b.currentStock || 0);
      return inventorySortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    }

    if (inventorySortKey === 'bestBefore') {
      const valueA = String(a.bestBefore || 'N/A');
      const valueB = String(b.bestBefore || 'N/A');
      return inventorySortDirection === 'asc'
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }

    const valueA = String(a.name || '');
    const valueB = String(b.name || '');
    return inventorySortDirection === 'asc'
      ? valueA.localeCompare(valueB)
      : valueB.localeCompare(valueA);
  });

  const inventoryTotalPages = Math.max(1, Math.ceil(sortedInventory.length / inventoryPageSize));
  const paginatedInventory = sortedInventory.slice(
    (inventoryPage - 1) * inventoryPageSize,
    inventoryPage * inventoryPageSize
  );

  const filteredWasteLogs = wasteLogs.filter((log) => {
    const item = log.ingredientId;
    const query = wasteSearchQuery.toLowerCase();
    return (
      String(item?.name || '').toLowerCase().includes(query) ||
      String(item?.category || '').toLowerCase().includes(query) ||
      String(log.reason || '').toLowerCase().includes(query) ||
      new Date(log.createdAt).toLocaleDateString().toLowerCase().includes(query)
    );
  });

  const sortedWasteLogs = [...filteredWasteLogs].sort((a, b) => {
    if (wasteSortKey === 'amount') {
      const valueA = Number(a.amount || 0);
      const valueB = Number(b.amount || 0);
      return wasteSortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    }

    if (wasteSortKey === 'createdAt') {
      const valueA = new Date(a.createdAt).getTime();
      const valueB = new Date(b.createdAt).getTime();
      return wasteSortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    }

    if (wasteSortKey === 'reason') {
      const valueA = String(a.reason || '');
      const valueB = String(b.reason || '');
      return wasteSortDirection === 'asc'
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }

    const valueA = String(a.ingredientId?.name || '');
    const valueB = String(b.ingredientId?.name || '');
    return wasteSortDirection === 'asc'
      ? valueA.localeCompare(valueB)
      : valueB.localeCompare(valueA);
  });

  const wasteTotalPages = Math.max(1, Math.ceil(sortedWasteLogs.length / wastePageSize));
  const paginatedWasteLogs = sortedWasteLogs.slice(
    (wastePage - 1) * wastePageSize,
    wastePage * wastePageSize
  );

  const filteredExpiryItems = expiringSoonItems.filter((item) => {
    const query = expirySearchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      String(item.sku || '').toLowerCase().includes(query) ||
      String(item.barcode || '').toLowerCase().includes(query) ||
      String(item.bestBefore || '').toLowerCase().includes(query)
    );
  });

  const sortedExpiryItems = [...filteredExpiryItems].sort((a, b) => {
    if (expirySortKey === 'currentStock') {
      const valueA = Number(a.currentStock || 0);
      const valueB = Number(b.currentStock || 0);
      return expirySortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    }

    if (expirySortKey === 'bestBefore') {
      const valueA = String(a.bestBefore || 'N/A');
      const valueB = String(b.bestBefore || 'N/A');
      return expirySortDirection === 'asc'
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }

    const valueA = String(a.name || '');
    const valueB = String(b.name || '');
    return expirySortDirection === 'asc'
      ? valueA.localeCompare(valueB)
      : valueB.localeCompare(valueA);
  });

  const expiryTotalPages = Math.max(1, Math.ceil(sortedExpiryItems.length / expiryPageSize));
  const paginatedExpiryItems = sortedExpiryItems.slice(
    (expiryPage - 1) * expiryPageSize,
    expiryPage * expiryPageSize
  );

  const handleInventorySort = (key: 'name' | 'currentStock' | 'bestBefore') => {
    if (inventorySortKey === key) {
      setInventorySortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setInventorySortKey(key);
    setInventorySortDirection(key === 'currentStock' ? 'desc' : 'asc');
  };

  const handleWasteSort = (key: 'name' | 'amount' | 'reason' | 'createdAt') => {
    if (wasteSortKey === key) {
      setWasteSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setWasteSortKey(key);
    setWasteSortDirection(key === 'createdAt' || key === 'amount' ? 'desc' : 'asc');
  };

  const handleExpirySort = (key: 'name' | 'currentStock' | 'bestBefore') => {
    if (expirySortKey === key) {
      setExpirySortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setExpirySortKey(key);
    setExpirySortDirection(key === 'currentStock' ? 'desc' : 'asc');
  };

  return (
    <div className="flex flex-col h-full bg-surface">
      <header className="px-4 md:px-6 xl:px-10 py-4 lg:py-5 border-b border-outline-variant bg-surface-container-low/50 space-y-4 lg:space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:flex md:flex-wrap md:items-center">
            <button
              onClick={openCreateForm}
              className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-2 py-2.5 text-[11px] font-black tracking-wide text-on-primary hover:opacity-90 active:scale-95 transition-all md:gap-2 md:px-4 md:text-xs md:tracking-wider shrink-0"
            >
              <Plus size={14} />
              <span className="truncate">Add Item</span>
            </button>
            <input
              ref={inventoryImportRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportInventory}
              className="hidden"
            />
            <button
              type="button"
              onClick={openImportForm}
              className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-outline-variant bg-surface px-2 py-2.5 text-[11px] font-bold text-on-surface hover:bg-surface-container-high disabled:opacity-50 md:gap-2 md:px-4 md:text-xs shrink-0"
            >
              <Upload size={14} />
              <span className="truncate">Import Excel</span>
            </button>
            <button
              type="button"
              onClick={openWasteForm}
              className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-outline-variant bg-surface px-2 py-2.5 text-[11px] font-bold text-on-surface hover:bg-surface-container-high md:gap-2 md:px-4 md:text-xs shrink-0"
            >
              <Trash2 size={14} />
              <span className="truncate">{wasteActionLabel}</span>
            </button>
          </div>
        </div>

        <div className="flex gap-6 lg:gap-8 overflow-x-auto no-scrollbar">
          {(['inventory', 'waste', 'expiry'] as const).map((section) => (
            <button
              key={section}
              onClick={() => {
                setTab(section);
              }}
              className={cn(
                'pb-3 text-sm font-bold tracking-wider uppercase transition-all relative cursor-pointer whitespace-nowrap',
                tab === section ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              )}
            >
              <span className="capitalize">{section}</span>
              {tab === section && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-full" />}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 xl:p-8 overflow-y-auto scrollbar-hide grid grid-cols-12 auto-rows-max items-start gap-4 xl:gap-6">
        <div className="col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 items-start">
          {[
            {
              label: 'Total Items',
              val: totalItemsCount.toString(),
              delta: 'Items in active stock list',
              icon: Package,
              color: 'text-primary',
            },
            {
              label: 'Low Stock',
              val: lowStockCount.toString(),
              delta: lowStockCount > 0 ? 'Needs replenishment' : 'Inventory is healthy',
              icon: AlertTriangle,
              color: lowStockCount > 0 ? 'text-secondary' : 'text-on-surface-variant',
            },
            {
              label: 'Wasted Qty',
              val: totalWasteAmount.toString(),
              delta: `${wasteLogs.length} waste logs recorded`,
              icon: Trash2,
              color: 'text-error',
            },
            {
              label: 'Dated Items',
              val: expiringSoonCount.toString(),
              delta: 'Items with expiry tracking',
              icon: Calendar,
              color: 'text-tertiary',
            },
          ].map((stat, index) => (
            <div
              key={index}
              className="self-start p-4 lg:p-5 rounded-xl bg-surface-container border border-outline-variant hover:border-outline transition-colors group"
            >
              <div className="flex justify-between items-start mb-1.5 gap-3">
                <p className="text-on-surface-variant text-[10px] lg:text-xs font-bold uppercase tracking-widest">
                  {stat.label}
                </p>
                <stat.icon className={cn('transition-transform group-hover:scale-110 shrink-0', stat.color)} size={18} />
              </div>
              <p className="text-xl lg:text-2xl font-black tracking-tight text-on-surface mb-0.5 truncate">{stat.val}</p>
              <span className="text-[10px] font-bold text-on-surface-variant">{stat.delta}</span>
            </div>
          ))}
        </div>

        <div className="col-span-12 space-y-6">
          {feedbackMessage && (
            <div className="rounded-xl border border-outline-variant bg-surface-container px-4 py-3 text-sm text-on-surface-variant">
              {feedbackMessage}
            </div>
          )}

          {tab === 'inventory' ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="relative min-w-[260px] flex-1 lg:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                    <input
                      type="text"
                      placeholder="Search name, SKU, or barcode..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-10 w-full lg:w-100 rounded-lg border border-outline-variant bg-surface pl-10 text-sm text-on-surface placeholder:text-on-surface-variant focus:ring-1 focus:ring-primary outline-none"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-on-surface-variant">
                    Sort by
                    <select
                      value={`${inventorySortKey}:${inventorySortDirection}`}
                      onChange={(e) => {
                        const [key, direction] = e.target.value.split(':') as [
                          'name' | 'currentStock' | 'bestBefore',
                          'asc' | 'desc'
                        ];
                        setInventorySortKey(key);
                        setInventorySortDirection(direction);
                      }}
                      className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs text-on-surface outline-none"
                    >
                      <option value="name:asc">Name A-Z</option>
                      <option value="name:desc">Name Z-A</option>
                      <option value="currentStock:desc">Stock High-Low</option>
                      <option value="currentStock:asc">Stock Low-High</option>
                      <option value="bestBefore:asc">Expiry A-Z</option>
                      <option value="bestBefore:desc">Expiry Z-A</option>
                    </select>
                  </label>

                  <label className="inline-flex items-center gap-2 text-xs font-bold text-on-surface-variant">
                    Rows
                    <select
                      value={inventoryPageSize}
                      onChange={(e) => setInventoryPageSize(Number(e.target.value))}
                      className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs text-on-surface outline-none"
                    >
                      {[5, 10, 20, 30].map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container">
                <table className="w-full text-left border-collapse min-w-[760px]">
                  <thead>
                    <tr className="bg-surface-container-high/50 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">
                      <th className="px-4 lg:px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleInventorySort('name')}
                          className="inline-flex items-center gap-1 hover:text-on-surface uppercase"
                        >
                          Item Name
                          <ChevronsUpDown size={12} />
                        </button>
                      </th>
                      <th className="px-4 lg:px-6 py-4">Codes</th>
                      <th className="px-4 lg:px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleInventorySort('currentStock')}
                          className="inline-flex items-center gap-1 hover:text-on-surface uppercase"
                        >
                          Current Stock
                          <ChevronsUpDown size={12} />
                        </button>
                      </th>
                      <th className="px-4 lg:px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleInventorySort('bestBefore')}
                          className="inline-flex items-center gap-1 hover:text-on-surface uppercase"
                        >
                          Expiry Tracking
                          <ChevronsUpDown size={12} />
                        </button>
                      </th>
                      <th className="px-4 lg:px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {paginatedInventory.map((item) => {
                      const isLow = item.currentStock < lowStockThreshold;
                      return (
                        <tr key={item._id} className="hover:bg-surface-container-high/40 transition-colors group">
                          <td className="px-4 lg:px-6 py-4">
                            <p className="text-sm font-bold text-on-surface">{item.name}</p>
                            <p className="text-[10px] text-on-surface-variant font-medium">{item.category}</p>
                          </td>
                          <td className="px-4 lg:px-6 py-4">
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-on-surface-variant">SKU: {item.sku || 'Auto'}</p>
                              <p className="text-[10px] font-mono text-on-surface-variant break-all">{item.barcode || 'Barcode pending'}</p>
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-16 lg:w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden shrink-0">
                                <div
                                  className={cn('h-full transition-all', isLow ? 'bg-orange-500' : 'bg-primary')}
                                  style={{ width: `${Math.min(100, (item.currentStock / Math.max(lowStockThreshold * 2, 1)) * 100)}%` }}
                                />
                              </div>
                              <span className={cn('text-xs font-bold whitespace-nowrap', isLow ? 'text-orange-400' : 'text-on-surface')}>
                                {item.currentStock} {item.unit}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-4 font-mono text-[10px] text-on-surface-variant">
                            {item.bestBefore || 'N/A'}
                          </td>
                          <td className="px-4 lg:px-6 py-4 text-right">
                            <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEditForm(item)}
                                className="size-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => setPendingDeleteItem({ id: item._id, name: item.name })}
                                className="size-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {paginatedInventory.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-on-surface-variant opacity-50 text-xs">
                          No inventory records matched your filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {sortedInventory.length > 0 && (
                <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
                  <p className="shrink-0 whitespace-nowrap text-xs text-on-surface-variant">
                    Showing {(inventoryPage - 1) * inventoryPageSize + 1}-
                    {Math.min(inventoryPage * inventoryPageSize, sortedInventory.length)} of {sortedInventory.length}
                  </p>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setInventoryPage((prev) => Math.max(1, prev - 1))}
                      disabled={inventoryPage === 1}
                      className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-container-high disabled:opacity-40"
                    >
                      <ChevronLeft size={14} />
                      Prev
                    </button>
                    <span className="rounded-lg bg-surface-container px-3 py-2 text-xs font-bold text-on-surface">
                      Page {inventoryPage} / {inventoryTotalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setInventoryPage((prev) => Math.min(inventoryTotalPages, prev + 1))}
                      disabled={inventoryPage === inventoryTotalPages}
                      className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-container-high disabled:opacity-40"
                    >
                      Next
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

            </div>
          ) : tab === 'waste' ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="relative min-w-[260px] flex-1 lg:max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                  <input
                    type="text"
                    placeholder="Search item, category, reason, or date..."
                    value={wasteSearchQuery}
                    onChange={(e) => setWasteSearchQuery(e.target.value)}
                    className="h-10 w-full lg:w-80 rounded-lg border border-outline-variant bg-surface pl-10 text-sm text-on-surface placeholder:text-on-surface-variant focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-on-surface-variant">
                    Sort by
                    <select
                      value={`${wasteSortKey}:${wasteSortDirection}`}
                      onChange={(e) => {
                        const [key, direction] = e.target.value.split(':') as [
                          'name' | 'amount' | 'reason' | 'createdAt',
                          'asc' | 'desc'
                        ];
                        setWasteSortKey(key);
                        setWasteSortDirection(direction);
                      }}
                      className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs text-on-surface outline-none"
                    >
                      <option value="createdAt:desc">Newest First</option>
                      <option value="createdAt:asc">Oldest First</option>
                      <option value="name:asc">Item A-Z</option>
                      <option value="name:desc">Item Z-A</option>
                      <option value="amount:desc">Amount High-Low</option>
                      <option value="amount:asc">Amount Low-High</option>
                      <option value="reason:asc">Reason A-Z</option>
                      <option value="reason:desc">Reason Z-A</option>
                    </select>
                  </label>

                  <label className="inline-flex items-center gap-2 text-xs font-bold text-on-surface-variant">
                    Rows
                    <select
                      value={wastePageSize}
                      onChange={(e) => setWastePageSize(Number(e.target.value))}
                      className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs text-on-surface outline-none"
                    >
                      {[5, 10, 20, 30].map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-surface-container-high/50 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">
                      <th className="px-4 lg:px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleWasteSort('name')}
                          className="inline-flex items-center gap-1 hover:text-on-surface uppercase"
                        >
                          Wasted Item
                          <ChevronsUpDown size={12} />
                        </button>
                      </th>
                      <th className="px-4 lg:px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleWasteSort('amount')}
                          className="inline-flex items-center gap-1 hover:text-on-surface uppercase"
                        >
                          Amount Logged
                          <ChevronsUpDown size={12} />
                        </button>
                      </th>
                      <th className="px-4 lg:px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleWasteSort('reason')}
                          className="inline-flex items-center gap-1 hover:text-on-surface uppercase"
                        >
                          Reason
                          <ChevronsUpDown size={12} />
                        </button>
                      </th>
                      <th className="px-4 lg:px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleWasteSort('createdAt')}
                          className="inline-flex items-center gap-1 hover:text-on-surface uppercase"
                        >
                          Timestamp
                          <ChevronsUpDown size={12} />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {paginatedWasteLogs.map((log) => {
                      const item = log.ingredientId;
                      return (
                        <tr key={log._id} className="hover:bg-surface-container-high/40 transition-colors">
                          <td className="px-4 lg:px-6 py-4">
                            <p className="text-sm font-bold text-on-surface">{item?.name || 'Deleted Item'}</p>
                            <p className="text-[10px] text-on-surface-variant font-medium">{item?.category || 'N/A'}</p>
                          </td>
                          <td className="px-4 lg:px-6 py-4 text-sm font-semibold text-error">
                            -{log.amount} {item?.unit || ''}
                          </td>
                          <td className="px-4 lg:px-6 py-4">
                            <span className="bg-surface-container-high px-2.5 py-1 rounded text-xs font-bold text-on-surface">
                              {log.reason}
                            </span>
                          </td>
                          <td className="px-4 lg:px-6 py-4 text-xs font-mono text-on-surface-variant">
                            {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      );
                    })}

                    {paginatedWasteLogs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-10 text-on-surface-variant opacity-50 text-xs">
                          No waste incidents matched your filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {sortedWasteLogs.length > 0 && (
                <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
                  <p className="shrink-0 whitespace-nowrap text-xs text-on-surface-variant">
                    Showing {(wastePage - 1) * wastePageSize + 1}-
                    {Math.min(wastePage * wastePageSize, sortedWasteLogs.length)} of {sortedWasteLogs.length}
                  </p>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setWastePage((prev) => Math.max(1, prev - 1))}
                      disabled={wastePage === 1}
                      className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-container-high disabled:opacity-40"
                    >
                      <ChevronLeft size={14} />
                      Prev
                    </button>
                    <span className="rounded-lg bg-surface-container px-3 py-2 text-xs font-bold text-on-surface">
                      Page {wastePage} / {wasteTotalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setWastePage((prev) => Math.min(wasteTotalPages, prev + 1))}
                      disabled={wastePage === wasteTotalPages}
                      className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-container-high disabled:opacity-40"
                    >
                      Next
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="relative min-w-[260px] flex-1 lg:max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                  <input
                    type="text"
                    placeholder="Search item, category, SKU, barcode, or expiry..."
                    value={expirySearchQuery}
                    onChange={(e) => setExpirySearchQuery(e.target.value)}
                    className="h-10 w-full lg:w-80 rounded-lg border border-outline-variant bg-surface pl-10 text-sm text-on-surface placeholder:text-on-surface-variant focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-on-surface-variant">
                    Sort by
                    <select
                      value={`${expirySortKey}:${expirySortDirection}`}
                      onChange={(e) => {
                        const [key, direction] = e.target.value.split(':') as [
                          'name' | 'currentStock' | 'bestBefore',
                          'asc' | 'desc'
                        ];
                        setExpirySortKey(key);
                        setExpirySortDirection(direction);
                      }}
                      className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs text-on-surface outline-none"
                    >
                      <option value="bestBefore:asc">Expiry A-Z</option>
                      <option value="bestBefore:desc">Expiry Z-A</option>
                      <option value="name:asc">Name A-Z</option>
                      <option value="name:desc">Name Z-A</option>
                      <option value="currentStock:desc">Stock High-Low</option>
                      <option value="currentStock:asc">Stock Low-High</option>
                    </select>
                  </label>

                  <label className="inline-flex items-center gap-2 text-xs font-bold text-on-surface-variant">
                    Rows
                    <select
                      value={expiryPageSize}
                      onChange={(e) => setExpiryPageSize(Number(e.target.value))}
                      className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs text-on-surface outline-none"
                    >
                      {[4, 8, 12, 16].map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
              <h2 className="text-xl font-bold text-on-surface">Expirations & Critical Dates</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {paginatedExpiryItems.map((item) => (
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

                {paginatedExpiryItems.length === 0 && (
                  <div className="col-span-1 sm:col-span-2 text-center py-10 text-on-surface-variant opacity-50 text-xs">
                    No dated items matched your filter.
                  </div>
                )}
              </div>
              {sortedExpiryItems.length > 0 && (
                <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
                  <p className="shrink-0 whitespace-nowrap text-xs text-on-surface-variant">
                    Showing {(expiryPage - 1) * expiryPageSize + 1}-
                    {Math.min(expiryPage * expiryPageSize, sortedExpiryItems.length)} of {sortedExpiryItems.length}
                  </p>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExpiryPage((prev) => Math.max(1, prev - 1))}
                      disabled={expiryPage === 1}
                      className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-container-high disabled:opacity-40"
                    >
                      <ChevronLeft size={14} />
                      Prev
                    </button>
                    <span className="rounded-lg bg-surface-container px-3 py-2 text-xs font-bold text-on-surface">
                      Page {expiryPage} / {expiryTotalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setExpiryPage((prev) => Math.min(expiryTotalPages, prev + 1))}
                      disabled={expiryPage === expiryTotalPages}
                      className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-container-high disabled:opacity-40"
                    >
                      Next
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </main>

      {showAddForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl border border-outline-variant bg-surface-container shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 rounded-t-3xl border-b border-outline-variant bg-surface-container px-6 py-5">
              <div>
                <div className="flex items-center gap-3 text-primary">
                  <Package size={20} />
                  <h3 className="text-xl font-bold text-on-surface">
                    {inventoryForm.id ? 'Update Inventory Item' : 'Register New Inventory Item'}
                  </h3>
                </div>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Add stock details for this shop without leaving the inventory screen.
                </p>
              </div>

              <button
                type="button"
                onClick={closeAddForm}
                disabled={savingItem}
                className="rounded-xl border border-outline-variant p-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface disabled:opacity-40"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportForm(false);
                    setShowAddForm(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-on-primary transition-colors"
                >
                  <Plus size={14} />
                  Add Item
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setShowImportForm(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-4 py-2 text-xs font-bold text-on-surface-variant transition-colors hover:text-on-surface"
                >
                  <Upload size={14} />
                  Import Excel
                </button>
              </div>

              <form onSubmit={handleSaveInventoryItem} className="space-y-5">
                {/* <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.3fr)_320px] gap-5"> */}
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4 lg:p-5 space-y-4">
                      <div className="space-y-1">
                        <p className="text-xs font-black uppercase tracking-widest text-on-surface">Basic Details</p>
                        <p className="text-xs text-on-surface-variant">Keep naming simple so staff can search and recognize stock items quickly.</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-on-surface-variant">Item / Ingredient Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Fresh Milk"
                          value={inventoryForm.name}
                          onChange={(e) => updateInventoryForm('name', e.target.value)}
                          className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-on-surface-variant">Category</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Dairy"
                            value={inventoryForm.category}
                            onChange={(e) => updateInventoryForm('category', e.target.value)}
                            className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-on-surface-variant">Unit</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. kg, liters, packs"
                            value={inventoryForm.unit}
                            onChange={(e) => updateInventoryForm('unit', e.target.value)}
                            className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-on-surface-variant">SKU</label>
                            <input
                              type="text"
                              placeholder="Leave blank to auto-generate"
                              value={inventoryForm.sku}
                              onChange={(e) => updateInventoryForm('sku', e.target.value)}
                              className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-on-surface-variant">Barcode</label>
                            <input
                              type="text"
                              placeholder="Leave blank to auto-generate"
                              value={inventoryForm.barcode}
                              onChange={(e) => updateInventoryForm('barcode', e.target.value)}
                              className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        </div>
                      </div>

                    <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4 lg:p-5 space-y-4">
                      <div className="space-y-1">
                        <p className="text-xs font-black uppercase tracking-widest text-on-surface">Stock Details</p>
                        <p className="text-xs text-on-surface-variant">Set the opening quantity and optional expiry tracking for safer inventory control.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-on-surface-variant">Current Stock Level</label>
                          <input
                            type="number"
                            min="0"
                            value={inventoryForm.currentStock}
                            onChange={(e) => updateInventoryForm('currentStock', Number(e.target.value))}
                            className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-on-surface-variant">Best Before / Expiry</label>
                          <input
                            type="text"
                            placeholder="Optional"
                            value={inventoryForm.bestBefore}
                            onChange={(e) => updateInventoryForm('bestBefore', e.target.value)}
                            className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4 lg:p-5 space-y-4 h-fit">
                    <div className="flex items-center gap-3">
                      <div className="size-11 rounded-2xl bg-primary/12 flex items-center justify-center text-primary shrink-0">
                        <Package size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-on-surface">Quick Preview</p>
                        <p className="text-xs text-on-surface-variant">Review how the stock record reads before saving.</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-outline-variant bg-surface p-4 space-y-3">
                      <p className="text-base font-bold text-on-surface truncate">
                        {inventoryForm.name.trim() || 'Item name preview'}
                      </p>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">
                        {(inventoryForm.category.trim() || 'Category')} · {(inventoryForm.unit.trim() || 'Unit')}
                      </p>
                      <p className="text-sm font-black text-primary">
                        {inventoryForm.currentStock} {inventoryForm.unit.trim() || 'units'}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        Expiry: {inventoryForm.bestBefore.trim() || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div> */}

                <div className="flex gap-3 flex-wrap">
                  <button
                    type="submit"
                    disabled={savingItem}
                    className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold text-sm tracking-widest hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {savingItem ? 'Saving Item...' : inventoryForm.id ? 'Update Stock Record' : 'Save Stock Record'}
                  </button>
                  <button
                    type="button"
                    onClick={closeAddForm}
                    className="px-5 py-3 rounded-xl border border-outline-variant text-xs font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showImportForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl border border-outline-variant bg-surface-container shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 rounded-t-3xl border-b border-outline-variant bg-surface-container px-6 py-5">
              <div>
                <div className="flex items-center gap-3 text-primary">
                  <FileSpreadsheet size={20} />
                  <h3 className="text-xl font-bold text-on-surface">Import Inventory from Excel</h3>
                </div>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Upload one Excel sheet and bulk-create inventory records for this shop.
                </p>
              </div>

              <button
                type="button"
                onClick={closeImportForm}
                disabled={importingInventory}
                className="rounded-xl border border-outline-variant p-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface disabled:opacity-40"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportForm(false);
                    setShowAddForm(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-4 py-2 text-xs font-bold text-on-surface-variant transition-colors hover:text-on-surface"
                >
                  <Plus size={14} />
                  Add Item
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setShowImportForm(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-on-primary transition-colors"
                >
                  <Upload size={14} />
                  Import Excel
                </button>
              </div>

              <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5 space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <p className="text-xs font-black uppercase tracking-wider text-on-surface">Excel Import</p>
                </div>
                <p className="text-sm leading-relaxed text-on-surface-variant">
                  First sheet columns: <strong>name</strong>, <strong>category</strong>, <strong>currentStock</strong> or
                  <strong> stock</strong>, <strong>unit</strong>, optional <strong>sku</strong>, optional <strong>barcode</strong>, optional <strong>bestBefore</strong>.
                </p>
                <input
                  ref={inventoryImportRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportInventory}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => inventoryImportRef.current?.click()}
                  disabled={importingInventory}
                  className="inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-surface px-4 py-3 text-sm font-bold text-on-surface hover:bg-surface-container-high disabled:opacity-50"
                >
                  <Upload size={16} />
                  {importingInventory ? 'Importing...' : 'Choose Excel File'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showWasteForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-outline-variant bg-surface-container shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 rounded-t-3xl border-b border-outline-variant bg-surface-container px-6 py-5">
              <div>
                <div className="flex items-center gap-3 text-secondary">
                  <Trash2 size={20} />
                  <h3 className="text-xl font-bold text-on-surface">{wasteActionLabel}</h3>
                </div>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Record stock deductions without leaving the inventory screen.
                </p>
              </div>

              <button
                type="button"
                onClick={closeWasteForm}
                disabled={loggingWaste}
                className="rounded-xl border border-outline-variant p-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface disabled:opacity-40"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleLogWaste} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant">Select Item</label>
                  <select
                    value={wasteItemId}
                    onChange={(e) => setWasteItemId(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                  >
                    <option value="">Choose item...</option>
                    {inventory.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name} ({item.currentStock} {item.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant">Amount to Deduct</label>
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
                  <label className="text-xs font-bold text-on-surface-variant">Deduction Reason</label>
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

                <div className="flex gap-3 flex-wrap">
                  <button
                    type="submit"
                    disabled={loggingWaste || !wasteItemId}
                    className="bg-secondary text-on-secondary px-6 py-3 rounded-lg font-bold text-sm tracking-widest hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loggingWaste && <Loader2 size={14} className="animate-spin" />}
                    Submit Log
                  </button>
                  <button
                    type="button"
                    onClick={closeWasteForm}
                    className="px-6 py-3 rounded-lg border border-outline-variant text-xs font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDeleteItem}
        title="Delete Inventory Item"
        message={`Delete "${pendingDeleteItem?.name ?? 'this item'}" from inventory?`}
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteItem(null)}
        onConfirm={() => void confirmDeleteInventoryItem()}
      />
    </div>
  );
}
