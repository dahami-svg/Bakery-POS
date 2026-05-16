import React from 'react';
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
  Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';

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

const TOP_PRODUCTS = [
  { name: 'Sourdough Loaf', sales: 240, gain: '+Rs. 1.2k', image: 'https://images.unsplash.com/photo-1585478259715-876a6a81b69c?w=100&h=100&fit=crop' },
  { name: 'Almond Croissant', sales: 182, gain: '+Rs. 910', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=100&h=100&fit=crop' },
  { name: 'Rosemary Focaccia', sales: 156, gain: '+Rs. 780', image: 'https://images.unsplash.com/photo-1534620808146-d33bb39128b2?w=100&h=100&fit=crop' },
  { name: 'Fruit Danish', sales: 112, gain: '+Rs. 672', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100&h=100&fit=crop' }
];

export function AnalyticsPage() {
  return (
    <div className="flex flex-col h-full bg-surface overflow-y-auto scrollbar-hide">
      <header className="px-8 py-8 border-b border-outline-variant bg-surface-container-low/30 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-on-surface">Owner Analytics</h1>
            <p className="text-on-surface-variant text-sm mt-1">Real-time performance and AI-driven production insights.</p>
          </div>
          <div className="flex gap-3">
             <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high border border-outline-variant text-on-surface text-sm font-bold hover:bg-surface-variant active:scale-95 transition-all">
                <Calendar size={16} />
                Last 7 Days
             </button>
             <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-container active:scale-95 transition-all">
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
            { label: 'Daily Sales', val: 'Rs. 4,250', delta: '+12%', up: true, icon: ShoppingBag, color: 'text-primary' },
            { label: 'Waste Rate', val: '4.2%', delta: '-0.5%', up: false, icon: Trash2, color: 'text-secondary' },
            { label: 'Active Orders', val: '128', delta: '+8%', up: true, icon: Users, color: 'text-tertiary' },
            { label: 'Forecast Accuracy', val: '98.2%', up: true, icon: Zap, color: 'text-primary' }
          ].map((kpi, i) => (
            <div key={i} className="p-6 rounded-xl bg-surface-container border border-outline-variant hover:border-outline transition-colors group">
               <div className="flex justify-between items-start mb-2">
                 <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">{kpi.label}</p>
                 <kpi.icon className={cn("transition-transform group-hover:scale-110", kpi.color)} size={18} />
               </div>
               <p className="text-3xl font-black tracking-tight text-on-surface mb-1">{kpi.val}</p>
               <div className="flex items-center gap-1">
                 {kpi.delta && (
                   <>
                     {kpi.up ? <TrendingUp size={12} className="text-primary" /> : <TrendingDown size={12} className="text-secondary" />}
                     <span className={cn("text-[10px] font-bold", kpi.up ? "text-primary" : "text-secondary")}>
                       {kpi.delta} from {kpi.label === 'Daily Sales' ? 'yesterday' : 'avg'}
                     </span>
                   </>
                 )}
                 {!kpi.delta && (
                   <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Optimized</span>
                 )}
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
                <p className="text-on-surface-variant text-xs">Best sellers by volume this week</p>
             </div>
             <div className="flex-1 space-y-5">
               {TOP_PRODUCTS.map((prod, i) => (
                 <div key={i} className="flex items-center gap-4 group">
                    <img src={prod.image} className="size-12 rounded-lg object-cover border border-outline-variant group-hover:scale-105 transition-transform" />
                    <div className="flex-1 min-w-0">
                       <p className="text-sm font-bold text-on-surface truncate">{prod.name}</p>
                       <p className="text-[10px] text-on-surface-variant font-medium">{prod.sales} units sold</p>
                    </div>
                    <p className="text-xs font-black text-primary">{prod.gain}</p>
                 </div>
               ))}
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
