'use client';

import React, { useState, useEffect } from 'react';
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
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingBag, 
  Zap,
  Download,
  Calendar,
  Trash2,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTenant } from '@/context/TenantContext';
import Link from 'next/link';

const FORECAST_DATA = [
  { day: 'Mon', predicted: 4000, actual: 3800 },
  { day: 'Tue', predicted: 3000, actual: 3200 },
  { day: 'Wed', predicted: 2000, actual: 2100 },
  { day: 'Thu', predicted: 2780, actual: 2500 },
  { day: 'Fri', predicted: 1890, actual: 1950 },
  { day: 'Sat', predicted: 4390, actual: 4400 },
  { day: 'Sun', predicted: 3490, actual: 3600 },
];

const TRAFFIC_DATA = [
  { hour: '6am', traffic: 20 },
  { hour: '7am', traffic: 45 },
  { hour: '8am', traffic: 90 },
  { hour: '9am', traffic: 100 },
  { hour: '10am', traffic: 85 },
  { hour: '11am', traffic: 60 },
  { hour: '12pm', traffic: 75 },
  { hour: '1pm', traffic: 80 },
  { hour: '2pm', traffic: 50 },
  { hour: '3pm', traffic: 40 },
  { hour: '4pm', traffic: 35 },
  { hour: '5pm', traffic: 65 },
  { hour: '6pm', traffic: 95 },
  { hour: '7pm', traffic: 110 },
  { hour: '8pm', traffic: 85 },
  { hour: '9pm', traffic: 40 },
];

export default function AnalyticsPage() {
  const { activeTenant, loading: tenantLoading } = useTenant();
  const [orders, setOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch tenant statistics from backend
  useEffect(() => {
    if (!activeTenant) return;

    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [ordersRes, invRes] = await Promise.all([
          fetch(`/api/orders?tenantId=${activeTenant._id}`),
          fetch(`/api/inventory?tenantId=${activeTenant._id}`)
        ]);

        const ordersData = await ordersRes.json();
        const invData = await invRes.json();

        if (ordersData.success) setOrders(ordersData.data);
        if (invData.success) setInventory(invData.data);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [activeTenant]);

  // Loading States
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

  // No Tenant State
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

  // Access Module Check
  if (!activeTenant.enabledModules.includes('analytics')) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-surface text-center p-8">
        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center text-error mb-4">
          <ShieldAlert size={36} />
        </div>
        <h1 className="text-2xl font-black text-on-surface">Module Disabled</h1>
        <p className="text-on-surface-variant text-sm mt-2 max-w-md">
          The "Analytics" module is not enabled for <span className="font-bold text-on-surface">{activeTenant.name}</span>. Please contact your Super Admin to manage access settings.
        </p>
        <Link href="/super-admin" className="mt-6 px-5 py-2.5 bg-surface-container-high hover:bg-surface-variant border border-outline-variant rounded-lg text-xs font-bold text-on-surface active:scale-95 transition-all">
          Configure Access Modules
        </Link>
      </div>
    );
  }

  // Calculate stats from dynamic database records
  const completedOrders = orders.filter(o => o.status === 'completed');
  const dailySalesSum = completedOrders.reduce((sum, o) => sum + o.total, 0);
  const activeOrdersCount = orders.filter(o => ['new', 'preparing', 'ready'].includes(o.status)).length;
  const lowStockCount = inventory.filter(item => {
    // If it's a hardware shop, trigger alert below 6 units. Otherwise below 20.
    const threshold = activeTenant.type === 'hardware' ? 6 : 20;
    return item.currentStock < threshold;
  }).length;

  // Aggregate product sales
  const productSalesMap: Record<string, { name: string; sales: number; totalRev: number; image: string }> = {};
  orders.forEach(order => {
    order.items.forEach((item: any) => {
      const prod = item.productId;
      if (prod) {
        const prodId = prod._id || prod.id;
        if (!productSalesMap[prodId]) {
          productSalesMap[prodId] = {
            name: prod.name,
            sales: 0,
            totalRev: 0,
            image: prod.image
          };
        }
        productSalesMap[prodId].sales += item.quantity;
        productSalesMap[prodId].totalRev += item.quantity * prod.price;
      }
    });
  });

  const sortedTopProducts = Object.values(productSalesMap)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 4);

  return (
    <div className="flex flex-col h-full bg-surface overflow-y-auto scrollbar-hide">
      <header className="px-8 py-8 border-b border-outline-variant bg-surface-container-low/30 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-on-surface">Owner Analytics</h1>
            <p className="text-on-surface-variant text-sm mt-1">Real-time performance and database insights for {activeTenant.name}.</p>
          </div>
          <div className="flex gap-3">
             <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high border border-outline-variant text-on-surface text-sm font-bold hover:bg-surface-variant active:scale-95 transition-all cursor-pointer">
                <Calendar size={16} />
                Last 7 Days
             </button>
             <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-container active:scale-95 transition-all cursor-pointer">
                <Download size={16} />
                Export Report
             </button>
          </div>
        </div>
      </header>

      <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Daily Revenue', val: `Rs. ${dailySalesSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, delta: `${completedOrders.length} checks settled`, up: true, icon: ShoppingBag, color: 'text-primary' },
            { label: 'Low Stock Alert', val: lowStockCount.toString(), delta: lowStockCount > 0 ? 'Requires attention' : 'All items optimal', up: lowStockCount === 0, icon: Trash2, color: lowStockCount > 0 ? 'text-secondary' : 'text-on-surface-variant' },
            { label: 'Active Orders', val: activeOrdersCount.toString(), delta: `${orders.length} orders total`, up: true, icon: Users, color: 'text-tertiary' },
            { label: 'Forecast Accuracy', val: '98.2%', up: true, icon: Zap, color: 'text-primary' }
          ].map((kpi, i) => (
            <div key={i} className="p-6 rounded-xl bg-surface-container border border-outline-variant hover:border-outline transition-colors group">
               <div className="flex justify-between items-start mb-2">
                 <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">{kpi.label}</p>
                 <kpi.icon className={cn("transition-transform group-hover:scale-110", kpi.color)} size={18} />
               </div>
               <p className="text-3xl font-black tracking-tight text-on-surface mb-1 truncate">{kpi.val}</p>
               <div className="flex items-center gap-1">
                 <span className={cn("text-[10px] font-bold", kpi.up ? "text-primary" : "text-secondary")}>
                   {kpi.delta}
                 </span>
               </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Chart */}
          <div className="lg:col-span-8 p-8 rounded-xl bg-surface-container border border-outline-variant">
             <div className="flex items-center justify-between mb-8">
               <div>
                 <h2 className="text-xl font-bold text-on-surface">AI Production Forecast</h2>
                 <p className="text-on-surface-variant text-xs">Predicted vs. Actual Demand (Last 7 Days)</p>
               </div>
               <div className="flex gap-4">
                 <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-on-surface-variant">
                   <div className="size-2 rounded-full bg-primary" /> Predicted
                 </div>
                 <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-on-surface-variant">
                   <div className="size-2 rounded-full bg-outline" /> Actual
                 </div>
               </div>
             </div>

             <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={FORECAST_DATA}>
                      <defs>
                        <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#c7c9a2" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#c7c9a2" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1c2026" />
                      <XAxis 
                        dataKey="day" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#8b919f', fontSize: 10, fontWeight: 700}}
                        dy={10}
                      />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{backgroundColor: '#1c2026', border: '1px solid #414753', borderRadius: '8px', fontSize: '12px'}}
                        itemStyle={{color: '#e0e2ec'}}
                      />
                      <Area type="monotone" dataKey="predicted" stroke="#c7c9a2" strokeWidth={3} fillOpacity={1} fill="url(#colorPred)" />
                      <Area type="monotone" dataKey="actual" stroke="#8b919f" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
                    </AreaChart>
                  </ResponsiveContainer>
             </div>
          </div>

          {/* Top Products */}
          <div className="lg:col-span-4 p-8 rounded-xl bg-surface-container border border-outline-variant flex flex-col">
             <div className="mb-6">
                  <h2 className="text-xl font-bold text-on-surface">Top Products</h2>
                  <p className="text-on-surface-variant text-xs">Best sellers by volume this session</p>
             </div>
             <div className="flex-1 space-y-5">
               {sortedTopProducts.map((prod, i) => (
                 <div key={i} className="flex items-center gap-4 group">
                    <img src={prod.image} alt={prod.name} className="size-12 rounded-lg object-cover border border-outline-variant group-hover:scale-105 transition-transform" />
                    <div className="flex-1 min-w-0">
                       <p className="text-sm font-bold text-on-surface truncate">{prod.name}</p>
                       <p className="text-[10px] text-on-surface-variant font-medium">{prod.sales} units sold</p>
                    </div>
                    <p className="text-xs font-black text-primary">Rs. {prod.totalRev.toFixed(2)}</p>
                 </div>
               ))}
               
               {sortedTopProducts.length === 0 && (
                 <div className="flex flex-col items-center justify-center h-full opacity-40 py-10">
                   <ShoppingBag size={32} />
                   <p className="text-xs font-semibold mt-2">No transactions logged yet</p>
                 </div>
               )}
             </div>
             <button className="w-full mt-6 py-2.5 text-xs font-black uppercase tracking-widest text-on-surface-variant hover:text-on-surface bg-surface-container-high rounded-lg transition-colors border border-outline-variant/50">
               View Full Matrix
             </button>
          </div>
        </div>

        {/* Heatmap Section */}
        <div className="p-8 rounded-xl bg-surface-container border border-outline-variant">
           <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-on-surface">Hourly Traffic Heatmap</h2>
                <p className="text-on-surface-variant text-xs">Identifying peak operation hours for staffing optimization</p>
              </div>
              <div className="flex items-center gap-3">
                 <span className="text-[9px] font-black uppercase text-on-surface-variant tracking-wider">Quiet</span>
                 <div className="flex gap-1">
                    {[0.1, 0.3, 0.6, 0.8, 1].map(o => (
                      <div key={o} className="size-4 rounded bg-primary" style={{opacity: o}} />
                    ))}
                 </div>
                 <span className="text-[9px] font-black uppercase text-on-surface-variant tracking-wider">Peak</span>
              </div>
           </div>

           <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={TRAFFIC_DATA}>
                    <XAxis 
                       dataKey="hour" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{fill: '#8b919f', fontSize: 9, fontWeight: 700}}
                    />
                    <Tooltip 
                       cursor={{fill: 'transparent'}}
                       contentStyle={{backgroundColor: '#1c2026', border: '1px solid #414753', borderRadius: '8px'}}
                    />
                    <Bar dataKey="traffic" radius={[2, 2, 0, 0]}>
                       {TRAFFIC_DATA.map((entry, index) => (
                         <Cell key={index} fill="#c7c9a2" fillOpacity={entry.traffic / 120} />
                       ))}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
}
