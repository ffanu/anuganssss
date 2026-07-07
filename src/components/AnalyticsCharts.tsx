import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { Transaction, MANUAL_CATEGORIES } from "../types";
import { DollarSign, TrendingUp, ShoppingBag, PieChart as PieIcon, BarChart3 } from "lucide-react";

interface AnalyticsChartsProps {
  transactions: Transaction[];
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ transactions }) => {
  // Helper to format IDR cleanly
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  // 1. Process data for Income vs Outgoing over time (grouped by date)
  const getTimelineData = () => {
    const dailyMap: { [date: string]: { date: string; incoming: number; outgoing: number } } = {};

    // Get last 15 unique transaction dates to avoid overcrowding
    transactions.forEach((t) => {
      const dStr = t.date;
      if (!dailyMap[dStr]) {
        dailyMap[dStr] = { date: dStr, incoming: 0, outgoing: 0 };
      }
      if (t.type === "incoming") {
        dailyMap[dStr].incoming += t.amount;
      } else {
        dailyMap[dStr].outgoing += t.amount;
      }
    });

    // Sort by date ascending
    return Object.values(dailyMap)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-10); // last 10 days of activities
  };

  // 2. Process data for Outgoing Categories breakdown
  const getCategoryData = () => {
    const outgoingMap: { [cat: string]: number } = {};
    transactions.filter((t) => t.type === "outgoing").forEach((t) => {
      outgoingMap[t.category] = (outgoingMap[t.category] || 0) + t.amount;
    });

    const categoriesList = MANUAL_CATEGORIES.outgoing;

    return Object.keys(outgoingMap).map((catKey) => {
      const match = categoriesList.find((c) => c.value === catKey);
      return {
        name: match ? match.label : catKey,
        value: outgoingMap[catKey],
        color: match ? match.color : "#6B7280"
      };
    }).sort((a, b) => b.value - a.value);
  };

  const timelineData = getTimelineData();
  const categoryData = getCategoryData();

  const totalOutgoing = categoryData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Chart: Income vs Outgoing timeline trend */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-500" />
            Cash Flow Trend (Daily)
          </h3>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Last 10 Days</span>
        </div>

        {timelineData.length === 0 ? (
          <div className="h-72 flex flex-col items-center justify-center text-center">
            <TrendingUp className="h-10 w-10 text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-500">Not enough transaction history</p>
            <p className="text-[10px] text-slate-400 mt-1">Log records to generate charts.</p>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncoming" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOutgoing" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94A3B8" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#94A3B8" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `Rp ${val >= 1000000 ? (val/1000000).toFixed(1) + 'M' : val}`}
                />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(Number(value)), ""]}
                  contentStyle={{ backgroundColor: "#0F172A", border: "none", borderRadius: "12px", color: "#fff", fontSize: "11px" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Area 
                  type="monotone" 
                  name="Incoming (+)" 
                  dataKey="incoming" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorIncoming)" 
                />
                <Area 
                  type="monotone" 
                  name="Outgoing (-)" 
                  dataKey="outgoing" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorOutgoing)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Chart: Outgoing Categories Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-rose-500" />
            Outgoing Money Distribution
          </h3>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Expense Shares</span>
        </div>

        {categoryData.length === 0 ? (
          <div className="h-72 flex flex-col items-center justify-center text-center">
            <ShoppingBag className="h-10 w-10 text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-500">No outgoing transactions found</p>
            <p className="text-[10px] text-slate-400 mt-1">Add outgoing (expenses) to see breakdown.</p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6 min-h-[360px] sm:h-72">
            <div className="h-44 sm:h-full w-full sm:w-1/2 relative flex items-center justify-center shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <span className="text-[9px] text-slate-400 uppercase font-extrabold block leading-none">Total Outgoing</span>
                <span className="text-sm font-black text-slate-800 font-sans block mt-1">{formatCurrency(totalOutgoing)}</span>
              </div>
            </div>

            {/* Custom visual legend */}
            <div className="w-full sm:w-1/2 space-y-2 overflow-y-auto max-h-60 pr-1">
              {categoryData.map((item, idx) => {
                const percentage = totalOutgoing > 0 ? Math.round((item.value / totalOutgoing) * 100) : 0;
                return (
                  <div key={idx} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="font-bold text-slate-600 truncate">{item.name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-black text-slate-800 mr-1.5">{formatCurrency(item.value)}</span>
                      <span className="text-slate-400">({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
