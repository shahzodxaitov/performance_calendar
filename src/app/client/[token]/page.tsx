"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Users, Target, TrendingUp, DollarSign, ArrowUpRight, CalendarDays, BarChart3, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface AmoStats {
  total_leads: number;
  qualified_leads: number;
  visits: number;
  sales_amount: number;
  chart: { name: string; leads: number; sales: number }[];
  status: string;
}

interface Lead {
  id: string;
  name: string;
  source: string;
  status: string;
  created_at: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "review" | "done";
  due_date: string;
}

interface ClientData {
  company: { id: string; name: string };
  amoStats: AmoStats;
  leads: Lead[];
  tasks: Task[];
  period: string;
}

const statusColors: Record<string, string> = {
  Yangi: "#0071e3",
  Aloqada: "#ff9f0a",
  "Sotib oldi": "#30d158",
  "Rad etdi": "#ff375f",
};

const taskStatusMap: Record<string, { label: string; color: string; bg: string }> = {
  todo: { label: "Kutilmoqda", color: "#86868b", bg: "#86868b20" },
  in_progress: { label: "Jarayonda", color: "#0071e3", bg: "#0071e320" },
  review: { label: "Tekshiruvda", color: "#bf5af2", bg: "#bf5af220" },
  done: { label: "Bajarildi", color: "#30d158", bg: "#30d15820" },
};

export default function ClientPortalPage() {
  const { token } = useParams<{ token: string }>();
  const [period, setPeriod] = useState("daily");
  const [data, setData] = useState<ClientData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch(`/api/client/${token}?period=${period}`)
      .then(res => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then(d => { setData(d); setError(false); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [token, period]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Har 60 sekundda yangilanadi
    return () => clearInterval(interval);
  }, [fetchData]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <span className="text-[28px]">🔒</span>
          </div>
          <h1 className="text-[24px] font-semibold text-white">Loyiha topilmadi</h1>
          <p className="text-[14px] text-[#86868b]">Bu link noto'g'ri yoki muddati tugagan.</p>
        </div>
      </div>
    );
  }

  if (!data || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#0071e3] border-t-transparent animate-spin mx-auto" />
          <p className="text-[13px] text-[#86868b]">Ma'lumotlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const { company, amoStats, leads, tasks } = data;
  const conversionRate = amoStats.total_leads > 0 ? Math.round((amoStats.qualified_leads / amoStats.total_leads) * 100) : 0;

  const stats = [
    { title: "Jami Leadlar", value: amoStats.total_leads.toString(), icon: Users, color: "#0071e3" },
    { title: "Sifatli Leadlar", value: amoStats.qualified_leads.toString(), icon: Target, color: "#bf5af2" },
    { title: "Konversiya", value: `${conversionRate}%`, icon: TrendingUp, color: "#34c759" },
    { title: "Uchrashuvlar", value: amoStats.visits.toString(), icon: CalendarDays, color: "#ff9f0a" },
    { title: "Sotuvlar", value: amoStats.sales_amount > 1000000 ? (amoStats.sales_amount / 1000000).toFixed(1) + "M" : amoStats.sales_amount.toLocaleString(), icon: DollarSign, color: "#30d158" },
  ];

  const periodLabels: Record<string, string> = {
    daily: "Bugungi",
    weekly: "Haftalik",
    monthly: "Oylik",
    yearly: "Yillik",
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Header */}
      <header className="border-b border-white/[0.06] sticky top-0 z-50 bg-black/80 backdrop-blur-2xl">
        <div className="max-w-[1100px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-[#0071e3] to-[#5856d6] flex items-center justify-center text-[14px] font-bold text-white shadow-lg shadow-blue-500/20">
              {company.name.charAt(0)}
            </div>
            <div>
              <div className="text-[15px] font-semibold text-white">{company.name}</div>
              <div className="text-[11px] text-[#86868b] flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-[#30d158]" />
                {periodLabels[period]} hisobot · Jonli
              </div>
            </div>
          </div>

          <div className="flex bg-white/[0.04] p-1 rounded-lg border border-white/[0.06]">
            {[
              { id: "daily", label: "Bugun" },
              { id: "weekly", label: "Hafta" },
              { id: "monthly", label: "Oy" },
              { id: "yearly", label: "Yil" },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-all ${
                  period === p.id
                    ? "bg-[#0071e3] text-white shadow-sm"
                    : "text-[#86868b] hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-6 py-8 space-y-8">
        {/* ---- Stats Grid ---- */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="rounded-2xl bg-[#1c1c1e]/80 border border-white/[0.06] p-5 hover:bg-white/[0.03] transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-[12px] flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}>
                  <s.icon className="w-[18px] h-[18px]" style={{ color: s.color }} />
                </div>
                {amoStats.status === "connected" && (
                  <span className="text-[10px] font-semibold text-[#30d158] bg-[#30d158]/10 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                    <ArrowUpRight className="w-3 h-3" /> Live
                  </span>
                )}
              </div>
              <div className="text-[28px] font-semibold text-white tracking-tight leading-none">{s.value}</div>
              <div className="text-[12px] text-[#86868b] mt-1.5 font-medium">{s.title}</div>
            </div>
          ))}
        </section>

        {/* ---- Chart + Leads Grid ---- */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Chart */}
          <section className="lg:col-span-3 rounded-2xl bg-[#1c1c1e]/80 border border-white/[0.06] p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[17px] font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#0071e3]" /> Leadlar va Sotuvlar Oqimi
              </h2>
              <span className="text-[11px] text-[#86868b] font-medium">{periodLabels[period]}</span>
            </div>
            <div className="h-[300px] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={amoStats.chart.length > 0 ? amoStats.chart : [{ name: "—", leads: 0, sales: 0 }]}>
                  <defs>
                    <linearGradient id="cLeadGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0071e3" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#0071e3" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="cSaleGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#30d158" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#30d158" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" stroke="#86868b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#86868b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "rgba(28,28,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px", backdropFilter: "blur(20px)" }}
                    itemStyle={{ color: "#f5f5f7" }}
                    labelStyle={{ color: "#86868b" }}
                  />
                  <Area type="monotone" dataKey="leads" stroke="#0071e3" strokeWidth={2} fillOpacity={1} fill="url(#cLeadGrad)" name="Leadlar" />
                  <Area type="monotone" dataKey="sales" stroke="#30d158" strokeWidth={2} fillOpacity={1} fill="url(#cSaleGrad)" name="Sotuvlar" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* So'nggi Leadlar */}
          <section className="lg:col-span-2 rounded-2xl bg-[#1c1c1e]/80 border border-white/[0.06] p-6 flex flex-col">
            <h2 className="text-[17px] font-semibold text-white mb-6 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#bf5af2]" /> So'nggi Murojaatlar
            </h2>
            <div className="space-y-1 flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {leads.length > 0 ? leads.map((lead, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-[14px] hover:bg-white/[0.04] transition-colors">
                  <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center text-[12px] font-semibold text-white shrink-0">
                    {lead.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-white truncate">{lead.name}</div>
                    <div className="text-[11px] text-[#86868b] flex items-center gap-2">
                      {lead.source}
                      <span className="opacity-50">•</span>
                      {new Date(lead.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-semibold px-2 py-1 rounded-md shrink-0"
                    style={{
                      color: statusColors[lead.status] || "#86868b",
                      backgroundColor: `color-mix(in srgb, ${statusColors[lead.status] || "#86868b"} 12%, transparent)`,
                    }}
                  >
                    {lead.status}
                  </span>
                </div>
              )) : (
                <div className="text-[13px] text-[#86868b] text-center py-10 opacity-60">
                  Bu davr uchun murojaatlar topilmadi.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ---- Jamoa ishlari (Tasks) ---- */}
        <section className="rounded-2xl bg-[#1c1c1e]/80 border border-white/[0.06] p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[17px] font-semibold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-[#30d158]" /> Bajarilayotgan ishlar
              </h2>
              <p className="text-[12px] text-[#86868b] mt-1">Jamoamiz tomonidan loyihangiz uchun qilinayotgan vazifalar</p>
            </div>
            <div className="text-[12px] font-medium bg-white/[0.04] px-3 py-1.5 rounded-lg text-white">
              {tasks?.filter(t => t.status !== 'done').length || 0} ta faol
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks && tasks.length > 0 ? tasks.map((task) => {
              const statusMeta = taskStatusMap[task.status] || taskStatusMap.todo;
              return (
                <div key={task.id} className="p-4 rounded-[14px] bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-colors relative overflow-hidden group">
                  {task.status === 'done' && (
                    <div className="absolute top-0 right-0 w-16 h-16 bg-[#30d158]/5 blur-2xl rounded-full" />
                  )}
                  <div className="flex items-start justify-between mb-3 relative z-10">
                    <span 
                      className="text-[10px] font-semibold px-2 py-1 rounded-md"
                      style={{ color: statusMeta.color, backgroundColor: statusMeta.bg }}
                    >
                      {statusMeta.label}
                    </span>
                    <span className="text-[11px] text-[#86868b] flex items-center gap-1 opacity-70">
                      <CalendarDays className="w-3 h-3" />
                      {new Date(task.due_date).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <h3 className={`text-[14px] font-medium transition-colors relative z-10 ${task.status === 'done' ? 'text-[#86868b] line-through' : 'text-white'}`}>
                    {task.title}
                  </h3>
                  {task.description && (
                     <p className="text-[12px] text-[#86868b] mt-1.5 line-clamp-2 relative z-10">{task.description}</p>
                  )}
                </div>
              );
            }) : (
              <div className="col-span-full py-8 text-center border border-dashed border-white/[0.1] rounded-[14px]">
                 <p className="text-[13px] text-[#86868b]">Hozircha vazifalar mavjud emas</p>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 border-t border-white/[0.06]">
          <p className="text-[12px] text-[#86868b]">
            {company.name} · Jonli hisobot · Har 60 sekundda yangilanadi
          </p>
          <p className="text-[10px] text-[#48484a] mt-1">Powered by Performance Agency</p>
        </footer>
      </main>
    </div>
  );
}
