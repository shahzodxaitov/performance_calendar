"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Loader2 } from "lucide-react";

interface ReportGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (report: any) => void;
  companies: any[];
  defaultCompanyId?: string;
}

export function ReportGeneratorModal({ isOpen, onClose, onSuccess, companies, defaultCompanyId }: ReportGeneratorModalProps) {
  const [companyId, setCompanyId] = useState(defaultCompanyId || "");
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "custom">("weekly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (defaultCompanyId && defaultCompanyId !== "all") setCompanyId(defaultCompanyId);
      else if (companies.length > 0 && !companyId) setCompanyId(companies[0].id);
      
      const today = new Date();
      setEndDate(today.toISOString().split("T")[0]);
      
      if (period === "daily") {
        setStartDate(today.toISOString().split("T")[0]);
      } else if (period === "weekly") {
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        setStartDate(lastWeek.toISOString().split("T")[0]);
      } else if (period === "monthly") {
        const lastMonth = new Date(today);
        lastMonth.setDate(today.getDate() - 30);
        setStartDate(lastMonth.toISOString().split("T")[0]);
      }
    }
  }, [isOpen, defaultCompanyId, companies, period]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!companyId || companyId === "all") throw new Error("Hisobot yratish uchun bitta loyiha tanlanishi shart.");
      if (!startDate || !endDate) throw new Error("Sanalar to'liq kiritilmagan.");

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: companyId, type: period, start_date: startDate, end_date: endDate }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xatolik yuz berdi");
      
      onSuccess(data.report);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-[480px] bg-[#1c1c1e] rounded-[24px] border border-white/[0.08] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div>
            <h2 className="text-[17px] font-semibold text-white tracking-tight">Yangi Hisobot</h2>
            <p className="text-[13px] text-[#86868b] mt-0.5">Loyiha va sanani tanlab real ma'lumotlarni hisoblang.</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.04] text-[#86868b] hover:bg-white/[0.08] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[#86868b]">Loyiha</label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full bg-black border border-white/[0.1] rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
              required
            >
              <option value="" disabled>Loyiha tanlang...</option>
              {companies.filter(c => c.id !== "all").map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-[13px] font-medium text-[#86868b]">Davr</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: "daily", label: "Kunlik" },
                { id: "weekly", label: "Haftalik" },
                { id: "monthly", label: "Oylik" },
                { id: "custom", label: "Tanlash" }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPeriod(opt.id as any)}
                  className={`py-2 px-1 text-[13px] font-medium rounded-lg text-center transition-colors ${
                    period === opt.id ? "bg-[var(--accent-blue)] text-white" : "bg-white/[0.04] text-[#86868b] hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-[#86868b]">Boshlanish</label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={period !== "custom"}
                  className="w-full bg-black border border-white/[0.1] rounded-xl pl-10 pr-4 py-3 text-[14px] text-white focus:outline-none focus:border-[var(--accent-blue)] disabled:opacity-50"
                  required
                />
                <Calendar className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-[#86868b]">Tugash</label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={period !== "custom"}
                  className="w-full bg-black border border-white/[0.1] rounded-xl pl-10 pr-4 py-3 text-[14px] text-white focus:outline-none focus:border-[var(--accent-blue)] disabled:opacity-50"
                  required
                />
                <Calendar className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-[14px] text-[15px] font-medium flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Hisobotni generatsiya qilish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
