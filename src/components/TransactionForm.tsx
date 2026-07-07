import React, { useState } from "react";
import { Plus, ArrowUpRight, ArrowDownLeft, Calendar, DollarSign, Tag, CreditCard, AlignLeft, FileText, Image, Upload, X } from "lucide-react";
import { Transaction, TransactionType, MANUAL_CATEGORIES, PAYMENT_METHODS } from "../types";
import { generateVoucherBase64 } from "../utils/receiptGenerator";

interface TransactionFormProps {
  onAddTransaction: (transaction: Omit<Transaction, "id">) => void;
  onCancel?: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onAddTransaction, onCancel }) => {
  const [type, setType] = useState<TransactionType>("incoming");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [tagInput, setTagInput] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [photoEvidence, setPhotoEvidence] = useState<string>("");
  const [isDragActive, setIsDragActive] = useState<boolean>(false);

  // Auto-update default category when type changes
  React.useEffect(() => {
    const categories = MANUAL_CATEGORIES[type];
    if (categories.length > 0) {
      setCategory(categories[0].value);
    }
  }, [type]);

  const handleAddTag = (tagToAdd: string) => {
    const cleanTag = tagToAdd.trim().toLowerCase().replace(/,/g, "");
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (tagInput.trim()) {
        handleAddTag(tagInput);
        setTagInput("");
      }
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setTags(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const suggestedTags = type === "incoming" 
    ? ["income", "fixed", "bonus", "freelance", "investment", "primary"]
    : ["essential", "leisure", "bills", "one-time", "monthly", "social", "groceries"];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrors(prev => ({ ...prev, file: "Please select an image file (PNG/JPG/etc)." }));
      return;
    }
    setErrors(prev => {
      const copy = { ...prev };
      delete copy.file;
      return copy;
    });
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPhotoEvidence(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = "Please enter a valid amount greater than 0";
    }

    if (!description.trim()) {
      newErrors.description = "Please enter a short description";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Generate custom digital voucher proof if no custom photo uploaded
    const finalPhoto = photoEvidence || generateVoucherBase64(
      parsedAmount,
      description.trim(),
      category,
      type,
      date,
      paymentMethod
    );

    // Clear errors & submit
    setErrors({});
    onAddTransaction({
      type,
      amount: parsedAmount,
      category,
      date,
      description: description.trim(),
      paymentMethod,
      tags: tags.length > 0 ? tags : undefined,
      note: note.trim() || undefined,
      timestamp: new Date().toISOString(),
      photoEvidence: finalPhoto
    });

    // Reset fields except type, category, date and paymentMethod
    setAmount("");
    setDescription("");
    setNote("");
    setTags([]);
    setPhotoEvidence("");
    onCancel?.();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <span className="p-1.5 rounded bg-indigo-50 text-indigo-600">
            <Plus className="h-3.5 w-3.5" />
          </span>
          Record Manual Transaction
        </h3>
        {onCancel && (
          <button 
            type="button"
            onClick={onCancel}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type selector toggle (Incoming vs Outgoing) */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => setType("incoming")}
            className={`py-2 px-3 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer ${
              type === "incoming"
                ? "bg-white text-emerald-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            Incoming
          </button>
          <button
            type="button"
            onClick={() => setType("outgoing")}
            className={`py-2 px-3 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer ${
              type === "outgoing"
                ? "bg-white text-rose-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <ArrowDownLeft className="h-3.5 w-3.5" />
            Outgoing
          </button>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
            Amount (IDR)
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
              <span className="text-slate-400 text-xs font-bold">Rp</span>
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className={`block w-full rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs font-semibold placeholder-slate-400 ${
                errors.amount ? "border-rose-300 focus:ring-rose-500" : ""
              }`}
            />
          </div>
          {errors.amount && (
            <p className="mt-1 text-[10px] text-rose-600 font-bold">{errors.amount}</p>
          )}
        </div>

        {/* Category Selector */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Tag className="h-3.5 w-3.5 text-slate-400" /> Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="block w-full rounded-lg border border-slate-200 py-2 px-2.5 text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs font-medium"
          >
            {MANUAL_CATEGORIES[type].map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date Selector */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-slate-400" /> Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="block w-full rounded-lg border border-slate-200 py-2 px-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs font-medium"
          />
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <CreditCard className="h-3.5 w-3.5 text-slate-400" /> Payment Method
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="block w-full rounded-lg border border-slate-200 py-2 px-2.5 text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs font-medium"
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>

        {/* Description Field */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <AlignLeft className="h-3.5 w-3.5 text-slate-400" /> Short Description
          </label>
          <input
            id="txn-desc-input"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Salary payout, internet bill"
            className={`block w-full rounded-lg border border-slate-200 py-2 px-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs font-medium ${
              errors.description ? "border-rose-300 focus:ring-rose-500" : ""
            }`}
          />
          {errors.description && (
            <p className="mt-1 text-[10px] text-rose-600 font-bold">{errors.description}</p>
          )}
        </div>

        {/* Note Field (Optional) */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <FileText className="h-3.5 w-3.5 text-slate-400" /> Detailed Note (Optional)
          </label>
          <textarea
            id="txn-note-input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add detailed information, links, receipts info, etc."
            rows={2}
            className="block w-full rounded-lg border border-slate-200 py-2 px-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs font-medium placeholder-slate-400 bg-white resize-y"
          />
        </div>

        {/* Photo Evidence Section */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Image className="h-3.5 w-3.5 text-slate-400" /> Photo Evidence / Receipt
          </label>
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-3 text-center transition-all duration-150 flex flex-col items-center justify-center ${
              isDragActive 
                ? "border-indigo-500 bg-indigo-50/50" 
                : photoEvidence 
                ? "border-emerald-500 bg-emerald-50/10" 
                : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            {photoEvidence ? (
              <div className="w-full flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="relative w-10 h-10 rounded border border-slate-200 overflow-hidden bg-white shrink-0 shadow-sm">
                    <img src={photoEvidence} alt="Evidence preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Custom Receipt Loaded</p>
                    <p className="text-[9px] text-slate-400">Attached to cashier record entry</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPhotoEvidence("")}
                  className="px-2 py-1 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded text-[10px] font-bold text-slate-600 hover:text-rose-600 transition-all cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="w-full h-full cursor-pointer py-1.5 flex flex-col items-center justify-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="h-5 w-5 text-slate-400 mb-1" />
                <p className="text-[10px] font-bold text-slate-700">Drag & Drop receipt or click to browse</p>
                <p className="text-[9px] text-slate-400 mt-0.5 font-semibold">
                  (If empty, a highly polished digital voucher is auto-compiled)
                </p>
              </label>
            )}
          </div>
          {errors.file && <p className="text-rose-600 text-[10px] mt-1 font-bold">{errors.file}</p>}
        </div>

        {/* Tags Section */}
        <div className="pt-1 border-t border-slate-100">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Plus className="h-3.5 w-3.5 text-slate-400" /> Tags (Optional)
            </span>
            <span className="text-[9px] text-slate-400 font-bold normal-case tracking-normal">Enter or comma to add</span>
          </label>
          <div className="flex gap-1.5 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              placeholder="e.g. fixed, side-hustle, gym"
              className="block flex-1 rounded-lg border border-slate-200 py-1.5 px-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs font-medium placeholder-slate-400 bg-white"
            />
            <button
              type="button"
              onClick={() => {
                if (tagInput.trim()) {
                  handleAddTag(tagInput);
                  setTagInput("");
                }
              }}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Add
            </button>
          </div>

          {/* Render Active Tags */}
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag, idx) => (
                <span 
                  key={idx} 
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(idx)}
                    className="hover:text-rose-600 font-black focus:outline-none ml-0.5 text-xs text-slate-400 leading-none"
                    title="Remove tag"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          {/* Suggested Quick Tags */}
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mr-1">Suggested:</span>
            {suggestedTags
              .filter(tag => !tags.includes(tag))
              .slice(0, 5)
              .map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  className="px-1.5 py-0.5 rounded text-[9px] font-extrabold text-slate-500 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-pointer uppercase tracking-wider"
                >
                  +{tag}
                </button>
              ))}
          </div>
        </div>

        {/* Actions Button Row */}
        <div className="flex items-center gap-2 mt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 inline-flex items-center justify-center py-2 px-4 rounded-lg text-xs font-bold text-slate-700 bg-slate-150 hover:bg-slate-200 border border-slate-200 focus:outline-none transition-all duration-150 cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className={`${onCancel ? "flex-1" : "w-full"} inline-flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none shadow-sm hover:shadow transition-all duration-150 cursor-pointer`}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Record Entry
          </button>
        </div>
      </form>
    </div>
  );
};
