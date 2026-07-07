import { useState, useEffect } from "react";
import { DollarSign, Wallet, ShieldCheck, RefreshCw, Layers, TrendingUp, Sparkles, Plus, Globe, Menu, X, Building } from "lucide-react";
import { Transaction, XenditBalance, XenditTransaction } from "./types";
import { DashboardStats } from "./components/DashboardStats";
import { TransactionForm } from "./components/TransactionForm";
import { TransactionList } from "./components/TransactionList";
import { AnalyticsCharts } from "./components/AnalyticsCharts";
import { XenditSync } from "./components/XenditSync";
import { VendorManager } from "./components/VendorManager";
import { BudgetTracker } from "./components/BudgetTracker";

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: "txn_m01",
    type: "incoming",
    amount: 15000000,
    category: "Salary",
    date: "2026-07-01",
    description: "Monthly Software Engineer Salary",
    paymentMethod: "Bank Transfer",
    tags: ["job", "fixed", "primary"]
  },
  {
    id: "txn_m02",
    type: "outgoing",
    amount: 4500000,
    category: "Rent",
    date: "2026-07-02",
    description: "Co-living Apartment Rent Payment",
    paymentMethod: "Bank Transfer",
    tags: ["housing", "fixed", "essential"]
  },
  {
    id: "txn_m03",
    type: "outgoing",
    amount: 350000,
    category: "Utilities",
    date: "2026-07-03",
    description: "High-speed Fiber Internet & Electricity Bills",
    paymentMethod: "Credit Card",
    tags: ["bills", "recurring"]
  },
  {
    id: "txn_m04",
    type: "incoming",
    amount: 2500000,
    category: "Freelance",
    date: "2026-07-04",
    description: "Landing Page Design Payout - Client X",
    paymentMethod: "E-Wallet",
    tags: ["side-hustle", "design"]
  },
  {
    id: "txn_m05",
    type: "outgoing",
    amount: 180000,
    category: "Food",
    date: "2026-07-05",
    description: "Gourmet Dinner with friends",
    paymentMethod: "Cash",
    tags: ["leisure", "social"]
  },
  {
    id: "txn_m06",
    type: "outgoing",
    amount: 240000,
    category: "Shopping",
    date: "2026-07-06",
    description: "Ergonomic keyboard wrist-rest",
    paymentMethod: "E-Wallet",
    tags: ["office", "gear"]
  }
];

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [xenditTransactions, setXenditTransactions] = useState<XenditTransaction[]>([]);
  const [xenditBalance, setXenditBalance] = useState<XenditBalance | null>(null);
  const [xenditConfigured, setXenditConfigured] = useState(false);
  const [isLoadingXendit, setIsLoadingXendit] = useState(false);
  const [activeTab, setActiveTab] = useState<"ledger" | "xendit" | "cashier" | "vendor">("ledger");
  const [isCashierAddModalOpen, setIsCashierAddModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Load transactions from localStorage or default on mount
  useEffect(() => {
    const saved = localStorage.getItem("manual_ledger_records");
    if (saved) {
      try {
        setTransactions(JSON.parse(saved));
      } catch (e) {
        setTransactions(DEFAULT_TRANSACTIONS);
      }
    } else {
      setTransactions(DEFAULT_TRANSACTIONS);
      localStorage.setItem("manual_ledger_records", JSON.stringify(DEFAULT_TRANSACTIONS));
    }

    // Fetch Xendit API status, balance and transactions
    checkXenditStatus();
    refreshXenditBalance();
    fetchXenditTransactions();
  }, []);

  // Save manual transactions whenever they change
  const saveTransactions = (updated: Transaction[]) => {
    setTransactions(updated);
    localStorage.setItem("manual_ledger_records", JSON.stringify(updated));
  };

  const checkXenditStatus = async () => {
    try {
      const res = await fetch("/api/xendit/status");
      if (res.ok) {
        const data = await res.json();
        setXenditConfigured(data.configured);
      }
    } catch (e) {
      console.error("Failed to fetch Xendit Status:", e);
    }
  };

  const fetchXenditTransactions = async () => {
    try {
      const res = await fetch("/api/xendit/transactions");
      if (res.ok) {
        const data = await res.json();
        setXenditTransactions(data.data || []);
      }
    } catch (e) {
      console.error("Failed to fetch Xendit transactions:", e);
    }
  };

  const refreshXenditBalance = async () => {
    setIsLoadingXendit(true);
    try {
      const res = await fetch("/api/xendit/balance");
      if (res.ok) {
        const data: XenditBalance = await res.json();
        setXenditBalance(data);
      }
      // Also fetch transactions to sync the whole dashboard state!
      await fetchXenditTransactions();
    } catch (e) {
      console.error("Failed to fetch Xendit Balance:", e);
    } finally {
      setIsLoadingXendit(false);
    }
  };

  const handleAddTransaction = (newTxn: Omit<Transaction, "id"> & { id?: string }) => {
    const transaction: Transaction = {
      ...newTxn,
      id: newTxn.id || `manual_${Math.random().toString(36).substring(2, 9)}`
    };
    saveTransactions([transaction, ...transactions]);
  };

  const handleDeleteTransaction = (id: string) => {
    const filtered = transactions.filter((t) => t.id !== id);
    saveTransactions(filtered);
  };

  const handleImportTransactions = (imported: Transaction[]) => {
    saveTransactions(imported);
  };

  // Map Xendit transactions to match the Transaction interface format
  const mappedXenditTransactions: Transaction[] = xenditTransactions.map((xt) => ({
    id: xt.id,
    type: xt.type === "OUTWARD_REMITTANCE" ? "outgoing" : "incoming",
    amount: xt.amount,
    category: xt.type === "OUTWARD_REMITTANCE" ? "Other_Expense" : "Sales",
    date: xt.created.substring(0, 10), // "YYYY-MM-DD"
    description: xt.description,
    paymentMethod: xt.channel_code,
    tags: ["Xendit", xt.channel_category],
    note: `Xendit Reference: ${xt.reference}`,
    timestamp: xt.created,
  }));

  // Combined transactions history displayed on the main dashboard
  const combinedTransactions = [...transactions, ...mappedXenditTransactions];

  // Last 30 Days filter helper
  const isWithinLastMonth = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffTime = now.getTime() - d.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);
    return diffDays <= 30 && diffDays >= -1;
  };

  // 1. Total Xendit incoming payments in the last 1 month
  const xendit1Month = xenditTransactions
    .filter((xt) => xt.type === "PAYMENT" && xt.status === "SUCCESS" && isWithinLastMonth(xt.created))
    .reduce((sum, xt) => sum + xt.amount, 0);

  // 2. Total Cash/Manual incoming payments in the last 1 month
  const cash1Month = transactions
    .filter((t) => t.type === "incoming" && isWithinLastMonth(t.date))
    .reduce((sum, t) => sum + t.amount, 0);

  // 3. Running/Cumulative total for Outgoing Money (All manual outgoing + Xendit outward remittances)
  const manualOutgoingTotal = transactions
    .filter((t) => t.type === "outgoing")
    .reduce((sum, t) => sum + t.amount, 0);

  const xenditOutgoingTotal = xenditTransactions
    .filter((xt) => xt.type === "OUTWARD_REMITTANCE" && xt.status === "SUCCESS")
    .reduce((sum, xt) => sum + xt.amount, 0);

  const runningMoneyOut = manualOutgoingTotal + xenditOutgoingTotal;

  // Aggregated totals for manual ledger
  const totalIncome = transactions
    .filter((t) => t.type === "incoming")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "outgoing")
    .reduce((sum, t) => sum + t.amount, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans overflow-hidden relative">
      {/* Sidebar Backdrop overlay on Mobile/Tablet */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/65 lg:hidden backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar Navigation - High Density Styled */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 text-slate-300 flex flex-col justify-between border-r border-slate-800 shrink-0 select-none transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div>
          {/* Logo Brand Frame */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-900 bg-slate-950">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-md flex items-center justify-center shrink-0">
                <Wallet className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-sm font-black text-white tracking-tight flex items-center gap-1">
                  FinFlow Pro
                </h1>
                <span className="text-[9px] text-slate-500 font-extrabold tracking-wider uppercase block">
                  Ledger & Sync Engine
                </span>
              </div>
            </div>
            {/* Close sidebar button for mobile/tab */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-md hover:bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close Menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation link list */}
          <div className="px-3 py-4 space-y-1">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-3 mb-2">
              Financial Hub
            </div>
            <button
              onClick={() => { setActiveTab("ledger"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                activeTab === "ledger"
                  ? "bg-slate-900 text-white shadow-inner border-l-2 border-indigo-500"
                  : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-200"
              }`}
            >
              <Layers className="h-4 w-4 text-indigo-400" />
              <span>Personal Ledger</span>
            </button>

            <button
              onClick={() => { setActiveTab("cashier"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                activeTab === "cashier"
                  ? "bg-slate-900 text-white shadow-inner border-l-2 border-amber-500"
                  : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-200"
              }`}
            >
              <DollarSign className="h-4 w-4 text-amber-400" />
              <span>Cashier Desk Menu</span>
            </button>

            <button
              onClick={() => { setActiveTab("xendit"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                activeTab === "xendit"
                  ? "bg-slate-900 text-white shadow-inner border-l-2 border-indigo-500"
                  : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-200"
              }`}
            >
              <Globe className="h-4 w-4 text-emerald-400" />
              <span>Xendit Online Channel</span>
            </button>

            <button
              onClick={() => { setActiveTab("vendor"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                activeTab === "vendor"
                  ? "bg-slate-900 text-white shadow-inner border-l-2 border-indigo-500"
                  : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-200"
              }`}
            >
              <Building className="h-4 w-4 text-indigo-400" />
              <span>Vendor Payments</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer details */}
        <div className="p-4 border-t border-slate-900 bg-slate-950/80 space-y-3">
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-8 h-8 rounded-full bg-slate-850 border border-slate-700 flex items-center justify-center text-xs font-extrabold text-white uppercase">
              JD
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-slate-200 truncate">Demo Account</div>
              <div className="text-[10px] text-slate-500 font-mono truncate">Fintech Workspace</div>
            </div>
          </div>
          
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5 leading-relaxed">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>Secure offline-first persistence. API keys proxied.</span>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace Panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50">
        
        {/* Dynamic App Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 sticky top-0 z-40">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger menu button for mobile/tab */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest truncate">
              {activeTab === "ledger" 
                ? "Personal Cash Flow Ledger" 
                : activeTab === "cashier" 
                ? "Cashier Desk Terminal" 
                : activeTab === "vendor"
                ? "Vendor Payment Directory"
                : "Xendit Payment Integrations"}
            </h2>
            <span className="hidden sm:inline-block h-4 w-[1px] bg-slate-200 shrink-0"></span>
            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Sync Mode: Normal</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Connection status badge */}
            {xenditConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>XENDIT ACTIVE</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>SIMULATED DATA</span>
              </span>
            )}

            <div className="hidden sm:block text-[10px] sm:text-[11px] text-slate-400 font-extrabold font-mono uppercase">
              {new Date().toLocaleDateString("en-US", { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Workspace Scroll Area */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 flex flex-col gap-6 max-w-7xl w-full mx-auto">
          
          {/* Dynamic Interactive Stats Cards */}
          {activeTab !== "cashier" && (
            <DashboardStats
              xendit1Month={xendit1Month}
              cash1Month={cash1Month}
              runningMoneyOut={runningMoneyOut}
              xenditBalance={xenditBalance}
              isLoadingXendit={isLoadingXendit}
              onRefreshXendit={refreshXenditBalance}
              xenditConfigured={xenditConfigured}
              manualIncome={totalIncome}
              manualExpense={totalExpense}
            />
          )}

          {/* Active Router Tab */}
          {activeTab === "ledger" ? (
            <div className="space-y-6">
              {/* Monthly Budget Progress Tracker */}
              <BudgetTracker transactions={combinedTransactions} />

              {/* Analytics Trends Dashboard */}
              <AnalyticsCharts transactions={combinedTransactions} />

              {/* Transactions search and list history table (Full Width) */}
              <div className="w-full">
                <TransactionList
                  transactions={combinedTransactions}
                  onDeleteTransaction={handleDeleteTransaction}
                  onImportTransactions={handleImportTransactions}
                />
              </div>
            </div>
          ) : activeTab === "cashier" ? (
            <div className="space-y-6">
              {/* Cashier Desk KPI Cards - ONLY shows incoming and outgoing money */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Incoming Money */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between h-32">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Incoming Money</p>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight mt-1">
                      {formatCurrency(totalIncome)}
                    </h2>
                  </div>
                  <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <span>+ Increases cash register drawer</span>
                  </div>
                </div>

                {/* Outgoing Money */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between h-32">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Outgoing Money</p>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight mt-1">
                      {formatCurrency(totalExpense)}
                    </h2>
                  </div>
                  <div className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                    <span>- Decreases cash register drawer</span>
                  </div>
                </div>

                {/* Cash Register Net drawer total */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between h-32 text-white">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Register Drawer Net Balance</p>
                    </div>
                    <h2 className="text-2xl font-black text-slate-100 tracking-tight mt-1">
                      {formatCurrency(totalIncome - totalExpense)}
                    </h2>
                  </div>
                  <div className="text-[11px] font-bold text-indigo-300 flex items-center gap-1">
                    <span>Current physical cashier cash in drawer</span>
                  </div>
                </div>
              </div>

              {/* Cashier Action Controls / Session info toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl px-5 py-4 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0"></div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Active Terminal Register Drawer</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Session: Secure Offline Ledger Mode</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCashierAddModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-black text-xs uppercase tracking-widest rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Record Transaction Entry</span>
                </button>
              </div>

              {/* Transactions search and list history table (Full Width) */}
              <div className="w-full">
                <TransactionList
                  transactions={transactions}
                  onDeleteTransaction={handleDeleteTransaction}
                  onImportTransactions={handleImportTransactions}
                />
              </div>
            </div>
          ) : activeTab === "vendor" ? (
            <VendorManager 
              transactions={combinedTransactions}
              onAddTransaction={handleAddTransaction}
            />
          ) : (
            /* Xendit Online Sync and Search Dashboard */
            <XenditSync
              xenditBalance={xenditBalance}
              isLoadingBalance={isLoadingXendit}
              onRefreshBalance={refreshXenditBalance}
              xenditConfigured={xenditConfigured}
            />
          )}

          {/* Footer copyright */}
          <footer className="mt-12 pt-4 border-t border-slate-200/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span>© 2026 FinFlow Pro. Offline-first localStorage persistent.</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Secure server proxy engine active
            </span>
          </footer>
        </main>
      </div>
      {/* Add Transaction Modal Popup */}
      {isCashierAddModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsCashierAddModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-lg overflow-y-auto max-h-[90vh] rounded-xl shadow-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <TransactionForm 
              onAddTransaction={handleAddTransaction} 
              onCancel={() => setIsCashierAddModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
