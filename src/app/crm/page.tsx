"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Users, Target, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useCompany } from "@/context/CompanyContext";
import { cn } from "@/lib/utils";

const crmByCompany: Record<string, {
  stats: { title: string; value: string; change: string; trend: string; icon: any; color: string }[];
  chart: { name: string; leads: number; sales: number }[];
  leads: { name: string; source: string; status: string; time: string }[];
}> = {
  all: {
    stats: [
      { title: "Jami Leadlar", value: "0", change: "0%", trend: "up", icon: Users, color: "#0071e3" },
      { title: "Yangi Leadlar", value: "0", change: "0%", trend: "up", icon: Target, color: "#bf5af2" },
      { title: "Sotuvlar", value: "0 UzS", change: "0%", trend: "up", icon: DollarSign, color: "#30d158" },
      { title: "Konversiya", value: "0%", change: "0%", trend: "up", icon: TrendingUp, color: "#ff9f0a" },
    ],
    chart: [],
    leads: [],
  },
  c1: {
    stats: [
      { title: "Jami Leadlar", value: "0", change: "0%", trend: "up", icon: Users, color: "#0071e3" },
      { title: "Yangi Leadlar", value: "0", change: "0%", trend: "up", icon: Target, color: "#bf5af2" },
      { title: "Sotuvlar", value: "0 UzS", change: "0%", trend: "up", icon: DollarSign, color: "#30d158" },
      { title: "Konversiya", value: "0%", change: "0%", trend: "up", icon: TrendingUp, color: "#ff9f0a" },
    ],
    chart: [],
    leads: [],
  },
  c2: {
    stats: [
      { title: "Jami Leadlar", value: "0", change: "0%", trend: "up", icon: Users, color: "#0071e3" },
      { title: "Yangi Leadlar", value: "0", change: "0%", trend: "up", icon: Target, color: "#bf5af2" },
      { title: "Sotuvlar", value: "0 UzS", change: "0%", trend: "up", icon: DollarSign, color: "#30d158" },
      { title: "Konversiya", value: "0%", change: "0%", trend: "up", icon: TrendingUp, color: "#ff9f0a" },
    ],
    chart: [],
    leads: [],
  },
  c3: {
    stats: [
      { title: "Jami Leadlar", value: "0", change: "0%", trend: "up", icon: Users, color: "#0071e3" },
      { title: "Yangi Leadlar", value: "0", change: "0%", trend: "up", icon: Target, color: "#bf5af2" },
      { title: "Sotuvlar", value: "0 UzS", change: "0%", trend: "up", icon: DollarSign, color: "#30d158" },
      { title: "Konversiya", value: "0%", change: "0%", trend: "up", icon: TrendingUp, color: "#ff9f0a" },
    ],
    chart: [],
    leads: [],
  },
};

const statusStyles: Record<string, { label: string; color: string }> = {
  "Yangi": { label: "Yangi", color: "var(--accent-blue)" },
  "Aloqada": { label: "Aloqada", color: "var(--accent-orange)" },
  "Sotib oldi": { label: "Sotib oldi", color: "var(--accent-green)" },
  "Rad etdi": { label: "Rad etdi", color: "var(--accent-red)" },
};

interface Lead {
  id: string;
  name: string;
  source: string;
  status: string;
  created_at: string;
}

export default function CRMPage() {
  const { selectedCompany, isAll } = useCompany();
  // Using hardcoded zeroed data as a base/skeleton
  const fallbackData = crmByCompany[selectedCompany.id] || crmByCompany.all;
  
  const [period, setPeriod] = useState("daily");
  const [fbAds, setFbAds] = useState({ spend: 0, cpc: 0, status: "not_connected" });
  const [realLeads, setRealLeads] = useState<Lead[]>([]);
  const [amoStats, setAmoStats] = useState({
    total_leads: 0,
    qualified_leads: 0,
    visits: 0,
    sales_amount: 0,
    chart: [] as { name: string; leads: number; sales: number }[],
    status: "loading"
  });

  useEffect(() => {
    fetch(`/api/facebook/spend?company_id=${selectedCompany.id}&period=${period}`)
      .then(res => res.json())
      .then(d => setFbAds(d))
      .catch(() => {});

    fetch(`/api/leads?company_id=${selectedCompany.id}&period=${period}`)
      .then(res => res.json())
      .then(d => setRealLeads(d))
      .catch(() => {});

    fetch(`/api/amocrm/stats?company_id=${selectedCompany.id}&period=${period}`)
      .then(res => res.json())
      .then(d => setAmoStats(d))
      .catch(() => {});
  }, [selectedCompany.id, period]);

  // AmoCRM display stats configuration
  const displayStats = [
    { title: "Jami Leadlar", value: amoStats.total_leads.toString(), change: "0%", trend: "up", icon: Users, color: "#0071e3" },
    { title: "Sifatli Leadlar", value: amoStats.qualified_leads.toString(), change: "0%", trend: "up", icon: Target, color: "#bf5af2" },
    { title: "Sifatli Konversiya", value: amoStats.total_leads > 0 ? Math.round((amoStats.qualified_leads / amoStats.total_leads) * 100) + "%" : "0%", change: "0%", trend: "up", icon: TrendingUp, color: "#34c759" },
    { title: "Uchrashuv (Visit)", value: amoStats.visits.toString(), change: "0%", trend: "up", icon: TrendingUp, color: "#ff9f0a" },
    { title: "Sotuvlar", value: amoStats.sales_amount > 1000000 ? (amoStats.sales_amount / 1000000).toFixed(1) + "M" : amoStats.sales_amount.toLocaleString() + " UzS", change: "0%", trend: "up", icon: DollarSign, color: "#30d158" }
  ];

  const newLeadsCount = realLeads.filter(l => l.status === "Yangi").length;

  return (
    <div className="space-y-8 animate-in">
      <section className="flex items-end justify-between">
        <div>
          <h1 className="text-[32px] font-semibold text-white tracking-tight">
            {isAll ? "CRM Live" : `${selectedCompany.name} CRM`}
          </h1>
          <p className="text-[15px] text-[var(--muted-foreground)] mt-1">
            {isAll ? "Real-time leadlar va sotuvlar monitoring." : `${selectedCompany.name} — real-time monitoring.`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white/[0.04] p-1 rounded-lg">
            {[ 
              { id: "daily", label: "Bugun" }, 
              { id: "weekly", label: "Hafta" }, 
              { id: "monthly", label: "Oy" }, 
              { id: "yearly", label: "Yil" } 
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={cn(
                  "px-3 py-1.5 text-[12px] font-medium rounded-md transition-all", 
                  period === p.id ? "bg-[var(--accent-blue)] text-white shadow-sm" : "text-[var(--muted-foreground)] hover:text-white"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-green)] animate-pulse" />
            <span className="text-[12px] font-medium text-[var(--accent-green)]">Live</span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {displayStats.map((stat, i) => (
          <div key={i} className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-[12px] flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                <stat.icon className="w-[18px] h-[18px]" style={{ color: stat.color }} />
              </div>
              <div className={cn(
                "flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-md",
                stat.trend === "up" ? "text-[var(--accent-green)] bg-[var(--accent-green)]/10" : "text-[var(--accent-red)] bg-[var(--accent-red)]/10"
              )}>
                {stat.trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <div className="text-[28px] font-semibold text-white tracking-tight leading-none">{stat.value}</div>
            <div className="text-[12px] text-[var(--muted-foreground)] mt-1 font-medium">{stat.title}</div>
          </div>
        ))}

        {/* FB ADS WIDGET */}
        <div className="glass-card p-5 group hover:bg-white/[0.04] transition-colors relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-[#1877F2]/15">
              <svg className="w-[18px] h-[18px] text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </div>
            <div className={cn(
              "text-[11px] font-semibold px-2 py-0.5 rounded-md",
              fbAds.status === "connected" ? "text-[#1877F2] bg-[#1877F2]/10" : "text-[var(--muted-foreground)] bg-white/5"
            )}>
              {fbAds.status === "connected" ? "Meta Ads" : "Ulanmagan"}
            </div>
          </div>
          <div className="text-[28px] font-semibold text-white tracking-tight leading-none">${fbAds.spend.toFixed(2)}</div>
          <div className="text-[12px] text-[var(--muted-foreground)] mt-1 font-medium">Reklama Xarajati (Sarf)</div>
          {fbAds.status === "connected" && (
            <div className="mt-3.5 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-[var(--muted-foreground)] uppercase tracking-wider font-semibold">
              <span>CPL: ${fbAds.spend > 0 ? (fbAds.spend / Math.max(1, newLeadsCount)).toFixed(2) : "0.00"}</span>
              <span>CPC: ${fbAds.cpc.toFixed(2)}</span>
            </div>
          )}
        </div>
      </section>

      <div className="grid lg:grid-cols-5 gap-6">
        <section className="lg:col-span-3 glass-card p-6">
          <h2 className="text-[17px] font-semibold text-white mb-6">Leadlar va Sotuvlar Oqimi</h2>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={amoStats.chart.length > 0 ? amoStats.chart : [{ name: "Ma'lumot yo'q", leads: 0, sales: 0 }]}>
                <defs>
                  <linearGradient id="leadGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0071e3" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#0071e3" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="salesGrad2" x1="0" y1="0" x2="0" y2="1">
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
                <Area type="monotone" dataKey="leads" stroke="#0071e3" strokeWidth={2} fillOpacity={1} fill="url(#leadGrad2)" name="Leadlar" />
                <Area type="monotone" dataKey="sales" stroke="#30d158" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad2)" name="Sotuvlar" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="lg:col-span-2 glass-card p-6">
          <h2 className="text-[17px] font-semibold text-white mb-6">So'nggi Leadlar</h2>
          <div className="space-y-1">
            {realLeads.length > 0 ? realLeads.map((lead, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-[14px] hover:bg-white/[0.04] transition-colors cursor-pointer group">
                <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center text-[12px] font-semibold text-white shrink-0">
                  {lead.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-white truncate">{lead.name}</div>
                  <div className="text-[11px] text-[var(--muted-foreground)] flex items-center gap-2">
                    {lead.source} 
                    <span className="opacity-50">•</span> 
                    {new Date(lead.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
                <span className="tag" style={{ color: statusStyles[lead.status]?.color, backgroundColor: `color-mix(in srgb, ${statusStyles[lead.status]?.color} 12%, transparent)` }}>
                  {statusStyles[lead.status]?.label}
                </span>
              </div>
            )) : (
               <div className="text-[13px] text-[var(--muted-foreground)] text-center py-10 opacity-60">
                 Hali hech qanday mijoz murojaati mavjud emas. <br/>
                 Integratsiyalangan qabulxonadan kutilyapti...
               </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
