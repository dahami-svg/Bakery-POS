'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ArrowLeft, 
  Plus, 
  Minus, 
  Pencil,
  X, 
  CreditCard, 
  Cake, 
  Utensils, 
  Cookie, 
  Coffee, 
  ShoppingBag,
  Wrench,
  Zap,
  Sparkles,
  ClipboardList,
  ShieldAlert,
  CheckCircle,
  HelpCircle,
  ReceiptText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLayout } from '@/context/LayoutContext';
import { useTenant } from '@/context/TenantContext';
import Link from 'next/link';
import { getDefaultPosOrderTypes, getPosOrderTypeLabel, PosOrderType } from '@/lib/pos-order-types';

const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes('cake')) return Cake;
  if (name.includes('bread') || name.includes('main')) return Utensils;
  if (name.includes('pastry') || name.includes('cookie') || name.includes('snack')) return Cookie;
  if (name.includes('beverage') || name.includes('coffee') || name.includes('drink')) return Coffee;
  if (name.includes('tool') || name.includes('hand')) return Wrench;
  if (name.includes('elect') || name.includes('light') || name.includes('power')) return Zap;
  if (name.includes('measur') || name.includes('tape')) return ClipboardList;
  if (name.includes('chemical') || name.includes('oil')) return Zap;
  if (name.includes('paint') || name.includes('brush')) return Sparkles;
  return ShoppingBag;
};

const feeTypeOptions = ['Tax', 'Handling', 'Shipping', 'Delivery', 'Packing', 'Service Charge', 'Discount'];

const getProductSellingPrice = (product: any) => {
  const effectivePrice = Number(product?.effectivePrice);
  const basePrice = Number(product?.price || 0);
  const discountedPrice = Number(product?.discountedPrice);

  if (!Number.isNaN(effectivePrice) && effectivePrice >= 0 && effectivePrice < basePrice) {
    return effectivePrice;
  }

  if (
    product?.discountedPrice !== null &&
    product?.discountedPrice !== undefined &&
    !Number.isNaN(discountedPrice) &&
    discountedPrice >= 0 &&
    discountedPrice < basePrice
  ) {
    return discountedPrice;
  }

  return basePrice;
};

const orderTypeContent: Record<PosOrderType, {
  summaryTitle: string;
  checkoutLabel: string;
  successTitle: string;
  successDescription: string;
  emptyLabel: string;
  nextLabel: string;
}> = {
  'dine-in': {
    summaryTitle: 'Order Summary',
    checkoutLabel: 'Send Order',
    successTitle: 'Dine-In Order Created',
    successDescription: 'The dine-in order has been saved and routed through the sales flow.',
    emptyLabel: 'Your order is empty',
    nextLabel: 'Next Dine-In Order',
  },
  takeaway: {
    summaryTitle: 'Order Summary',
    checkoutLabel: 'Confirm Takeaway',
    successTitle: 'Takeaway Order Created',
    successDescription: 'The takeaway order has been saved successfully.',
    emptyLabel: 'Your order is empty',
    nextLabel: 'Next Takeaway Order',
  },
  delivery: {
    summaryTitle: 'Delivery Summary',
    checkoutLabel: 'Create Delivery Order',
    successTitle: 'Delivery Order Created',
    successDescription: 'The delivery order has been saved successfully.',
    emptyLabel: 'Your delivery cart is empty',
    nextLabel: 'Next Delivery Order',
  },
  'walk-in': {
    summaryTitle: 'Sale Summary',
    checkoutLabel: 'Complete Walk-In Sale',
    successTitle: 'Walk-In Sale Completed',
    successDescription: 'The walk-in sale has been recorded successfully.',
    emptyLabel: 'Your sale is empty',
    nextLabel: 'Next Walk-In Sale',
  },
  quotation: {
    summaryTitle: 'Quotation Summary',
    checkoutLabel: 'Save Quotation',
    successTitle: 'Quotation Saved',
    successDescription: 'The quotation has been saved successfully.',
    emptyLabel: 'Your quotation is empty',
    nextLabel: 'Create Another Quotation',
  },
  invoice: {
    summaryTitle: 'Invoice Summary',
    checkoutLabel: 'Create Invoice',
    successTitle: 'Invoice Created',
    successDescription: 'The invoice has been saved successfully.',
    emptyLabel: 'Your invoice is empty',
    nextLabel: 'Create Another Invoice',
  },
  'quick-sale': {
    summaryTitle: 'Sale Summary',
    checkoutLabel: 'Complete Sale',
    successTitle: 'Sale Completed',
    successDescription: 'The sale has been recorded successfully.',
    emptyLabel: 'Your sale is empty',
    nextLabel: 'Next Sale',
  },
};

export default function PosPage() {
  const { sidebarOpen } = useLayout();
  const { activeTenant, loading: tenantLoading, refreshTenants } = useTenant();
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState<{ productId: string; quantity: number; note: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderType, setOrderType] = useState<PosOrderType>('quick-sale');
  const [tableNumber, setTableNumber] = useState<number | ''>('');
  
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [showFeeDialog, setShowFeeDialog] = useState(false);
  const [savingFeePreset, setSavingFeePreset] = useState(false);
  const [selectedFeePresetIds, setSelectedFeePresetIds] = useState<string[]>([]);
  const [editingFeePresetId, setEditingFeePresetId] = useState<string | null>(null);
  const [newFeeLabel, setNewFeeLabel] = useState('Tax');
  const [newFeeMode, setNewFeeMode] = useState<'fixed' | 'percentage'>('fixed');
  const [newFeeAmount, setNewFeeAmount] = useState('0');

  const hasKitchenFlow = activeTenant?.enabledModules.includes('kds') ?? false;
  const terminalTitle = hasKitchenFlow ? 'Products' : 'Items';
  const specialNotePlaceholder = hasKitchenFlow ? 'Special note for prep team...' : 'Special note';
  const availableOrderTypes: PosOrderType[] = activeTenant?.posOrderTypes?.length
    ? activeTenant.posOrderTypes
    : activeTenant
      ? getDefaultPosOrderTypes(activeTenant.type, activeTenant.enabledModules)
      : ['quick-sale'];
  const currentOrderTypeContent = orderTypeContent[orderType] || orderTypeContent['quick-sale'];
  const orderSummaryTitle = currentOrderTypeContent.summaryTitle;
  const checkoutActionLabel = currentOrderTypeContent.checkoutLabel;
  const successTitle = currentOrderTypeContent.successTitle;
  const successDescription = currentOrderTypeContent.successDescription;
  const emptyCartLabel = currentOrderTypeContent.emptyLabel;
  const nextOrderLabel = currentOrderTypeContent.nextLabel;
  const compactTabletGrid = sidebarOpen;

  useEffect(() => {
    if (!activeTenant) return;
    
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await fetch(`/api/products?tenantId=${activeTenant._id}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setProducts(data.data);
          const derived = Array.from(new Set(data.data.map((p: any) => p.category))) as string[];
          setCategories(derived);
          setSelectedCategory('');
        }
      } catch {
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
    setCart([]);
    setTableNumber('');
    setCheckoutSuccess(false);
    setSelectedFeePresetIds([]);
    setShowFeeDialog(false);
    setEditingFeePresetId(null);
    setNewFeeLabel('Tax');
    setNewFeeMode('fixed');
    setNewFeeAmount('0');

    setOrderType(availableOrderTypes[0] || 'quick-sale');
  }, [activeTenant]);

  if (tenantLoading || (activeTenant && loadingProducts)) {
    return (
      <div className="flex items-center justify-center h-full bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant text-sm font-black tracking-widest">Loading POS Terminal...</p>
        </div>
      </div>
    );
  }

  if (!activeTenant) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-surface text-center p-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
          <ShoppingBag size={36} />
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

  if (!activeTenant.enabledModules.includes('pos')) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-surface text-center p-8">
        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center text-error mb-4">
          <ShieldAlert size={36} />
        </div>
        <h1 className="text-2xl font-black text-on-surface">POS Terminal Disabled</h1>
        <p className="text-on-surface-variant text-sm mt-2 max-w-md">
          The POS module is not enabled for <span className="font-bold text-on-surface">{activeTenant.name}</span>. Please visit the Super Admin settings to enable POS access.
        </p>
        <Link href="/super-admin" className="mt-6 px-5 py-2.5 bg-surface-container-high hover:bg-surface-variant border border-outline-variant rounded-lg text-xs font-bold text-on-surface active:scale-95 transition-all">
          Manage Shop Configuration
        </Link>
      </div>
    );
  }

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product._id);
      if (existing) {
        return prev.map(item => item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { productId: product._id, quantity: 1, note: '' }];
    });
    setCartOpen(true);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const updateNote = (productId: string, note: string) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        return { ...item, note };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const subtotal = cart.reduce((acc, item) => {
    const product = products.find(p => p._id === item.productId);
    return acc + getProductSellingPrice(product) * item.quantity;
  }, 0);

  const selectedFeePresets = (activeTenant?.feePresets || []).filter((fee) => selectedFeePresetIds.includes(fee._id));
  const selectedFeeAdjustments = selectedFeePresets.map((fee) => {
    const amount = fee.mode === 'percentage'
      ? subtotal * (Number(fee.value || 0) / 100)
      : Number(fee.value ?? fee.amount ?? 0);

    return {
      label: fee.label,
      mode: fee.mode,
      value: Number(fee.value ?? fee.amount ?? 0),
      amount,
    };
  });
  const adjustmentsTotal = selectedFeeAdjustments.reduce((sum, fee) => sum + fee.amount, 0);
  const total = Math.max(0, subtotal + adjustmentsTotal);

  const filteredProducts = products.filter(p => 
    (selectedCategory === '' || p.category === selectedCategory) && 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    if (hasKitchenFlow && orderType === 'dine-in' && !tableNumber) {
      alert('Please specify a Table Number for dine-in orders.');
      return;
    }

    setCheckoutLoading(true);
    
    const hasKds = activeTenant.enabledModules.includes('kds');
    const orderStatus = hasKds ? 'new' : 'completed';
    const itemsStatus = hasKds ? 'pending' : 'delivered';

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenant._id,
          items: cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            note: item.note,
            status: itemsStatus
          })),
          status: orderStatus,
          type: orderType,
          tableNumber: orderType === 'dine-in' ? Number(tableNumber) : undefined,
          total: total,
          pricing: {
            subtotal,
            adjustments: selectedFeeAdjustments,
          }
        })
      });

      const data = await res.json();
        if (data.success) {
          setSuccessOrderId(data.data._id);
          setCheckoutSuccess(true);
          setCart([]);
          setTableNumber('');
          setCartOpen(false);
          setSelectedFeePresetIds([]);
        } else {
        alert('Checkout failed: ' + data.message);
      }
    } catch {
      alert('Network error occurred during checkout.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const cartItemsCount = cart.reduce((a, b) => a + b.quantity, 0);

  const resetFeeDialog = () => {
    setShowFeeDialog(false);
    setEditingFeePresetId(null);
    setNewFeeLabel('Tax');
    setNewFeeMode('fixed');
    setNewFeeAmount('0');
  };

  const saveFeePreset = async () => {
    if (!activeTenant?._id) return;

    const label = newFeeLabel.trim();
    const value = Number(newFeeAmount || 0);

    if (!label) {
      alert('Please select a fee type.');
      return;
    }

    setSavingFeePreset(true);
    try {
      const currentFees = activeTenant.feePresets || [];
      const nextFees = editingFeePresetId
        ? currentFees.map((fee) =>
            fee._id === editingFeePresetId
              ? {
                  label,
                  mode: newFeeMode,
                  value,
                  amount: newFeeMode === 'percentage' ? 0 : value,
                }
              : {
                  label: fee.label,
                  mode: fee.mode,
                  value: fee.value,
                  amount: fee.amount,
                }
          )
        : [
            ...currentFees.map((fee) => ({
              label: fee.label,
              mode: fee.mode,
              value: fee.value,
              amount: fee.amount,
            })),
            {
              label,
              mode: newFeeMode,
              value,
              amount: newFeeMode === 'percentage' ? 0 : value,
            },
          ];

      const res = await fetch(`/api/tenants/${activeTenant._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feePresets: nextFees,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Failed to save fee preset.');
        return;
      }

      await refreshTenants();
      const updatedFees = data.data?.feePresets || [];
      const createdFee = updatedFees[updatedFees.length - 1];
      if (!editingFeePresetId && createdFee?._id) {
        setSelectedFeePresetIds((prev) => [...prev, createdFee._id]);
      }
      resetFeeDialog();
    } catch {
      alert('Failed to save fee preset.');
    } finally {
      setSavingFeePreset(false);
    }
  };

  const toggleFeePreset = (feeId: string) => {
    setSelectedFeePresetIds((prev) => (prev.includes(feeId) ? prev.filter((id) => id !== feeId) : [...prev, feeId]));
  };

  const openCreateFeeDialog = () => {
    setEditingFeePresetId(null);
    setNewFeeLabel('Tax');
    setNewFeeMode('fixed');
    setNewFeeAmount('0');
    setShowFeeDialog(true);
  };

  const openEditFeeDialog = (fee: NonNullable<typeof activeTenant>['feePresets'][number]) => {
    setEditingFeePresetId(fee._id);
    setNewFeeLabel(fee.label);
    setNewFeeMode(fee.mode);
    setNewFeeAmount(String(Number(fee.value ?? fee.amount ?? 0)));
    setShowFeeDialog(true);
  };

  const renderCartContent = (closeable = false) => (
    <>
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 scrollbar-hide">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-on-surface">{orderSummaryTitle}</h2>
            {closeable && (
              <button
                onClick={() => setCartOpen(false)}
                className="lg:hidden size-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <span className="rounded-full bg-secondary-container px-3 py-1 text-xs font-bold text-on-secondary-container">
            {cartItemsCount} Items
          </span>
        </div>

        {hasKitchenFlow && cart.length > 0 && (
          <div className="mb-6 bg-surface-container p-3 rounded-lg border border-outline-variant/30 space-y-3">
            <div className="flex bg-surface-container-low p-1 rounded-md border border-outline-variant/50">
              {availableOrderTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setOrderType(t);
                    if (t !== 'dine-in') setTableNumber('');
                  }}
                  className={cn(
                    "flex-1 py-1.5 text-center text-xs font-bold capitalize rounded transition-all cursor-pointer",
                    orderType === t 
                      ? "bg-primary text-on-primary" 
                      : "text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  {getPosOrderTypeLabel(t)}
                </button>
              ))}
            </div>
            
            {orderType === 'dine-in' && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-on-surface-variant whitespace-nowrap">Table Number:</span>
                <select
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value ? Number(e.target.value) : '')}
                  className="flex-1 bg-surface-container-low border border-outline-variant rounded p-1.5 text-xs text-on-surface font-bold outline-none"
                >
                  <option value="">Select...</option>
                  {[2, 4, 6, 8, 10, 12, 14, 16].map(num => (
                    <option key={num} value={num}>Table {num}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {cart.map(item => {
            const product = products.find(p => p._id === item.productId)!;
            if (!product) return null;
            const unitPrice = getProductSellingPrice(product);
            const hasDiscount = unitPrice < Number(product.price || 0);
            return (
              <div key={item.productId} className="flex flex-col gap-2 rounded-lg bg-surface-container p-3 border border-outline-variant/10">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-on-surface line-clamp-1">{product.name}</h3>
                    <p className="text-xs text-on-surface-variant">Unit: {product.unit || 'Standard'}</p>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      {hasDiscount && (
                        <span className="text-[11px] font-bold text-on-surface-variant line-through">
                          Rs. {Number(product.price).toFixed(2)}
                        </span>
                      )}
                      <span className="text-[11px] font-black text-primary">
                        Rs. {unitPrice.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="mt-2 flex items-center gap-3">
                      <button 
                        onClick={() => updateQuantity(product._id, -1)}
                        className="flex size-7 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface active:scale-90 transition-transform cursor-pointer"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-bold text-on-surface w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(product._id, 1)}
                        className="flex size-7 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface active:scale-90 transition-transform cursor-pointer"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-on-surface">Rs. {(unitPrice * item.quantity).toFixed(2)}</p>
                    <button 
                      onClick={() => removeFromCart(product._id)}
                      className="mt-2 text-error hover:underline text-xs cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {hasKitchenFlow && (
                  <input 
                    type="text"
                    placeholder={specialNotePlaceholder}
                    value={item.note}
                    onChange={(e) => updateNote(product._id, e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded p-1.5 text-xs text-on-surface outline-none placeholder:text-on-surface-variant/50"
                  />
                )}
              </div>
            );
          })}
          
          {cart.length === 0 && !checkoutSuccess && (
            <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant opacity-50">
              <ShoppingBag size={48} strokeWidth={1} />
              <p className="mt-4 text-sm">{emptyCartLabel}</p>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-outline-variant bg-surface-container-high p-4 sm:p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-on-surface-variant">Subtotal</span>
            <span className="font-medium text-on-surface">Rs. {subtotal.toFixed(2)}</span>
          </div>
          <div className="rounded-xl border border-outline-variant bg-surface px-3 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-on-surface">
                <ReceiptText size={15} />
                <span className="text-xs font-black tracking-widest">Additional Fees</span>
              </div>
              <button
                type="button"
                onClick={openCreateFeeDialog}
                className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-2.5 py-1.5 text-[11px] font-bold text-on-surface hover:bg-surface-container-high"
              >
                <Plus size={12} />
                Add Fee
              </button>
            </div>

            <div className="space-y-2">
              {(activeTenant.feePresets || []).map((fee) => (
                <div key={fee._id} className="grid grid-cols-[18px_1fr_auto] gap-3 items-center rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedFeePresetIds.includes(fee._id)}
                    onChange={() => toggleFeePreset(fee._id)}
                    className="size-4 accent-primary"
                  />
                  <button
                    type="button"
                    onClick={() => toggleFeePreset(fee._id)}
                    className="min-w-0 text-left"
                  >
                    <span className="block text-sm text-on-surface font-medium">{fee.label}</span>
                  </button>
                  <div className="flex items-center gap-2 justify-self-end">
                    <span className="text-xs font-bold text-on-surface-variant">
                      {fee.mode === 'percentage'
                        ? `${Number(fee.value || 0).toFixed(2)}%`
                        : `Rs. ${Number(fee.value ?? fee.amount ?? 0).toFixed(2)}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => openEditFeeDialog(fee)}
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface hover:text-on-surface"
                      aria-label={`Edit ${fee.label}`}
                      title={`Edit ${fee.label}`}
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {(activeTenant.feePresets || []).length === 0 && (
                <div className="rounded-lg border border-dashed border-outline-variant px-3 py-4 text-center text-xs text-on-surface-variant">
                  No saved fees yet. Use Add Fee to create reusable fee presets for this shop.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-on-surface-variant">Adjustments Total</span>
            <span className="font-medium text-on-surface">Rs. {adjustmentsTotal.toFixed(2)}</span>
          </div>
          <div className="pt-2 flex justify-between text-lg font-bold">
            <span className="text-on-surface">Total</span>
            <span className="text-primary">Rs. {total.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0 || checkoutLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-lg font-bold text-on-primary shadow-lg hover:shadow-primary/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CreditCard size={20} />
            {checkoutLoading ? 'Processing...' : 'Checkout'}
          </button>
          
          {cart.length > 0 && (
            <button 
              onClick={() => setCart([])}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-outline-variant bg-transparent py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-variant active:scale-95 transition-all cursor-pointer"
            >
              <X size={16} />
              Clear Cart
            </button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-full w-full overflow-hidden">
      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex flex-col border-b border-outline-variant bg-surface-container">
          <div className="flex items-center justify-between px-4 lg:px-6 py-4">
            <div className="flex items-center gap-3">
              {/* <Link 
                href="/"
                className="flex size-10 items-center justify-center rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors active:scale-95 cursor-pointer"
              >
                <ArrowLeft size={20} />
              </Link>
              <h2 className="text-sm font-bold text-on-surface hidden sm:block">{terminalTitle}</h2> */}
            </div>
            <div className="flex flex-1 items-center gap-2">
              <div className="relative sm:hidden flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                <input 
                  type="text"
                  placeholder="Search items..." 
                  className="h-10 w-full rounded-lg border-none bg-surface-container-highest pl-10 text-sm text-on-surface placeholder:text-on-surface-variant focus:ring-1 focus:ring-primary outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                onClick={() => setCartOpen(true)}
                className="lg:hidden relative size-10 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors active:scale-95 flex items-center justify-center cursor-pointer"
              >
                <ShoppingBag size={18} />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 size-5 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </button>
              <div className="relative hidden sm:block flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                <input 
                  type="text"
                  placeholder="Search items..." 
                  className="h-10 w-full rounded-lg border-none bg-surface-container-highest pl-10 text-sm text-on-surface placeholder:text-on-surface-variant focus:ring-1 focus:ring-primary outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </header>

        {categories.length > 0 && (
          <nav className="flex gap-4 border-b border-outline-variant bg-surface px-4 lg:px-6 py-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedCategory('')}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 lg:px-5 py-2 text-sm font-bold transition-colors whitespace-nowrap cursor-pointer",
                selectedCategory === ''
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-high text-on-surface-variant hover:bg-surface-variant"
              )}
            >
              <ShoppingBag size={16} />
              All
            </button>
            {categories.map(cat => {
              const Icon = getCategoryIcon(cat);
              return (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 lg:px-5 py-2 text-sm font-bold transition-colors whitespace-nowrap cursor-pointer",
                    selectedCategory === cat 
                      ? "bg-primary text-on-primary" 
                      : "bg-surface-container-high text-on-surface-variant hover:bg-surface-variant"
                  )}
                >
                  <Icon size={16} />
                  {cat}
                </button>
              );
            })}
          </nav>
        )}

        <div className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-hide">
          {checkoutSuccess ? (
            <div className="flex flex-col items-center justify-center py-16 lg:py-20 text-center bg-surface-container/30 border border-dashed border-outline-variant rounded-2xl max-w-xl mx-auto my-6 lg:my-10 px-6">
              <CheckCircle size={56} className="text-primary mb-4" />
              <h2 className="text-xl lg:text-2xl font-black text-on-surface">{successTitle}</h2>
              <p className="text-on-surface-variant text-sm mt-2 max-w-sm">
                {successDescription}
              </p>
              <div className="bg-surface-container-high/60 px-4 py-2.5 rounded-lg text-xs font-mono text-on-surface mt-4 break-all max-w-full">
                ID: {successOrderId}
              </div>
              <button 
                onClick={() => setCheckoutSuccess(false)}
                className="mt-8 px-6 py-3 bg-primary text-on-primary text-xs font-black uppercase tracking-wider rounded-xl hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                {nextOrderLabel}
              </button>
            </div>
          ) : (
            <>
              <div className={cn(
                "grid grid-cols-2 gap-3 sm:gap-4",
                compactTabletGrid ? "sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5" : "sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5"
              )}>
                {filteredProducts.map(product => {
                  const sellingPrice = getProductSellingPrice(product);
                  const hasDiscount = sellingPrice < Number(product.price || 0);

                  return (
                    <button 
                      key={product._id}
                      onClick={() => addToCart(product)}
                      className="group flex flex-col items-start gap-1.5 rounded-xl bg-surface-container p-2 text-left transition-all hover:bg-surface-container-high active:scale-95 ring-1 ring-outline-variant/20 hover:ring-primary/40 cursor-pointer"
                    >
                      <div className="h-24 sm:h-28 w-full overflow-hidden rounded-lg bg-surface-variant">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 w-full min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-on-surface line-clamp-1">{product.name}</p>
                        <div className="mt-0 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                            {hasDiscount && (
                              <span className="text-[10px] font-bold text-on-surface-variant line-through">
                                Rs. {Number(product.price).toFixed(2)}
                              </span>
                            )}
                            <span className="text-xs font-black text-primary">Rs. {sellingPrice.toFixed(2)}</span>
                          </div>
                          <span className="text-[9px] text-on-surface-variant font-bold uppercase">{product.unit}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-20 text-on-surface-variant opacity-40">
                  <HelpCircle size={48} className="mx-auto mb-4" strokeWidth={1} />
                  <p className="text-sm font-bold">No products found in this category.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Desktop cart sidebar */}
      <aside className="hidden lg:flex w-96 bg-surface-container-low border-l border-outline-variant flex-col shrink-0">
        {renderCartContent()}
      </aside>

      {/* Mobile cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setCartOpen(false)} />
      )}
      <aside
        className={cn(
          "bg-surface-container-low border-l border-outline-variant flex flex-col",
          "fixed inset-y-0 right-0 z-50 w-[85vw] max-w-sm transition-transform duration-300 ease-in-out lg:hidden",
          cartOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {renderCartContent(true)}
      </aside>

      {/* Floating cart button for mobile */}
      {cartItemsCount > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 z-30 lg:hidden flex items-center gap-3 bg-primary text-on-primary px-5 py-3.5 rounded-full shadow-xl hover:opacity-90 active:scale-95 transition-all cursor-pointer"
        >
          <ShoppingBag size={20} />
          <span className="font-bold text-sm">{cartItemsCount} item{cartItemsCount !== 1 ? 's' : ''}</span>
          <span className="font-black text-sm">Rs.{total.toFixed(0)}</span>
        </button>
      )}

      {showFeeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-outline-variant bg-surface-container shadow-2xl">
            <div className="flex items-start justify-between gap-4 rounded-t-3xl border-b border-outline-variant bg-surface-container px-6 py-5">
              <div>
                <div className="flex items-center gap-3 text-primary">
                  <ReceiptText size={18} />
                  <h3 className="text-xl font-bold text-on-surface">{editingFeePresetId ? 'Edit Fee' : 'Add Fee'}</h3>
                </div>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {editingFeePresetId ? 'Update the saved fee details for this shop.' : 'Select which fee type you want to add to this order.'}
                </p>
              </div>

              <button
                type="button"
                onClick={resetFeeDialog}
                className="rounded-xl border border-outline-variant p-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-on-surface-variant">Fee Name</label>
                <select
                  value={newFeeLabel}
                  onChange={(e) => setNewFeeLabel(e.target.value)}
                  className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                >
                  {feeTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-on-surface-variant">Value Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewFeeMode('fixed')}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-sm font-bold transition-colors",
                      newFeeMode === 'fixed'
                        ? "border-primary bg-primary text-on-primary"
                        : "border-outline-variant bg-surface text-on-surface"
                    )}
                  >
                    Fixed Fee
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewFeeMode('percentage')}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-sm font-bold transition-colors",
                      newFeeMode === 'percentage'
                        ? "border-primary bg-primary text-on-primary"
                        : "border-outline-variant bg-surface text-on-surface"
                    )}
                  >
                    Percentage
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-on-surface-variant">
                  {newFeeMode === 'percentage' ? 'Percentage' : 'Amount'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newFeeAmount}
                  onChange={(e) => setNewFeeAmount(e.target.value)}
                  placeholder={newFeeMode === 'percentage' ? '0.00%' : '0.00'}
                  className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={saveFeePreset}
                  disabled={savingFeePreset}
                  className="bg-primary text-on-primary px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingFeePreset ? 'Saving...' : editingFeePresetId ? 'Update Fee' : 'Save Fee'}
                </button>
                <button
                  type="button"
                  onClick={() => !savingFeePreset && resetFeeDialog()}
                  className="px-5 py-3 rounded-xl border border-outline-variant text-xs font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
