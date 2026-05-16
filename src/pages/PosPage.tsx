import React, { useState } from 'react';
import { Search, ArrowLeft, Plus, Minus, X, CreditCard, Cake, Utensils, Cookie, Coffee, ShoppingBag } from 'lucide-react';
import { cn } from '../lib/utils';
import { Product, OrderItem } from '../types';

const PRODUCTS: Product[] = [
  { id: '1', name: 'Chocolate Fudge', category: 'Cakes', price: 25.00, image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop', unit: 'Whole Cake' },
  { id: '2', name: 'Sourdough Loaf', category: 'Breads', price: 8.50, image: 'https://images.unsplash.com/photo-1585478259715-876a6a81b69c?w=400&h=400&fit=crop', unit: 'Loaf' },
  { id: '3', name: 'Butter Croissant', category: 'Pastries', price: 3.75, image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=400&fit=crop', unit: 'Individual' },
  { id: '4', name: 'Baguette', category: 'Breads', price: 5.00, image: 'https://images.unsplash.com/photo-1586444248902-2f64eddf13cf?w=400&h=400&fit=crop', unit: 'Loaf' },
  { id: '5', name: 'Sea Salt Cookie', category: 'Pastries', price: 2.50, image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&h=400&fit=crop', unit: 'Individual' },
  { id: '6', name: 'Matcha Cupcake', category: 'Cakes', price: 4.50, image: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=400&h=400&fit=crop', unit: 'Individual' }
];

const CATEGORIES = [
  { name: 'Cakes', icon: Cake },
  { name: 'Breads', icon: Utensils },
  { name: 'Pastries', icon: Cookie },
  { name: 'Beverages', icon: Coffee }
];

export function PosPage() {
  const [selectedCategory, setSelectedCategory] = useState('Cakes');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: Math.random().toString(), productId: product.id, quantity: 1, status: 'pending' }];
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

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const subtotal = cart.reduce((acc, item) => {
    const product = PRODUCTS.find(p => p.id === item.productId);
    return acc + (product?.price || 0) * item.quantity;
  }, 0);

  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const filteredProducts = PRODUCTS.filter(p => 
    p.category === selectedCategory && 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Product Discovery Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between border-b border-outline-variant px-6 py-4 bg-surface-container">
          <div className="flex items-center gap-4">
            <button className="flex size-10 items-center justify-center rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors transition-transform active:scale-95">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold tracking-tight text-on-surface">New Order</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
            <input 
              type="text"
              placeholder="Search products..." 
              className="h-10 w-64 rounded-lg border-none bg-surface-container-highest pl-10 text-sm text-on-surface placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        <nav className="flex gap-4 border-b border-outline-variant bg-surface px-6 py-3 overflow-x-auto no-scrollbar">
          {CATEGORIES.map(cat => (
            <button 
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={cn(
                "flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition-colors whitespace-nowrap",
                selectedCategory === cat.name 
                  ? "bg-primary text-on-primary" 
                  : "bg-surface-container-high text-on-surface-variant hover:bg-surface-variant"
              )}
            >
              <cat.icon size={16} />
              {cat.name}
            </button>
          ))}
        </nav>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {filteredProducts.map(product => (
              <button 
                key={product.id}
                onClick={() => addToCart(product)}
                className="group flex flex-col items-start gap-3 rounded-xl bg-surface-container p-3 text-left transition-all hover:bg-surface-container-high active:scale-95 ring-1 ring-outline-variant/20 hover:ring-primary/40"
              >
                <div className="aspect-square w-full overflow-hidden rounded-lg bg-surface-variant">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface line-clamp-1">{product.name}</p>
                  <p className="text-xs font-medium text-primary">Rs. {product.price.toFixed(2)}</p>
                </div>
              </button>
            ))}
          </div>
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

          <div className="flex flex-col gap-4">
            {cart.map(item => {
              const product = PRODUCTS.find(p => p.id === item.productId)!;
              return (
                <div key={item.id} className="flex items-center gap-4 rounded-lg bg-surface-container p-3 border border-outline-variant/10">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-on-surface">{product.name}</h3>
                    <p className="text-xs text-on-surface-variant">{product.unit || 'Standard'}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <button 
                        onClick={() => updateQuantity(product.id, -1)}
                        className="flex size-7 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface active:scale-90 transition-transform"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-bold text-on-surface w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(product.id, 1)}
                        className="flex size-7 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface active:scale-90 transition-transform"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-on-surface">Rs. {(product.price * item.quantity).toFixed(2)}</p>
                    <button 
                      onClick={() => removeFromCart(product.id)}
                      className="mt-2 text-error hover:underline text-xs"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
            {cart.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant opacity-50">
                <ShoppingBag size={48} strokeWidth={1} />
                <p className="mt-4 text-sm">Your cart is empty</p>
              </div>
            )}
          </div>
        </div>

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
            <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-lg font-bold text-on-primary shadow-lg hover:shadow-primary/20 active:scale-95 transition-all">
              <CreditCard size={20} />
              Pay Now
            </button>
            <button 
              onClick={() => setCart([])}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-outline-variant bg-transparent py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-variant active:scale-95 transition-all"
            >
              <X size={16} />
              Cancel Order
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
