import React, { useState } from "react";
import { Search, Trash2, SlidersHorizontal, ArrowUpRight, ArrowDownLeft, Calendar, Tag, CreditCard, Download, Upload, AlertCircle, X, ChevronDown, ChevronUp, Clock, FileText, Image, Camera, Shield } from "lucide-react";
import { Transaction, MANUAL_CATEGORIES } from "../types";
import { generateVoucherBase64 } from "../utils/receiptGenerator";

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onImportTransactions: (imported: Transaction[]) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onDeleteTransaction,
  onImportTransactions
}) => {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "incoming" | "outgoing">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterTag, setFilterTag] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");
  const [importError, setImportError] = useState<string | null>(null);
  const [expandedTxnId, setExpandedTxnId] = useState<string | null>(null);
  const [selectedFullImage, setSelectedFullImage] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedTxnId(expandedTxnId === id ? null : id);
  };

  // Helper to get category configuration
  const getCategoryMeta = (type: "incoming" | "outgoing", categoryValue: string) => {
    const list = MANUAL_CATEGORIES[type];
    const item = list.find((c) => c.value === categoryValue);
    return item || { label: categoryValue, color: "#6B7280" };
  };

  // Get unique tags across all transactions
  const allTags = Array.from(
    new Set(
      transactions.flatMap((t) => t.tags || [])
    )
  ).sort();

  // Filter & Sort Transactions
  const filteredTransactions = transactions
    .filter((t) => {
      const matchesSearch =
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase()) ||
        t.paymentMethod.toLowerCase().includes(search.toLowerCase()) ||
        (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase())));

      const matchesType = filterType === "all" || t.type === filterType;

      const matchesCategory = filterCategory === "all" || t.category === filterCategory;

      const matchesTag = filterTag === "all" || (t.tags && t.tags.includes(filterTag));

      return matchesSearch && matchesType && matchesCategory && matchesTag;
    })
    .sort((a, b) => {
      if (sortBy === "date-desc") return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === "date-asc") return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === "amount-desc") return b.amount - a.amount;
      if (sortBy === "amount-asc") return a.amount - b.amount;
      return 0;
    });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  // Get active categories based on type filter for dropdown
  const getActiveCategoryOptions = () => {
    if (filterType === "incoming") return MANUAL_CATEGORIES.incoming;
    if (filterType === "outgoing") return MANUAL_CATEGORIES.outgoing;
    return [...MANUAL_CATEGORIES.incoming, ...MANUAL_CATEGORIES.outgoing];
  };

  // Export ledger to JSON file
  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(transactions, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `manual_ledger_backup_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  // Import ledger from JSON file
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            // Basic structure validation
            const isValid = parsed.every(t => 
              t.id && 
              (t.type === 'incoming' || t.type === 'outgoing') && 
              typeof t.amount === 'number' && 
              t.category && 
              t.date && 
              t.description &&
              (!t.tags || Array.isArray(t.tags))
            );
            if (isValid) {
              onImportTransactions(parsed);
              e.target.value = ""; // Reset
            } else {
              setImportError("Invalid backup file format. Essential transaction fields are missing.");
            }
          } else {
            setImportError("Backup file must contain a list of records.");
          }
        } catch (err) {
          setImportError("Failed to parse JSON file. Ensure it is a valid exported ledger file.");
        }
      };
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <span className="p-1.5 rounded bg-indigo-50 text-indigo-600">
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </span>
          Ledger History & Search
        </h3>
        
        {/* Backup actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={transactions.length === 0}
            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Download ledger backup file"
          >
            <Download className="h-3 w-3" /> Export JSON
          </button>
          
          <label className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 transition-colors cursor-pointer">
            <Upload className="h-3 w-3" /> Import Backup
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImport} 
              className="hidden" 
            />
          </label>
        </div>
      </div>

      {importError && (
        <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-[11px] flex items-center gap-2 font-medium">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{importError}</span>
        </div>
      )}

      {/* Interactive Controls & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 mb-4">
        {/* Search */}
        <div className="relative lg:col-span-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
            <Search className="h-3.5 w-3.5" />
          </span>
          <input
            type="text"
            placeholder="Search details/tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-lg border border-slate-200 py-1.5 pl-8 pr-7 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Filter by Type */}
        <div>
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value as any);
              setFilterCategory("all"); // reset category filter on type change
            }}
            className="block w-full rounded-lg border border-slate-200 py-1.5 px-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-slate-700"
          >
            <option value="all">All Types</option>
            <option value="incoming">Incoming Cash Flow</option>
            <option value="outgoing">Outgoing Cash Flow</option>
          </select>
        </div>

        {/* Filter by Category */}
        <div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="block w-full rounded-lg border border-slate-200 py-1.5 px-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-slate-700"
          >
            <option value="all">All Categories</option>
            {getActiveCategoryOptions().map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Tag */}
        <div>
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="block w-full rounded-lg border border-slate-200 py-1.5 px-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-slate-700"
          >
            <option value="all">All Tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                #{tag}
              </option>
            ))}
          </select>
        </div>

        {/* Sort controls */}
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="block w-full rounded-lg border border-slate-200 py-1.5 px-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-slate-700"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Amount: High to Low</option>
            <option value="amount-asc">Amount: Low to High</option>
          </select>
        </div>
      </div>

      {/* Records Table / List */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center bg-slate-50/40">
            <p className="text-xs font-bold text-slate-500">No matching ledger records</p>
            <p className="text-[10px] text-slate-400 mt-1 mb-3">Try relaxing filters or add new transaction entries.</p>
            {(search || filterType !== "all" || filterCategory !== "all" || filterTag !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilterType("all");
                  setFilterCategory("all");
                  setFilterTag("all");
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded shadow-sm cursor-pointer transition-colors"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Details</th>
                <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Category</th>
                <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Method</th>
                <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center hidden md:table-cell">Receipt Evidence</th>
                <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredTransactions.flatMap((t) => {
                const isIncoming = t.type === "incoming";
                const catMeta = getCategoryMeta(t.type, t.category);
                const isExpanded = expandedTxnId === t.id;
                const evidenceImage = t.photoEvidence || generateVoucherBase64(
                  t.amount,
                  t.description,
                  t.category,
                  t.type,
                  t.date,
                  t.paymentMethod,
                  t.id
                );

                return [
                  <tr 
                    key={t.id} 
                    onClick={() => toggleExpand(t.id)}
                    className={`transition-colors cursor-pointer select-none ${
                      isExpanded ? "bg-indigo-50/25 hover:bg-indigo-50/35" : "hover:bg-slate-50/50"
                    }`}
                  >
                    {/* Details Column */}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {/* Expand/Collapse Chevron Indicator */}
                        <div className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                        <div 
                          className={`p-1.5 rounded-lg shrink-0 ${
                            isIncoming ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                          }`}
                        >
                          {isIncoming ? (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDownLeft className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 leading-snug">{t.description}</div>
                          <div className="text-[9px] text-slate-400 flex flex-wrap items-center gap-1.5 mt-0.5 font-semibold">
                            <span className="font-mono flex items-center gap-1 shrink-0">
                              <Calendar className="h-2.5 w-2.5" /> {t.date}
                            </span>
                            {t.tags && t.tags.length > 0 && (
                              <>
                                <span className="text-slate-300 select-none">•</span>
                                <span className="flex flex-wrap gap-1">
                                  {t.tags.map((tag) => (
                                    <button 
                                      key={tag}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setFilterTag(tag);
                                      }}
                                      className={`px-1 py-0.5 rounded text-[8px] font-bold border transition-all cursor-pointer ${
                                        filterTag === tag 
                                          ? "bg-indigo-600 text-white border-indigo-600" 
                                          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
                                      }`}
                                    >
                                      #{tag}
                                    </button>
                                  ))}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category Column */}
                    <td className="px-3 py-2 whitespace-nowrap hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        <span 
                          className="w-2 h-2 rounded-full shrink-0" 
                          style={{ backgroundColor: catMeta.color }}
                        />
                        <span className="font-semibold text-slate-600">{catMeta.label}</span>
                      </div>
                    </td>

                    {/* Method Column */}
                    <td className="px-3 py-2 whitespace-nowrap hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200">
                        {t.paymentMethod}
                      </span>
                    </td>

                    {/* Evidence Column */}
                    <td className="px-3 py-2 whitespace-nowrap text-center hidden md:table-cell">
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFullImage(evidenceImage);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:text-indigo-800 transition-all cursor-pointer shadow-xs uppercase tracking-wider gap-1 select-none"
                        title="Click to view full receipt invoice"
                      >
                        <Camera className="h-3 w-3 text-indigo-600" />
                        <span>📸 VIEW PROOF</span>
                      </div>
                    </td>

                    {/* Amount Column */}
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <span 
                        className={`font-extrabold font-mono ${
                          isIncoming ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {isIncoming ? "+" : "-"} {formatCurrency(t.amount)}
                      </span>
                    </td>

                    {/* Action Column */}
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      {t.id.startsWith("txn_") || (t.tags && t.tags.includes("Xendit")) ? (
                        <div 
                          className="inline-flex p-1 text-indigo-500 rounded bg-indigo-50/50 cursor-help"
                          title="Online synced record is read-only"
                        >
                          <Shield className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTransaction(t.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                          title="Delete record entry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>,
                  // Expandable details block
                  isExpanded && (
                    <tr key={`${t.id}-expanded`} className="bg-slate-50/50">
                      <td colSpan={6} className="px-6 py-4 border-t border-b border-slate-200/60">
                        <div className="text-slate-800 text-xs space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            
                            {/* Left Panel: Note and Tags */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                <FileText className="h-3.5 w-3.5 text-slate-400" />
                                <span>Detailed Note</span>
                              </div>
                              <p className="text-xs bg-white border border-slate-200/50 rounded-lg p-3 text-slate-700 italic leading-relaxed min-h-[64px] whitespace-pre-wrap shadow-sm">
                                {t.note || "No detailed notes provided for this transaction entry."}
                              </p>
                            </div>

                            {/* Middle Panel: Transaction Metadata */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                <span>Transaction Metadata</span>
                              </div>
                              <div className="bg-white border border-slate-200/50 rounded-lg p-3 text-slate-600 space-y-2 text-[11px] shadow-sm">
                                <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                                  <span className="font-medium text-slate-400">Record ID:</span>
                                  <span className="font-mono font-bold text-slate-700 select-all">{t.id}</span>
                                </div>
                                <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                                  <span className="font-medium text-slate-400">Transaction Date:</span>
                                  <span className="font-bold text-slate-700">{t.date}</span>
                                </div>
                                <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                                  <span className="font-medium text-slate-400">Logged Timestamp:</span>
                                  <span className="font-mono font-bold text-slate-700">
                                    {t.timestamp ? new Date(t.timestamp).toLocaleString() : "N/A (Historical)"}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                                  <span className="font-medium text-slate-400">Category & Type:</span>
                                  <span className="font-bold text-slate-700 capitalize">
                                    {getCategoryMeta(t.type, t.category).label} ({t.type})
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-slate-400">Payment Channel:</span>
                                  <span className="font-bold text-slate-700">{t.paymentMethod}</span>
                                </div>
                              </div>
                            </div>

                            {/* Right Panel: Receipt Photo Evidence */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                <Camera className="h-3.5 w-3.5 text-slate-400" />
                                <span>Receipt Photo Evidence</span>
                              </div>
                              <div className="bg-white border border-slate-200/50 rounded-lg p-2.5 shadow-sm flex flex-col items-center justify-center gap-2">
                                <div className="group relative w-full h-32 rounded-md overflow-hidden bg-slate-50 border border-slate-200/50 flex items-center justify-center">
                                  <img 
                                    src={evidenceImage} 
                                    alt="Transaction receipt evidence" 
                                    className="w-full h-full object-contain hover:scale-105 transition-all duration-300 cursor-zoom-in"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedFullImage(evidenceImage);
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200 pointer-events-none">
                                    <span className="text-[10px] text-white font-bold tracking-wider uppercase">Click to Expand</span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedFullImage(evidenceImage);
                                  }}
                                  className="w-full text-center py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded text-[10px] font-black tracking-wide transition-all cursor-pointer"
                                >
                                  VIEW RECEIPT INVOICE
                                </button>
                              </div>
                            </div>

                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                ];
              })}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Total records footer */}
      <div className="mt-3.5 flex items-center justify-between text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">
        <span>Showing {filteredTransactions.length} of {transactions.length} records</span>
        {transactions.length > 0 && (
          <span className="text-slate-400 font-semibold lowercase">persistent storage active</span>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedFullImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-xs"
          onClick={() => setSelectedFullImage(null)}
        >
          <div 
            className="relative bg-white rounded-xl shadow-2xl max-w-sm w-full p-4 overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-150">
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-indigo-600" /> Photo Receipt Evidence
              </span>
              <button 
                onClick={() => setSelectedFullImage(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="relative rounded bg-slate-50 border border-slate-100 overflow-y-auto max-h-[70vh] flex items-center justify-center p-1">
              <img 
                src={selectedFullImage} 
                alt="Receipt Full Preview" 
                className="max-w-full h-auto max-h-[60vh] object-contain rounded shadow-xs" 
              />
            </div>
            
            <div className="mt-3 text-center">
              <p className="text-[9px] text-slate-400 font-bold">
                Register transaction proof verified securely on {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
