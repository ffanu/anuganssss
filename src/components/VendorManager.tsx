import React, { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle, AlertCircle, Calendar, CreditCard, Building, Search, Sparkles, DollarSign, Clock, X, AlertTriangle, Check, ArrowRight } from "lucide-react";
import { Vendor, Transaction, MANUAL_CATEGORIES } from "../types";

interface VendorManagerProps {
  transactions: Transaction[];
  onAddTransaction: (txn: Transaction) => void;
}

const DEFAULT_VENDORS: Vendor[] = [
  {
    id: "v_1",
    name: "GCP Cloud Hosting",
    bankName: "Bank Central Asia (BCA)",
    accountNumber: "8012-9904-211",
    monthlyAmount: 4500000,
    category: "Utilities",
    paymentDay: 10,
    note: "Production VM clusters and database instances",
  },
  {
    id: "v_2",
    name: "HQ Office Space Landlord",
    bankName: "Bank Mandiri",
    accountNumber: "124-00-1094382-3",
    monthlyAmount: 18000000,
    category: "Rent",
    paymentDay: 1,
    note: "Main office co-working & suites rental",
  },
  {
    id: "v_3",
    name: "IndoNet Dedicated ISP",
    bankName: "Bank Rakyat Indonesia (BRI)",
    accountNumber: "0341-01-001092-50-2",
    monthlyAmount: 1200000,
    category: "Utilities",
    paymentDay: 15,
    note: "100 Mbps fiber line with static IP",
  },
  {
    id: "v_4",
    name: "Monthly HR Payroll Agency",
    bankName: "Bank Permata",
    accountNumber: "410-10293-84",
    monthlyAmount: 12500000,
    category: "Other_Expense",
    paymentDay: 25,
    note: "Contract recruitment and HR processing fees",
  }
];

export const VendorManager: React.FC<VendorManagerProps> = ({ transactions, onAddTransaction }) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [newVendor, setNewVendor] = useState<Omit<Vendor, "id">>({
    name: "",
    bankName: "",
    accountNumber: "",
    monthlyAmount: 0,
    category: "Other_Expense",
    paymentDay: 5,
    note: ""
  });

  // Load vendors
  useEffect(() => {
    const saved = localStorage.getItem("finflow_vendors");
    if (saved) {
      try {
        setVendors(JSON.parse(saved));
      } catch (e) {
        setVendors(DEFAULT_VENDORS);
      }
    } else {
      setVendors(DEFAULT_VENDORS);
      localStorage.setItem("finflow_vendors", JSON.stringify(DEFAULT_VENDORS));
    }
  }, []);

  const saveVendors = (list: Vendor[]) => {
    setVendors(list);
    localStorage.setItem("finflow_vendors", JSON.stringify(list));
  };

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendor.name || !newVendor.bankName || !newVendor.accountNumber || !newVendor.monthlyAmount) {
      alert("Please fill in all required fields.");
      return;
    }

    const created: Vendor = {
      ...newVendor,
      id: `v_${Date.now()}`
    };

    const updated = [created, ...vendors];
    saveVendors(updated);
    setIsAddOpen(false);
    setNewVendor({
      name: "",
      bankName: "",
      accountNumber: "",
      monthlyAmount: 0,
      category: "Other_Expense",
      paymentDay: 5,
      note: ""
    });
  };

  const handleDeleteVendor = (id: string) => {
    if (confirm("Are you sure you want to remove this vendor? This will not delete past recorded transaction logs.")) {
      const updated = vendors.filter((v) => v.id !== id);
      saveVendors(updated);
    }
  };

  // Helper to format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  // Check if a vendor has been paid this month
  const getVendorPaymentStatus = (vendor: Vendor) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    // Scan for transactions matching the vendor name in current month & year
    const matchingTxn = transactions.find((t) => {
      if (t.type !== "outgoing") return false;
      const tDate = new Date(t.date);
      const isCurrentMonth = tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth;
      
      const containsName = t.description.toLowerCase().includes(vendor.name.toLowerCase());
      const containsRef = t.note?.toLowerCase().includes(`ref: monthly ${vendor.name.toLowerCase()}`) || false;
      return isCurrentMonth && (containsName || containsRef);
    });

    return matchingTxn || null;
  };

  // Click handler to quickly generate a transaction
  const handleQuickPay = (vendor: Vendor) => {
    const now = new Date();
    const todayStr = now.toISOString().substring(0, 10); // "YYYY-MM-DD"

    const confirmPay = confirm(
      `Confirm monthly payment to "${vendor.name}"?\n` +
      `----------------------------------------\n` +
      `• Bank Name: ${vendor.bankName}\n` +
      `• Account: ${vendor.accountNumber}\n` +
      `• Amount: ${formatCurrency(vendor.monthlyAmount)}\n` +
      `• Date: ${todayStr}\n\n` +
      `A manual transaction will be recorded instantly in your ledger.`
    );

    if (!confirmPay) return;

    const newTxn: Transaction = {
      id: `manual_vendor_${Date.now()}`,
      type: "outgoing",
      amount: vendor.monthlyAmount,
      category: vendor.category,
      date: todayStr,
      description: `Vendor Payment: ${vendor.name}`,
      paymentMethod: "Bank Transfer",
      tags: ["Vendor", "Monthly"],
      note: `Paid to ${vendor.bankName} a/c ${vendor.accountNumber}. Ref: Monthly ${vendor.name}`,
      timestamp: now.toISOString()
    };

    onAddTransaction(newTxn);
  };

  const filteredVendors = vendors.filter((v) =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.bankName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.accountNumber.includes(searchQuery)
  );

  const currentMonthName = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

  const today = new Date();
  const todayDay = today.getDate();

  // Categorize vendors
  const categorizedReminders = vendors.reduce<{
    overdue: Array<{ vendor: Vendor; daysPast: number }>;
    dueToday: Array<{ vendor: Vendor }>;
    upcoming: Array<{ vendor: Vendor; daysLeft: number }>;
    future: Array<{ vendor: Vendor; daysLeft: number }>;
    paid: Array<{ vendor: Vendor; paidDate: string }>;
  }>(
    (acc, vendor) => {
      const paidTxn = getVendorPaymentStatus(vendor);
      if (paidTxn) {
        acc.paid.push({ vendor, paidDate: paidTxn.date });
      } else {
        if (vendor.paymentDay < todayDay) {
          acc.overdue.push({ vendor, daysPast: todayDay - vendor.paymentDay });
        } else if (vendor.paymentDay === todayDay) {
          acc.dueToday.push({ vendor });
        } else if (vendor.paymentDay <= todayDay + 7) {
          acc.upcoming.push({ vendor, daysLeft: vendor.paymentDay - todayDay });
        } else {
          acc.future.push({ vendor, daysLeft: vendor.paymentDay - todayDay });
        }
      }
      return acc;
    },
    { overdue: [], dueToday: [], upcoming: [], future: [], paid: [] }
  );

  // Sum calculations
  const totalVendorsCount = vendors.length;
  const paidVendorsCount = categorizedReminders.paid.length;
  const progressPercent = totalVendorsCount > 0 ? Math.round((paidVendorsCount / totalVendorsCount) * 100) : 0;

  const totalMonthlyLiability = vendors.reduce((sum, v) => sum + v.monthlyAmount, 0);
  const paidAmountThisMonth = categorizedReminders.paid.reduce((sum, item) => sum + item.vendor.monthlyAmount, 0);
  const unpaidLiability = totalMonthlyLiability - paidAmountThisMonth;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* List of Vendors & Quick Actions (Full Width Spreadsheet) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Header Section */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <Building className="h-4 w-4 text-indigo-500" />
              Vendor Payment Directory
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
              Active ledger of registered contractors, service providers, and standard recurring outlays
            </p>
          </div>
          
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-sm hover:shadow-md"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add New Vendor</span>
          </button>
        </div>

        {/* Search Bar & Directory Summary */}
        <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search vendor directory (name, bank, account, or category)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400 shadow-xs"
            />
          </div>
          
          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <div>
              Total: <span className="text-slate-700 font-black">{vendors.length} Vendors</span>
            </div>
            <span className="h-3 w-[1px] bg-slate-200 shrink-0"></span>
            <div>
              Total Monthly: <span className="text-indigo-600 font-black">{formatCurrency(totalMonthlyLiability)}</span>
            </div>
          </div>
        </div>

        {filteredVendors.length === 0 ? (
          <div className="text-center py-12 px-4">
            <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-black text-slate-600 uppercase tracking-wider">No vendors found</p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wide">
              {searchQuery ? "Try refining your search terms" : "Click 'Add New Vendor' to build your spreadsheet directory"}
            </p>
          </div>
        ) : (
          /* Excel spreadsheet style table layout */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-6 select-none border-r border-slate-100 w-[30px] text-center bg-slate-100/40">#</th>
                  <th className="py-3 px-6 select-none border-r border-slate-100">Vendor / Recipient</th>
                  <th className="py-3 px-6 select-none border-r border-slate-100">Category</th>
                  <th className="py-3 px-6 select-none border-r border-slate-100">Bank Destination</th>
                  <th className="py-3 px-6 select-none border-r border-slate-100">Account Number</th>
                  <th className="py-3 px-6 select-none border-r border-slate-100 text-center">Due Day</th>
                  <th className="py-3 px-6 select-none border-r border-slate-100 text-right">Monthly Amount</th>
                  <th className="py-3 px-6 select-none border-r border-slate-100 text-center">Month Status</th>
                  <th className="py-3 px-6 select-none text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {filteredVendors.map((vendor, idx) => {
                  const paidTxn = getVendorPaymentStatus(vendor);
                  return (
                    <tr 
                      key={vendor.id} 
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Row number / Grid cell style */}
                      <td className="py-3 px-6 text-center border-r border-slate-100 font-mono text-[10px] text-slate-400 font-bold bg-slate-50/30">
                        {idx + 1}
                      </td>

                      {/* Vendor name */}
                      <td className="py-3 px-6 border-r border-slate-100 font-extrabold text-slate-800">
                        <div className="flex flex-col">
                          <span>{vendor.name}</span>
                          {vendor.note && (
                            <span className="text-[9px] text-slate-400 font-medium font-serif italic mt-0.5">
                              "{vendor.note}"
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-6 border-r border-slate-100">
                        <span className="inline-block text-[8px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {vendor.category.replace("_", " ")}
                        </span>
                      </td>

                      {/* Bank Destination */}
                      <td className="py-3 px-6 border-r border-slate-100 font-bold text-slate-700">
                        {vendor.bankName}
                      </td>

                      {/* Account Number */}
                      <td className="py-3 px-6 border-r border-slate-100 font-mono text-slate-600 select-all tracking-tight">
                        {vendor.accountNumber}
                      </td>

                      {/* Due day */}
                      <td className="py-3 px-6 border-r border-slate-100 text-center">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-extrabold text-[10px]">
                          Day {vendor.paymentDay}
                        </span>
                      </td>

                      {/* Monthly Amount */}
                      <td className="py-3 px-6 border-r border-slate-100 text-right font-black text-slate-800">
                        {formatCurrency(vendor.monthlyAmount)}
                      </td>

                      {/* Month Status */}
                      <td className="py-3 px-6 border-r border-slate-100 text-center">
                        {paidTxn ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider">
                              <CheckCircle className="h-2.5 w-2.5 text-emerald-600" />
                              PAID
                            </span>
                            <span className="text-[8px] text-slate-400 font-mono mt-0.5">
                              {paidTxn.date}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleQuickPay(vendor)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded font-black text-[9px] uppercase tracking-wider cursor-pointer shadow-xs transition-all"
                          >
                            <Check className="h-2.5 w-2.5" />
                            <span>Mark as Paid</span>
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-6 text-center">
                        <button
                          onClick={() => handleDeleteVendor(vendor.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remove vendor record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Custom Vendor Modal Form */}
      {isAddOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsAddOpen(false)}
        >
          <div 
            className="relative w-full max-w-md rounded-xl shadow-2xl bg-white p-6 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-indigo-500" />
                Add Monthly Vendor
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddVendor} className="space-y-4">
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Vendor / Bill Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Cloud Hosting, Office Utilities"
                  value={newVendor.name}
                  onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Bank Destination Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BCA, Mandiri, Permata"
                    value={newVendor.bankName}
                    onChange={(e) => setNewVendor({ ...newVendor, bankName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1029-3847-56"
                    value={newVendor.accountNumber}
                    onChange={(e) => setNewVendor({ ...newVendor, accountNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Monthly Payment Amount (IDR) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 1500000"
                    value={newVendor.monthlyAmount || ""}
                    onChange={(e) => setNewVendor({ ...newVendor, monthlyAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Preferred Pay Day (1-31) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={31}
                    value={newVendor.paymentDay}
                    onChange={(e) => setNewVendor({ ...newVendor, paymentDay: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={newVendor.category}
                    onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {MANUAL_CATEGORIES.outgoing.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Memos / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Memo/particulars for this monthly recurring vendor..."
                  value={newVendor.note}
                  onChange={(e) => setNewVendor({ ...newVendor, note: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-black uppercase tracking-wider text-slate-600 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
