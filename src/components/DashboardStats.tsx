import React from "react";
import { ArrowUpRight, ArrowDownLeft, Globe, RefreshCw, AlertTriangle, CheckCircle2, TrendingUp, DollarSign } from "lucide-react";
import { XenditBalance } from "../types";

interface DashboardStatsProps {
  xendit1Month: number;
  cash1Month: number;
  runningMoneyOut: number;
  xenditBalance: XenditBalance | null;
  isLoadingXendit: boolean;
  onRefreshXendit: () => void;
  xenditConfigured: boolean;
  manualIncome: number;
  manualExpense: number;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  xendit1Month,
  cash1Month,
  runningMoneyOut,
  xenditBalance,
  isLoadingXendit,
  onRefreshXendit,
  xenditConfigured,
  manualIncome,
  manualExpense
}) => {
  const netManual = manualIncome - manualExpense;
  const totalAssets = netManual + (xenditBalance?.balance || 0);

  // Helper to format IDR currency cleanly
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  const savingsRate = manualIncome > 0 ? Math.round((netManual / manualIncome) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Visual Card: Online Money (Xendit Balance for 1 Month) */}
      <div 
        id="card-online"
        className="bg-indigo-600 rounded-xl p-5 shadow-lg shadow-indigo-100 text-white flex flex-col justify-between h-36 relative group"
      >
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-indigo-100 text-[10px] font-black uppercase tracking-wider">Xendit Incoming (1 Month)</p>
            <button
              onClick={onRefreshXendit}
              disabled={isLoadingXendit}
              className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh online sync"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingXendit ? "animate-spin" : ""}`} />
            </button>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-sans tracking-tight mt-1">
            {formatCurrency(xendit1Month)}
          </h2>
        </div>
        <div className="flex justify-between items-end">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-indigo-500/30 text-indigo-100 border border-indigo-400/20">
              Last 30 Days Successful
            </span>
          </div>
          <div className="flex -space-x-1.5">
            <div className="w-5 h-5 rounded-full border border-indigo-600 bg-white/20"></div>
            <div className="w-5 h-5 rounded-full border border-indigo-600 bg-white/40"></div>
          </div>
        </div>
      </div>

      {/* Visual Card: Cash/Manual Incoming (1 Month) */}
      <div 
        id="card-incoming"
        className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between h-36"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Cash/Manual Incoming (1 Month)</p>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mt-1">
            {formatCurrency(cash1Month)}
          </h2>
        </div>
        <div className="text-[10px] font-black text-emerald-600 uppercase tracking-wide flex items-center gap-1">
          <ArrowUpRight className="h-4 w-4" />
          Last 30 Days Cash Inflow
        </div>
      </div>

      {/* Visual Card: Outgoing Money (Running Total) */}
      <div 
        id="card-outgoing"
        className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between h-36"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 bg-rose-500 rounded-full"></div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Money Out (Running Total)</p>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mt-1">
            {formatCurrency(runningMoneyOut)}
          </h2>
        </div>
        <div className="text-[10px] font-black text-rose-500 uppercase tracking-wide flex items-center gap-1">
          <ArrowDownLeft className="h-4 w-4" />
          Ongoing cumulative outflow
        </div>
      </div>

      {/* Full Width/Combined Summary Details */}
      <div 
        id="ledger-summary"
        className="col-span-1 md:col-span-3 bg-slate-900 text-white rounded-xl p-6 shadow-sm border border-slate-800 relative overflow-hidden"
      >
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-6 translate-y-6">
          <Globe className="h-48 w-48 text-indigo-400" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-xs text-indigo-300 uppercase tracking-wider font-semibold block mb-1">Total Assets Dashboard Summary</span>
            <h2 className="text-3xl font-extrabold font-sans tracking-tight">
              {formatCurrency(totalAssets)}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Combined Manual Net Ledger <span className="font-semibold text-slate-200">({formatCurrency(netManual)})</span> and Online Xendit Balance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl px-4 py-3 min-w-[120px]">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Savings Rate</span>
              <span className={`text-lg font-bold ${savingsRate >= 30 ? "text-emerald-400" : "text-amber-400"}`}>
                {savingsRate}%
              </span>
            </div>
            
            <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl px-4 py-3 min-w-[120px]">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Net Ledger</span>
              <span className={`text-lg font-bold ${netManual >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {formatCurrency(netManual)}
              </span>
            </div>
          </div>
        </div>

        {/* Informative connection banner when Xendit API key is simulated */}
        {!xenditConfigured && (
          <div className="mt-5 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2 text-xs text-amber-200/90">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-300">Developer Note: </span> 
              Xendit API key is not configured in environment secrets. The application is running in fully interactive <strong className="text-amber-300 font-bold">Simulated Mode</strong>. Add <code className="bg-slate-950 px-1 py-0.5 rounded font-mono text-amber-200">XENDIT_SECRET_KEY</code> to connect your live dashboard.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
