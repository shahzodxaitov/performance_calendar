"use client";

import { useState, useEffect } from "react";
import { FileBarChart, Calendar, TrendingUp, Send, Plus, ArrowUpRight, ArrowDownRight, ChevronRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCompany } from "@/context/CompanyContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { ReportType, ReportData } from "@/lib/data-store";
import { ReportGeneratorModal } from "@/components/ReportGeneratorModal";

const tabs: { key: ReportType; label: string }[] = [
  { key: "daily", label: "Kunlik" },
  { key: "weekly", label: "Haftalik" },
  { key: "monthly", label: "Oylik" },
  { key: "custom", label: "Maxsus" },
];

export default function ReportsPage() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<ReportType>("daily");
  const { selectedCompany, isAll, companies } = useCompany();
  const [fbAds, setFbAds] = useState({ spend: 0, cpc: 0, status: "not_connected" });
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const url = isAll ? "/api/reports" : `/api/reports?company_id=${selectedCompany.id}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setReportsList(data.reports);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedCompany.id, isAll]);

  useEffect(() => {
    fetch(`/api/facebook/spend?company_id=${selectedCompany.id}&period=${activeTab}`)
      .then(res => res.json())
      .then(d => setFbAds(d))
      .catch(() => {});
  }, [selectedCompany.id, activeTab]);

  const filtered = reportsList.filter(r => r.type === activeTab);

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/reports/share/${token}`);
    alert("Link nusxalandi!");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Haqiqatan ham ushbu hisobotni o'chirasizmi? (Unga taalluqli share linki ham ishlamay qoladi)")) return;
    try {
      const res = await fetch(`/api/reports?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setReportsList(prev => prev.filter(r => r.id !== id));
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("O'chirishda xatolik yuz berdi");
    }
  };

  return (
    <>
      <ReportGeneratorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        companies={companies}
        defaultCompanyId={isAll ? "" : selectedCompany.id}
        onSuccess={(newReport: ReportData) => {
          setReportsList([newReport, ...reportsList]);
          setActiveTab(newReport.type);
        }}
      />
      <div className="space-y-6 animate-in">
        <section className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[24px] md:text-[32px] font-semibold text-white tracking-tight">
              {isAll ? "Hisobotlar" : `${selectedCompany.name} Hisobotlari`}
            </h1>
            <p className="text-[12px] md:text-[15px] text-[var(--muted-foreground)] mt-1">Kunlik, haftalik, oylik va maxsus oraliq hisobotlar.</p>
          </div>
          {(role === "admin" || role === "manager") && (
            <button onClick={() => setIsModalOpen(true)} className="btn-primary shrink-0"><Plus className="w-4 h-4" /> <span className="hidden sm:inline">Yangi hisobot</span><span className="sm:hidden">Yangi</span></button>
          )}
        </section>

        <section className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] w-fit">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={cn("px-5 py-2 rounded-[10px] text-[13px] font-medium transition-all",
                activeTab === tab.key ? "bg-white/[0.1] text-white" : "text-[var(--muted-foreground)] hover:text-white")}>
              {tab.label}
            </button>
          ))}
        </section>

        <div className="space-y-4">
          {loading ? (
            <div className="glass-card p-16 text-center text-[15px] text-[#86868b]">Yuklanmoqda...</div>
          ) : filtered.length === 0 ? (
            <div className="glass-card p-16 text-center">
              <div className="text-[40px] mb-3">📊</div>
              <div className="text-[15px] font-medium text-white mb-1">Hisobot topilmadi</div>
              <div className="text-[13px] text-[var(--muted-foreground)]">Bu davr uchun hali hisobot yaratilmagan. Yuqoridagi tugmadan foydalaning.</div>
            </div>
          ) : filtered.map(report => (
            <div key={report.id} className="glass-card overflow-hidden group">
              <div className="px-6 py-5 flex items-center justify-between border-b border-white/[0.04]">
                <div className="flex items-center gap-4">
                  <div className={cn("w-11 h-11 rounded-[14px] flex items-center justify-center",
                    report.type === "daily" ? "bg-[var(--accent-blue)]/10" : report.type === "weekly" ? "bg-[var(--accent-purple)]/10" : "bg-[var(--accent-green)]/10")}>
                    {report.type === "daily" ? <Calendar className="w-5 h-5 text-[var(--accent-blue)]" /> :
                     report.type === "weekly" ? <FileBarChart className="w-5 h-5 text-[var(--accent-purple)]" /> :
                     <TrendingUp className="w-5 h-5 text-[var(--accent-green)]" />}
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold text-white">{!isAll && report.company_name + " "}{report.title}</div>
                    <div className="text-[12px] text-[var(--muted-foreground)]">
                      {isAll && <span className="text-[var(--accent-blue)]">{report.company_name}</span>}{isAll && " · "}{report.subtitle}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  {(role === "admin" || role === "manager") && (
                    <button onClick={() => handleDelete(report.id)} className="btn-secondary text-[12px] py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--accent-red)", borderColor: "rgba(255,69,58,0.2)" }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => copyLink(report.share_token)} className="btn-secondary text-[12px] py-2 px-4" style={{ color: "#0088cc", borderColor: "rgba(0,136,204,0.2)" }}>
                    <Send className="w-3.5 h-3.5" /> Telegram
                  </button>
                  <Link href={`/reports/share/${report.share_token}`} className="btn-secondary text-[12px] py-2 px-4">
                    Ko'rish <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-white/[0.04]">
                <Metric label="Leadlar" value={String(report.data.leads)} change={report.data.leads_ch} />
                <Metric label="Sotuvlar" value={report.data.sales} change={report.data.sales_ch} />
                <Metric label="Ishlar" value={`${report.data.done}/${report.data.total}`} change={report.data.total ? `${Math.round(report.data.done / report.data.total * 100)}%` : "0%"} />
                <div className="p-5 flex flex-col justify-center">
                  <div className="text-[11px] text-[var(--muted-foreground)] font-medium mb-1 flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    FB Rasxod
                  </div>
                  <div className="text-[20px] font-semibold text-white tracking-tight">
                    {fbAds.status === "connected" ? `$${fbAds.spend.toFixed(2)}` : "$0.00"}
                  </div>
                  <div className="text-[10px] text-[var(--muted-foreground)] mt-1">CPL: ${fbAds.status === "connected" && fbAds.spend > 0 && report.data.leads ? (fbAds.spend / report.data.leads).toFixed(2) : "0.00"}</div>
                </div>
                <div className="p-5 flex flex-col justify-center">
                  <div className="text-[11px] text-[var(--muted-foreground)] font-medium mb-1">Top Manba</div>
                  <div className="text-[20px] font-semibold text-white tracking-tight">{report.data.source}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Metric({ label, value, change }: { label: string; value: string; change: string }) {
  const up = change.startsWith("+");
  return (
    <div className="p-5">
      <div className="text-[11px] text-[var(--muted-foreground)] font-medium mb-1">{label}</div>
      <div className="flex items-end gap-2">
        <span className="text-[20px] font-semibold text-white tracking-tight">{value}</span>
        <span className={cn("text-[11px] font-semibold flex items-center gap-0.5 mb-0.5", up ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]")}>
          {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{change}
        </span>
      </div>
    </div>
  );
}
