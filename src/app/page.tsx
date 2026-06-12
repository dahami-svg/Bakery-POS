'use client';

import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import {
  Users,
  ShoppingBag,
  Zap,
  Download,
  Trash2,
  ShieldAlert,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTenant } from '@/context/TenantContext';
import Link from 'next/link';

const dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });

export default function AnalyticsPage() {
  const { activeTenant, loading: tenantLoading } = useTenant();
  const [orders, setOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!activeTenant) return;

    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [ordersRes, invRes] = await Promise.all([
          fetch(`/api/orders?tenantId=${activeTenant._id}`),
          fetch(`/api/inventory?tenantId=${activeTenant._id}`),
        ]);

        const ordersData = await ordersRes.json();
        const invData = await invRes.json();

        if (ordersData.success) setOrders(ordersData.data);
        if (invData.success) setInventory(invData.data);
      } catch {
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [activeTenant]);

  if (tenantLoading || (activeTenant && loadingData)) {
    return (
      <div className="flex items-center justify-center h-full bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  if (!activeTenant) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-surface text-center p-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
          <Zap size={36} />
        </div>
        <h1 className="text-2xl font-black text-on-surface">No Shop Provisioned</h1>
        <p className="text-on-surface-variant text-sm mt-2 max-w-md">
          Please navigate to the Super Admin portal to seed the database and select your tenant.
        </p>
        <Link href="/super-admin" className="mt-6 px-5 py-2.5 bg-primary text-on-primary rounded-lg text-xs font-bold active:scale-95 transition-all">
          Provision Database
        </Link>
      </div>
    );
  }

  if (!activeTenant.enabledModules.includes('analytics')) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-surface text-center p-8">
        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center text-error mb-4">
          <ShieldAlert size={36} />
        </div>
        <h1 className="text-2xl font-black text-on-surface">Module Disabled</h1>
        <p className="text-on-surface-variant text-sm mt-2 max-w-md">
          The Analytics module is not enabled for <span className="font-bold text-on-surface">{activeTenant.name}</span>.
        </p>
        <Link href="/super-admin" className="mt-6 px-5 py-2.5 bg-surface-container-high hover:bg-surface-variant border border-outline-variant rounded-lg text-xs font-bold text-on-surface active:scale-95 transition-all">
          Configure Access Modules
        </Link>
      </div>
    );
  }

  const completedOrders = orders.filter((order) => order.status === 'completed');
  const activeOrdersCount = orders.filter((order) => ['new', 'preparing', 'ready'].includes(order.status)).length;
  const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
  const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
  const lowStockThreshold = activeTenant.type === 'hardware' ? 6 : 20;
  const lowStockCount = inventory.filter((item) => item.currentStock < lowStockThreshold).length;

  const now = new Date();
  const salesByDay = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(now.getDate() - (6 - index));
    const dayKey = date.toISOString().slice(0, 10);

    const dayOrders = completedOrders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate.toISOString().slice(0, 10) === dayKey;
    });

    return {
      day: dayFormatter.format(date),
      sales: dayOrders.reduce((sum, order) => sum + order.total, 0),
      orders: dayOrders.length,
    };
  });

  const statusCounts = [
    { label: 'New', count: orders.filter((order) => order.status === 'new').length },
    { label: 'Preparing', count: orders.filter((order) => order.status === 'preparing').length },
    { label: 'Ready', count: orders.filter((order) => order.status === 'ready').length },
    { label: 'Completed', count: orders.filter((order) => order.status === 'completed').length },
  ];

  const productSalesMap: Record<string, { name: string; sales: number; revenue: number; image: string }> = {};
  orders.forEach((order) => {
    order.items.forEach((item: any) => {
      const product = item.productId;
      if (!product) return;
      const productId = product._id || product.id;
      if (!productSalesMap[productId]) {
        productSalesMap[productId] = {
          name: product.name,
          sales: 0,
          revenue: 0,
          image: product.image,
        };
      }
      productSalesMap[productId].sales += item.quantity;
      productSalesMap[productId].revenue += item.quantity * product.price;
    });
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="flex flex-col h-full bg-surface overflow-y-auto scrollbar-hide">
      <div className="p-4 lg:p-8 space-y-4 lg:space-y-8 mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {[
            { label: 'Revenue', val: `Rs. ${totalRevenue.toFixed(2)}`, delta: `${completedOrders.length} completed orders`, icon: ShoppingBag, color: 'text-primary' },
            { label: 'Average Ticket', val: `Rs. ${averageOrderValue.toFixed(2)}`, delta: 'Per completed order', icon: Activity, color: 'text-secondary' },
            { label: 'Active Orders', val: activeOrdersCount.toString(), delta: `${orders.length} total orders`, icon: Users, color: 'text-tertiary' },
            { label: 'Low Stock Alert', val: lowStockCount.toString(), delta: lowStockCount > 0 ? 'Needs attention' : 'Inventory is healthy', icon: Trash2, color: lowStockCount > 0 ? 'text-secondary' : 'text-on-surface-variant' },
          ].map((kpi, index) => (
            <div key={index} className="p-4 lg:p-6 rounded-xl bg-surface-container border border-outline-variant hover:border-outline transition-colors group">
              <div className="flex justify-between items-start mb-2">
                <p className="text-on-surface-variant text-[10px] lg:text-xs font-bold uppercase tracking-widest">{kpi.label}</p>
                <kpi.icon className={cn('transition-transform group-hover:scale-110 shrink-0', kpi.color)} size={18} />
              </div>
              <p className="text-xl lg:text-3xl font-black tracking-tight text-on-surface mb-1 truncate">{kpi.val}</p>
              <span className="text-[10px] font-bold text-on-surface-variant">{kpi.delta}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8">
          <div className="lg:col-span-8 p-4 lg:p-8 rounded-xl bg-surface-container border border-outline-variant">
            <div className="flex items-center justify-between mb-6 lg:mb-8">
              <div>
                <h2 className="text-lg lg:text-xl font-bold text-on-surface">Sales Trend</h2>
                <p className="text-on-surface-variant text-xs">Last 7 days of completed orders</p>
              </div>
            </div>

            <div className="h-56 lg:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesByDay}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--chart-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-tick)', fontSize: 10, fontWeight: 700 }} dy={10} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ color: 'var(--chart-tooltip-text)' }}
                      formatter={(value: number) => [`Rs. ${value.toFixed(2)}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="sales" stroke="var(--chart-primary)" strokeWidth={3} fillOpacity={1} fill="url(#salesGradient)" />
                  </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-4 p-4 lg:p-8 rounded-xl bg-surface-container border border-outline-variant flex flex-col">
            <div className="mb-6">
              <h2 className="text-lg lg:text-xl font-bold text-on-surface">Top Products</h2>
              <p className="text-on-surface-variant text-xs">Best sellers by quantity across all orders</p>
            </div>
            <div className="flex-1 space-y-5">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center gap-4 group">
                  <img src={product.image} alt={product.name} className="size-10 lg:size-12 rounded-lg object-cover border border-outline-variant group-hover:scale-105 transition-transform" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">{product.name}</p>
                    <p className="text-[10px] text-on-surface-variant font-medium">{product.sales} units sold</p>
                  </div>
                  <p className="text-xs font-black text-primary">Rs. {product.revenue.toFixed(2)}</p>
                </div>
              ))}

              {topProducts.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full opacity-40 py-10">
                  <ShoppingBag size={32} />
                  <p className="text-xs font-semibold mt-2">No transactions logged yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8">
          <div className="lg:col-span-5 p-4 lg:p-8 rounded-xl bg-surface-container border border-outline-variant">
            <div className="mb-6 lg:mb-8">
              <h2 className="text-lg lg:text-xl font-bold text-on-surface">Order Status Mix</h2>
              <p className="text-on-surface-variant text-xs">Current queue distribution</p>
            </div>
            <div className="h-52 lg:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusCounts}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-tick)', fontSize: 10, fontWeight: 700 }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-tick)', fontSize: 10, fontWeight: 700 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: 'var(--chart-tooltip-text)' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {statusCounts.map((entry, index) => (
                      <Cell key={index} fill="var(--chart-primary)" fillOpacity={Math.max(0.25, entry.count / Math.max(orders.length, 1))} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-7 p-4 lg:p-8 rounded-xl bg-surface-container border border-outline-variant">
            <div className="mb-6">
              <h2 className="text-lg lg:text-xl font-bold text-on-surface">Recent Orders</h2>
              <p className="text-on-surface-variant text-xs">Latest activity flowing through the POS</p>
            </div>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order._id} className="flex items-center justify-between gap-4 rounded-xl border border-outline-variant bg-surface-container-high/40 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">#{order._id.slice(-6).toUpperCase()}</p>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">
                      {order.type.replace('-', ' ')} · {order.items.length} items
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-primary">Rs. {Number(order.total).toFixed(2)}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{order.status}</p>
                  </div>
                </div>
              ))}

              {recentOrders.length === 0 && (
                <div className="rounded-xl border border-dashed border-outline-variant py-10 text-center text-xs text-on-surface-variant">
                  No order activity yet for this tenant.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
