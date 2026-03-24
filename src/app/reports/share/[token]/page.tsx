"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Users, DollarSign, CheckCircle2, BarChart3, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

const chartData = [
  { name: "1", leads: 12, sales: 3 },
  { name: "2", leads: 18, sales: 5 },
  { name: "3", leads: 8, sales: 2 },
  { name: "4", leads: 22, sales: 7 },
  { name: "5", leads: 15, sales: 4 },
  { name: "6", leads: 9, sales: 1 },
  { name: "7", leads: 5, sales: 0 },
];

const sourceData = [
  { name: "Instagram", value: 45, color: "#E1306C" },
  { name: "Telegram", value: 28, color: "#0088cc" },
  { name: "Google", value: 18, color: "#30d158" },
  { name: "Boshqa", value: 9, color: "#ff9f0a" },
];

export default function SharedReportPage() {
  const { token } = useParams<{ token: string }>();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reports?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setReport(data.report);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-[#f5f5f7]">
        <div className="text-[#86868b] animate-pulse">Yuklanmoqda...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-[#f5f5f7]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Hisobot topilmadi</h1>
          <p className="text-[#86868b]">Ushbu link noto'g'ri yoxud hisobot o'chirilgan.</p>
        </div>
      </div>
    );
  }

  const { data } = report;

  return (
    <div className="min-h-screen bg-black text-[#f5f5f7]" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Header */}
      <header className="border-b border-white/[0.06] sticky top-0 z-50 bg-black/80 backdrop-blur-2xl">
        <div className="max-w-[900px] mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#0071e3] to-[#5856d6] flex items-center justify-center text-[12px] font-bold text-white shadow-lg shadow-blue-500/20">
              {report.company_name.charAt(0)}
            </div>
            <div>
              <div className="text-[15px] font-semibold text-white">{report.company_name}</div>
              <div className="text-[11px] text-[#86868b]">{report.title}</div>
            </div>
          </div>
          <div className="text-[13px] text-[#86868b] font-medium">{report.subtitle}</div>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-8 py-10 space-y-10">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Jami Leadlar", value: data.leads, change: data.leads_ch, icon: Users, color: "#0071e3" },
            { label: "Sotuvlar", value: data.sales, change: data.sales_ch, icon: DollarSign, color: "#30d158" },
            { label: "Bajarilgan", value: `${data.done}/${data.total}`, change: `${Math.round(data.done/data.total*100)}%`, icon: CheckCircle2, color: "#bf5af2" },
            { label: "Konversiya", value: data.conversion || "0%", change: data.conversion_ch || "0%", icon: BarChart3, color: "#ff9f0a" },
          ].map((s, i) => (
             <div key={i} className="rounded-2xl bg-[#1c1c1e]/80 border border-white/[0.06] p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}>
                  <s.icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <span className={cn(
                  "text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-0.5",
                  s.change.startsWith("+") || s.change.endsWith("%") && parseFloat(s.change) > 50 
                    ? "text-[#30d158] bg-[#30d158]/10" 
                    : s.change.startsWith("-") || s.change === "0%"
                      ? "text-[#ff453a] bg-[#ff453a]/10"
                      : "text-[#86868b] bg-white/[0.04]"
                )}>
                  {s.change.startsWith("+") ? <ArrowUpRight className="w-3 h-3" /> : (s.change.startsWith("-") ? <ArrowDownRight className="w-3 h-3" /> : null)}
                  {s.change}
                </span>
              </div>
              <div className="text-[24px] font-semibold text-white tracking-tight leading-none">{s.value}</div>
              <div className="text-[11px] text-[#86868b] mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="rounded-2xl bg-[#1c1c1e]/80 border border-white/[0.06] p-6">
          <h3 className="text-[17px] font-semibold text-white mb-6">Leadlar Dinamikasi</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="shareGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0071e3" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#0071e3" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" stroke="#86868b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#86868b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "rgba(28,28,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px" }} />
                <Area type="monotone" dataKey="leads" stroke="#0071e3" strokeWidth={2} fill="url(#shareGrad)" name="Leadlar" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sources */}
        <div className="rounded-2xl bg-[#1c1c1e]/80 border border-white/[0.06] p-6">
          <h3 className="text-[17px] font-semibold text-white mb-6">Manbalar</h3>
          <div className="space-y-5">
            {sourceData.map((src, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-[12px] font-medium">
                  <span className="text-[#86868b]">{src.name}</span>
                  <span className="text-white">{src.value}%</span>
                </div>
                <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${src.value}%`, backgroundColor: src.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-2xl bg-[#1c1c1e]/80 border border-white/[0.06] p-6">
          <h3 className="text-[17px] font-semibold text-white mb-4">Xulosa</h3>
          <div className="text-[14px] text-[#86868b] leading-[1.7] space-y-2">
            <p>Bu davrda <b className="text-white">{data.leads} ta lead</b> kelib tushdi (<span className={data.leads_ch.startsWith("+") ? "text-[#30d158]" : "text-[#ff453a]"}>{data.leads_ch}</span>).</p>
            <p>Asosiy manba — <b className="text-white">{data.source}</b>.</p>
            <p>Jami <b className="text-white">{data.sales} UzS</b> sotuv amalga oshirildi. Rejadagi {data.total} ta vazifadan <b className="text-white">{data.done} tasi</b> bajarildi ({Math.round(data.done/data.total*100)}%).</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6 border-t border-white/[0.06]">
          <p className="text-[12px] text-[#86868b]">
            Performance Agency · Samarqand · 2026
          </p>
        </div>
      </main>
    </div>
  );
}
