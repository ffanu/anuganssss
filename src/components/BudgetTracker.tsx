import React, { useState, useEffect } from "react";
import { DollarSign, Wallet, ShieldCheck, RefreshCw, AlertCircle, Sparkles, CheckCircle2, AlertTriangle, Edit3, Save, X, PlusCircle, ArrowUpRight, TrendingUp } from "lucide-react";
import { Transaction } from "../types";

interface BudgetTrackerProps {
  transactions: Transaction[];
}

const DEFAULT_BUDGET = 25000000; // Rp 25,000,000 by default

export const BudgetTracker: React.FC<BudgetTrackerProps> = ({ transactions }) => {
  const [budgetLimit, setBudgetLimit] = useState<number>(DEFAULT_BUDGET);
  const [isEditing, setIsEditing] = useState(false);
  const [tempBudget, setTempBudget] = useState<string>("");

  // Load budget limit from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("finflow_budget_limit");
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > 0) {
        setBudgetLimit(parsed);
      }
    }
  }, []);

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  // Filter outgoing transactions for current calendar month
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentMonthName = now.toLocaleString("en-US", { month: "long", year: "numeric" });

  const currentMonthOutgoingTxns = transactions.filter((t) => {
    if (t.type !== "outgoing") return false;
    const tDate = new Date(t.date);
    return tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth;
  });

  // Calculate total spent
  const totalSpent = currentMonthOutgoingTxns.reduce((sum, t) => sum + t.amount, 0);

  // Split manual vs Xendit outgoing
  const manualSpent = currentMonthOutgoingTxns
    .filter((t) => !t.tags?.includes("Xendit"))
    .reduce((sum, t) => sum + t.amount, 0);

  const xenditSpent = currentMonthOutgoingTxns
    .filter((t) => t.tags?.includes("Xendit"))
    .reduce((sum, t) => sum + t.amount, 0);

  const budgetProgress = budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0;
  const remainingBudget = budgetLimit - totalSpent;

  // Handle saving budget
  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(tempBudget.replace(/[^0-9]/g, ""));
    if (isNaN(parsed) || parsed <= 0) {
      alert("Please enter a valid positive budget amount.");
      return;
    }
    setBudgetLimit(parsed);
    localStorage.setItem("finflow_budget_limit", parsed.toString());
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setTempBudget(budgetLimit.toString());
    setIsEditing(true);
  };

  // Quick preset buttons
  const applyPreset = (amount: number) => {
    setBudgetLimit(amount);
    localStorage.setItem("finflow_budget_limit", amount.toString());
    setIsEditing(false);
  };

  // Status-based styles and text
  let progressColor = "bg-emerald-500";
  let statusText = "Well under control! Keep up the good work.";
  let statusIcon = <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
  let cardBg = "bg-white border-slate-200";

  if (budgetProgress >= 100) {
    progressColor = "bg-rose-500 animate-pulse";
    statusText = "Budget Exceeded! Consider trimming non-essential costs.";
    statusIcon = <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />;
    cardBg = "bg-rose-50/20 border-rose-200";
  } else if (budgetProgress >= 85) {
    progressColor = "bg-amber-500";
    statusText = "Approaching budget ceiling. Manage remaining outlays closely.";
    statusIcon = <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />;
    cardBg = "bg-amber-50/10 border-amber-200";
  } else if (budgetProgress >= 50) {
    progressColor = "bg-indigo-500";
    statusText = "More than half of the budget spent. On track for current projections.";
    statusIcon = <Sparkles className="h-4 w-4 text-indigo-500 shrink-0" />;
  }

  return (
    <div className={`rounded-xl border shadow-sm p-6 transition-all duration-300 ${cardBg}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            Monthly Budget Cap
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            Active cycle: {currentMonthName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <form onSubmit={handleSaveBudget} className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-[10px] font-bold text-slate-400">Rp</span>
                <input
                  type="text"
                  required
                  placeholder="25,000,000"
                  value={tempBudget}
                  onChange={(e) => setTempBudget(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-32 pl-7 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer"
                title="Save limit"
              >
                <Save className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors cursor-pointer"
                title="Cancel"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <span className="text-[8px] text-slate-400 font-black uppercase block leading-none">Budget Cap</span>
                <span className="text-sm font-black text-slate-800 font-sans block mt-0.5">{formatCurrency(budgetLimit)}</span>
              </div>
              <button
                onClick={handleStartEdit}
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                title="Edit budget limit"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar & Indicators */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-2xl font-black text-slate-800">{formatCurrency(totalSpent)}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase ml-1.5">spent this month</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-slate-800">{budgetProgress.toFixed(1)}%</span>
            </div>
          </div>

          {/* Progress Bar Container */}
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-100">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${Math.min(budgetProgress, 100)}%` }}
            />
          </div>
        </div>

        {/* Info Cards / Budget Splits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/75 flex flex-col justify-between">
            <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider block">Remaining Balance</span>
            <div className="mt-1 flex items-center justify-between">
              <span className={`text-xs font-extrabold ${remainingBudget < 0 ? "text-rose-600" : "text-slate-800"}`}>
                {remainingBudget < 0 ? `-${formatCurrency(Math.abs(remainingBudget))}` : formatCurrency(remainingBudget)}
              </span>
              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                remainingBudget < 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50/80 text-emerald-600"
              }`}>
                {remainingBudget < 0 ? "Exceeded" : "Left"}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/75 flex flex-col justify-between">
            <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider block">Manual Cash Out</span>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-700">{formatCurrency(manualSpent)}</span>
              <span className="text-[8px] font-mono text-slate-400 font-bold">
                {currentMonthOutgoingTxns.filter(t => !t.tags?.includes("Xendit")).length} Txns
              </span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/75 flex flex-col justify-between">
            <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider block">Xendit Online Out</span>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs font-extrabold text-indigo-600">{formatCurrency(xenditSpent)}</span>
              <span className="text-[8px] font-mono text-indigo-400 font-bold">
                {currentMonthOutgoingTxns.filter(t => t.tags?.includes("Xendit")).length} Txns
              </span>
            </div>
          </div>

        </div>

        {/* Status Prompt / Helper */}
        <div className="flex items-center gap-2 bg-slate-50/50 rounded-lg p-2.5 border border-slate-100 text-[10px] font-semibold text-slate-500">
          {statusIcon}
          <span>{statusText}</span>
        </div>

        {/* Quick Settings Drawer Preset Trigger */}
        {isEditing && (
          <div className="pt-2 border-t border-slate-100/70">
            <p className="text-[8px] text-slate-400 font-black uppercase tracking-wider mb-2">Quick presets:</p>
            <div className="flex flex-wrap gap-2">
              {[10000000, 25000000, 50000000, 100000000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold rounded text-[9px] uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {formatCurrency(preset).replace(",00", "")}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
