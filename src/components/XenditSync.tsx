import React, { useState, useEffect } from "react";
import { Search, RefreshCw, AlertTriangle, CheckCircle2, XCircle, Clock, ArrowUpRight, Shield, Globe, Info, CreditCard, Layers, PlusCircle, Check } from "lucide-react";
import { XenditTransaction, XenditBalance } from "../types";

interface XenditSyncProps {
  xenditBalance: XenditBalance | null;
  isLoadingBalance: boolean;
  onRefreshBalance: () => void;
  xenditConfigured: boolean;
}

export const XenditSync: React.FC<XenditSyncProps> = ({
  xenditBalance,
  isLoadingBalance,
  onRefreshBalance,
  xenditConfigured
}) => {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "PAYMENT" | "OUTWARD_REMITTANCE">("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "SUCCESS" | "PENDING" | "FAILED">("ALL");
  const [transactions, setTransactions] = useState<XenditTransaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<XenditTransaction | null>(null);

  // Simulation Form State
  const [showSimulator, setShowSimulator] = useState(false);
  const [simAmount, setSimAmount] = useState("");
  const [simDesc, setSimDesc] = useState("");
  const [simChannel, setSimChannel] = useState("QRIS");
  const [simCategory, setSimCategory] = useState("QR_CODE");
  const [simSuccess, setSimSuccess] = useState(false);

  // Fetch transactions from Express backend
  const fetchTransactions = async () => {
    setIsLoadingTransactions(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filterType !== "ALL") params.append("type", filterType);
      if (filterStatus !== "ALL") params.append("status", filterStatus);

      const res = await fetch(`/api/xendit/transactions?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        setTransactions(result.data || []);
      }
    } catch (err) {
      console.error("Failed to load Xendit transactions:", err);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterType, filterStatus]);

  // Helper to format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  // Channel categories options
  const channelOptions = [
    { code: "QRIS", category: "QR_CODE", label: "QRIS Dynamic QR" },
    { code: "GOPAY", category: "EWALLET", label: "GoPay Wallet" },
    { code: "OVO", category: "EWALLET", label: "OVO Wallet" },
    { code: "SHOPEEPAY", category: "EWALLET", label: "ShopeePay" },
    { code: "BCA", category: "BANK", label: "BCA Virtual Account" },
    { code: "MANDIRI", category: "BANK", label: "Mandiri Virtual Account" },
    { code: "BNI", category: "BANK", label: "BNI Virtual Account" }
  ];

  // Handle simulation submit
  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(simAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    try {
      const res = await fetch("/api/xendit/simulate-incoming", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          description: simDesc || "Simulated dynamic online checkout payment",
          channel_code: simChannel,
          channel_category: simCategory
        })
      });

      if (res.ok) {
        setSimSuccess(true);
        setSimAmount("");
        setSimDesc("");
        // Refresh balance and transactions immediately
        onRefreshBalance();
        await fetchTransactions();
        
        setTimeout(() => {
          setSimSuccess(false);
          setShowSimulator(false);
        }, 1500);
      }
    } catch (err) {
      console.error("Simulation request failed:", err);
    }
  };

  // Format Date cleanly
  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle2 className="h-3.5 w-3.5" /> SUCCESS
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
            <Clock className="h-3.5 w-3.5 animate-pulse" /> PENDING
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
            <XCircle className="h-3.5 w-3.5" /> FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-700 border border-slate-100">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <span className="p-1.5 rounded bg-indigo-600 text-white">
              <Globe className="h-3.5 w-3.5" />
            </span>
            Xendit Online Incoming Money Dashboard
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            Search, filter, and simulate incoming transactions from online digital channels.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Simulation Toggle */}
          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-all shadow-sm cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5" /> 
            {showSimulator ? "Hide Simulation Tools" : "Simulate Incoming Payment"}
          </button>

          <button
            onClick={fetchTransactions}
            disabled={isLoadingTransactions}
            className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh search list"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingTransactions ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Simulator Sandbox Form */}
      {showSimulator && (
        <div className="mb-5 p-4 bg-slate-50 border border-slate-200 rounded-lg shadow-inner-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
              Xendit Channel Simulation Sandbox
            </h4>
          </div>

          {simSuccess ? (
            <div className="p-4 text-center text-emerald-600 flex flex-col items-center justify-center gap-1.5">
              <div className="p-2 rounded-full bg-emerald-100 text-emerald-600">
                <Check className="h-6 w-6" />
              </div>
              <p className="text-xs font-bold">Simulation Successful!</p>
              <p className="text-[10px] text-slate-400 font-medium">Incoming online payment recorded. Xendit balance updated.</p>
            </div>
          ) : (
            <form onSubmit={handleSimulate} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">
                  Simulate Amount
                </label>
                <div className="relative rounded shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-slate-400 text-[10px] font-bold">
                    Rp
                  </div>
                  <input
                    type="number"
                    required
                    value={simAmount}
                    onChange={(e) => setSimAmount(e.target.value)}
                    placeholder="250000"
                    className="block w-full rounded border border-slate-200 py-1.5 pl-6 pr-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">
                  Payment Method Channel
                </label>
                <select
                  value={simChannel}
                  onChange={(e) => {
                    const match = channelOptions.find(o => o.code === e.target.value);
                    if (match) {
                      setSimChannel(match.code);
                      setSimCategory(match.category);
                    }
                  }}
                  className="block w-full rounded border border-slate-200 py-1.5 px-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                >
                  {channelOptions.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">
                  Simulation Description
                </label>
                <input
                  type="text"
                  value={simDesc}
                  onChange={(e) => setSimDesc(e.target.value)}
                  placeholder="Invoice #99 checkout"
                  className="block w-full rounded border border-slate-200 py-1.5 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center py-1.5 px-3 rounded text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Fire Sandbox Payment
              </button>
            </form>
          )}
        </div>
      )}

      {/* Online Search Controls */}
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col md:flex-row items-center gap-2 mb-4">
        <div className="relative w-full md:flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
            <Search className="h-3.5 w-3.5" />
          </span>
          <input
            type="text"
            placeholder="Search incoming payments by reference, description, channel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-lg border border-slate-200 py-1.5 pl-8 pr-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          {/* Filter Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="block rounded-lg border border-slate-200 py-1.5 px-2 text-xs bg-white focus:outline-none w-full md:w-36 font-semibold text-slate-600"
          >
            <option value="ALL">All Flows</option>
            <option value="PAYMENT">Incoming (IN)</option>
            <option value="OUTWARD_REMITTANCE">Outgoing (OUT)</option>
          </select>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="block rounded-lg border border-slate-200 py-1.5 px-2 text-xs bg-white focus:outline-none w-full md:w-32 font-semibold text-slate-600"
          >
            <option value="ALL">All Status</option>
            <option value="SUCCESS">Success Only</option>
            <option value="PENDING">Pending Only</option>
            <option value="FAILED">Failed Only</option>
          </select>
        </div>
      </div>

      {/* Core Interactive Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Transactions List */}
        <div className="lg:col-span-2 space-y-2">
          {isLoadingTransactions ? (
            <div className="p-8 text-center bg-white rounded-lg border border-slate-200 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
              <span className="text-[11px] text-slate-400 font-bold">Searching online database...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-lg border border-slate-200">
              <Info className="h-5 w-5 text-slate-400 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-600">No Online Payments Found</p>
              <p className="text-[10px] text-slate-400 mt-1">
                No records match current parameters. Use the Simulator to fire test payments!
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="divide-y divide-slate-100">
                {transactions.map((txn) => {
                  const isIncoming = txn.type === "PAYMENT";
                  return (
                    <div
                      key={txn.id}
                      onClick={() => setSelectedTxn(txn)}
                      className={`p-3 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-all cursor-pointer ${
                        selectedTxn?.id === txn.id ? "bg-indigo-50/30 border-l-4 border-indigo-600 pl-2.5" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div 
                          className={`p-2 rounded text-center shrink-0 min-w-[50px] ${
                            isIncoming ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          <div className="text-[8px] font-black uppercase tracking-wider">
                            {isIncoming ? "IN" : "OUT"}
                          </div>
                          <div className="text-[9px] font-bold mt-0.5 font-mono">
                            {txn.channel_code}
                          </div>
                        </div>

                        <div className="truncate">
                          <h4 className="text-xs font-bold text-slate-800 truncate leading-snug">
                            {txn.description}
                          </h4>
                          <p className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1.5 truncate font-semibold font-mono">
                            <span>ID: {txn.id}</span>
                            <span>•</span>
                            <span>Ref: {txn.reference}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className={`text-xs font-extrabold font-mono ${isIncoming ? "text-emerald-600" : "text-rose-600"}`}>
                          {isIncoming ? "+" : "-"} {formatCurrency(txn.amount)}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5 font-semibold font-mono">
                          {formatDateTime(txn.created)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Selected Transaction Details / Connection Status */}
        <div className="hidden lg:block">
          {selectedTxn ? (
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm sticky top-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                  Payment Particulars
                </span>
                <button
                  onClick={() => setSelectedTxn(null)}
                  className="text-[10px] font-black text-slate-400 hover:text-slate-600 cursor-pointer uppercase tracking-wider"
                >
                  Clear
                </button>
              </div>

              <div className="space-y-3">
                {/* Amount and Status Header */}
                <div className="text-center py-2 bg-slate-50 rounded">
                  <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Transaction Amount</div>
                  <div className="text-base font-black text-slate-800 font-sans mt-0.5">
                    {formatCurrency(selectedTxn.amount)}
                  </div>
                  <div className="mt-1 flex justify-center">{getStatusBadge(selectedTxn.status)}</div>
                </div>

                <div className="space-y-1.5 text-[11px] font-medium">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Online Channel</span>
                    <span className="font-bold text-slate-700 font-mono text-[10px]">{selectedTxn.channel_code} ({selectedTxn.channel_category})</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Flow Type</span>
                    <span className="font-bold text-slate-700 font-mono text-[10px]">{selectedTxn.type}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Reference ID</span>
                    <span className="font-bold text-slate-700 font-mono text-[9px] select-all bg-slate-50 px-1 rounded">{selectedTxn.reference}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Created At</span>
                    <span className="font-bold text-slate-700 font-mono text-[9px]">{formatDateTime(selectedTxn.created)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Updated At</span>
                    <span className="font-bold text-slate-700 font-mono text-[9px]">{formatDateTime(selectedTxn.updated)}</span>
                  </div>
                  <div className="py-1">
                    <span className="text-slate-400 block mb-0.5">Xendit Product Description</span>
                    <div className="p-2 bg-slate-50 text-slate-700 font-semibold rounded text-[10px] leading-relaxed">
                      {selectedTxn.description}
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <div className="p-2 bg-indigo-50 text-[9px] text-indigo-700 rounded flex items-start gap-1 leading-relaxed font-bold uppercase tracking-wide">
                    <Shield className="h-3 w-3 shrink-0 mt-0.5 text-indigo-600" />
                    <span>
                      Sync Active • Verified by Xendit PG Secure Callbacks
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-5 rounded-lg border border-slate-200 text-center space-y-3 sticky top-4">
              <div className="mx-auto w-10 h-10 rounded bg-slate-50 flex items-center justify-center text-slate-400">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                  Payment Inspect Panel
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal font-medium">
                  Click on any transaction in the search results to inspect technical details, payment channels, and reference metadata.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 text-left">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Layers className="h-3 w-3 text-indigo-500" />
                  <span className="text-[9px] font-black text-slate-700 uppercase tracking-wider">Gateway Proxy</span>
                </div>
                <p className="text-[9px] text-slate-400 leading-normal font-medium">
                  Our payment gateway controller proxies requests securely on the backend server to ensure your Xendit authorization keys remain completely hidden from browser inspectors.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Transaction Details Drawer/Modal (Mobile/Tablet Only) */}
      {selectedTxn && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-xs lg:hidden animate-fade-in"
          onClick={() => setSelectedTxn(null)}
        >
          <div 
            className="relative w-full max-w-sm rounded-xl shadow-2xl bg-white p-5 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                Payment Particulars
              </span>
              <button
                onClick={() => setSelectedTxn(null)}
                className="text-[10px] font-black text-slate-400 hover:text-slate-600 cursor-pointer uppercase tracking-wider"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              {/* Amount and Status Header */}
              <div className="text-center py-2 bg-slate-50 rounded">
                <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Transaction Amount</div>
                <div className="text-base font-black text-slate-800 font-sans mt-0.5">
                  {formatCurrency(selectedTxn.amount)}
                </div>
                <div className="mt-1 flex justify-center">{getStatusBadge(selectedTxn.status)}</div>
              </div>

              <div className="space-y-1.5 text-[11px] font-medium">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Online Channel</span>
                  <span className="font-bold text-slate-700 font-mono text-[10px]">{selectedTxn.channel_code} ({selectedTxn.channel_category})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Flow Type</span>
                  <span className="font-bold text-slate-700 font-mono text-[10px]">{selectedTxn.type}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Reference ID</span>
                  <span className="font-bold text-slate-700 font-mono text-[9px] select-all bg-slate-50 px-1 rounded truncate max-w-[180px]">{selectedTxn.reference}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Created At</span>
                  <span className="font-bold text-slate-700 font-mono text-[9px]">{formatDateTime(selectedTxn.created)}</span>
                </div>
                <div className="py-1">
                  <span className="text-slate-400 block mb-0.5">Xendit Product Description</span>
                  <div className="p-2 bg-slate-50 text-slate-700 font-semibold rounded text-[10px] leading-relaxed">
                    {selectedTxn.description}
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <button
                  onClick={() => setSelectedTxn(null)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black uppercase tracking-wider text-center transition-all cursor-pointer"
                >
                  Dismiss Inspector
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
