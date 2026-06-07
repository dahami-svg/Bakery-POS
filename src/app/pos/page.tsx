'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ArrowLeft, 
  Plus, 
  Minus, 
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
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTenant } from '@/context/TenantContext';
import Link from 'next/link';

// Dynamically assign an icon to categories
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

export default function PosPage() {
  const { activeTenant, loading: tenantLoading } = useTenant();
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  // State variables for POS logic
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState<{ productId: string; quantity: number; note: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway' | 'delivery' | 'quick-sale'>('quick-sale');
  const [tableNumber, setTableNumber] = useState<number | ''>('');
  
  // Checkout statuses
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState('');

  // Fetch products
  useEffect(() => {
    if (!activeTenant) return;
    
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await fetch(`/api/products?tenantId=${activeTenant._id}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setProducts(data.data);
          
          // Dynamically derive categories from products
          const derived = Array.from(new Set(data.data.map((p: any) => p.category))) as string[];
          setCategories(derived);
          
          // Select the first category by default
          if (derived.length > 0) {
            setSelectedCategory(derived[0]);
          } else {
            setSelectedCategory('');
          }
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

    // Set order type default based on shop type
    if (activeTenant.type === 'restaurant' || activeTenant.type === 'bakery') {
      setOrderType('dine-in');
    } else {
      setOrderType('quick-sale');
    }
  }, [activeTenant]);

  // Loading Screen
  if (tenantLoading || (activeTenant && loadingProducts)) {
    return (
      <div className="flex items-center justify-center h-full bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Loading POS Terminal...</p>
        </div>
      </div>
    );
  }

  // No Tenant State
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

  // Check Module Access
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

  // Cart operations
  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product._id);
      if (existing) {
        return prev.map(item => item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { productId: product._id, quantity: 1, note: '' }];
    });
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

  // Calculations
  const subtotal = cart.reduce((acc, item) => {
    const product = products.find(p => p._id === item.productId);
    return acc + (product?.price || 0) * item.quantity;
  }, 0);

  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  // Filter items
  const filteredProducts = products.filter(p => 
    (selectedCategory === '' || p.category === selectedCategory) && 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Submit order to backend
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    // Check table number validation if dine-in
    if (orderType === 'dine-in' && !tableNumber) {
      alert('Please specify a Table Number for dine-in orders.');
      return;
    }

    setCheckoutLoading(true);
    
    // Determine order and item statuses
    // If KDS is disabled, we mark order status as 'completed' and item status as 'delivered' (instant sale)
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
          total: total
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccessOrderId(data.data._id);
        setCheckoutSuccess(true);
        setCart([]);
        setTableNumber('');
      } else {
        alert('Checkout failed: ' + data.message);
      }
    } catch {
      alert('Network error occurred during checkout.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const isFoodShop = activeTenant.type === 'restaurant' || activeTenant.type === 'bakery';

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Product Discovery Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between border-b border-outline-variant px-6 py-4 bg-surface-container">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="flex size-10 items-center justify-center rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors active:scale-95 cursor-pointer"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-on-surface">New Transaction</h1>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">{activeTenant.name}</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
            <input 
              type="text"
              placeholder="Search items..." 
              className="h-10 w-64 rounded-lg border-none bg-surface-container-highest pl-10 text-sm text-on-surface placeholder:text-on-surface-variant focus:ring-1 focus:ring-primary outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        {/* Categories Bar */}
        {categories.length > 0 && (
          <nav className="flex gap-4 border-b border-outline-variant bg-surface px-6 py-3 overflow-x-auto no-scrollbar">
            {categories.map(cat => {
              const Icon = getCategoryIcon(cat);
              return (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition-colors whitespace-nowrap cursor-pointer",
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

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {checkoutSuccess ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-surface-container/30 border border-dashed border-outline-variant rounded-2xl max-w-xl mx-auto my-10">
              <CheckCircle size={64} className="text-primary mb-4" />
              <h2 className="text-2xl font-black text-on-surface">Payment Settled</h2>
              <p className="text-on-surface-variant text-sm mt-2 max-w-sm">
                Order has been successfully registered in the tenant database.
              </p>
              <div className="bg-surface-container-high/60 px-4 py-2.5 rounded-lg text-xs font-mono text-on-surface mt-4">
                ID: {successOrderId}
              </div>
              <button 
                onClick={() => setCheckoutSuccess(false)}
                className="mt-8 px-6 py-3 bg-primary text-on-primary text-xs font-black uppercase tracking-wider rounded-xl hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                Next Order
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                {filteredProducts.map(product => (
                  <button 
                    key={product._id}
                    onClick={() => addToCart(product)}
                    className="group flex flex-col items-start gap-3 rounded-xl bg-surface-container p-3 text-left transition-all hover:bg-surface-container-high active:scale-95 ring-1 ring-outline-variant/20 hover:ring-primary/40 cursor-pointer"
                  >
                    <div className="aspect-square w-full overflow-hidden rounded-lg bg-surface-variant">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 w-full min-w-0">
                      <p className="text-sm font-semibold text-on-surface line-clamp-1">{product.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-black text-primary">Rs. {product.price.toFixed(2)}</span>
                        <span className="text-[10px] text-on-surface-variant font-bold uppercase">{product.unit}</span>
                      </div>
                    </div>
                  </button>
                ))}
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

      {/* Cart Sidebar */}
      <aside className="w-96 bg-surface-container-low border-l border-outline-variant flex flex-col shrink-0">
        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-on-surface">Order Summary</h2>
            <span className="rounded-full bg-secondary-container px-3 py-1 text-xs font-bold text-on-secondary-container">
              {cart.reduce((a, b) => a + b.quantity, 0)} Items
            </span>
          </div>

          {/* Diners & Service Toggle (Only for restaurant/bakery shops) */}
          {isFoodShop && cart.length > 0 && (
            <div className="mb-6 bg-surface-container p-3 rounded-lg border border-outline-variant/30 space-y-3">
              <div className="flex bg-surface-container-low p-1 rounded-md border border-outline-variant/50">
                {(['dine-in', 'takeaway', 'delivery'] as const).map(t => (
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
                    {t.replace('-', ' ')}
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

          {/* Cart Items List */}
          <div className="flex flex-col gap-4">
            {cart.map(item => {
              const product = products.find(p => p._id === item.productId)!;
              if (!product) return null;
              return (
                <div key={item.productId} className="flex flex-col gap-2 rounded-lg bg-surface-container p-3 border border-outline-variant/10">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-on-surface line-clamp-1">{product.name}</h3>
                      <p className="text-xs text-on-surface-variant">Unit: {product.unit || 'Standard'}</p>
                      
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
                      <p className="text-sm font-bold text-on-surface">Rs. {(product.price * item.quantity).toFixed(2)}</p>
                      <button 
                        onClick={() => removeFromCart(product._id)}
                        className="mt-2 text-error hover:underline text-xs cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Add Notes only for food outlets */}
                  {isFoodShop && (
                    <input 
                      type="text"
                      placeholder="Special note (e.g. no cheese)..."
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
                <p className="mt-4 text-sm">Your cart is empty</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Checkout Panel */}
        <div className="border-t border-outline-variant bg-surface-container-high p-6 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Subtotal</span>
              <span className="font-medium text-on-surface">Rs. {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Tax (8%)</span>
              <span className="font-medium text-on-surface">Rs. {tax.toFixed(2)}</span>
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
              {checkoutLoading ? 'Processing...' : 'Settle Bill'}
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
      </aside>
    </div>
  );
}
