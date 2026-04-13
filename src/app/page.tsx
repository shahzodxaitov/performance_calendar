"use client";

import { useAuth } from "@/context/AuthContext";
import { useCompany } from "@/context/CompanyContext";
import { CheckCircle2, Clock, AlertCircle, TrendingUp, ArrowUpRight, ArrowRight, BarChart3 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const companyData: Record<string, {
  stats: { label: string; value: string; change: string; icon: any; color: string; bg: string }[];
  crm: { leads: string; leads_ch: string; sales: string; sales_ch: string; topSource: string; topPct: string };
  tasks: { title: string; time: string; color: string }[];
}> = {
  all: {
    stats: [
      { label: "Bajarildi", value: "0", change: "0", icon: CheckCircle2, color: "text-[var(--accent-green)]", bg: "bg-[var(--accent-green)]/10" },
      { label: "Jarayonda", value: "0", change: "0 bugun", icon: Clock, color: "text-[var(--accent-blue)]", bg: "bg-[var(--accent-blue)]/10" },
      { label: "Kechikkan", value: "0", change: "zo'r!", icon: AlertCircle, color: "text-[var(--accent-orange)]", bg: "bg-[var(--accent-orange)]/10" },
      { label: "Konversiya", value: "0%", change: "0%", icon: BarChart3, color: "text-[var(--accent-purple)]", bg: "bg-[var(--accent-purple)]/10" },
    ],
    crm: { leads: "0", leads_ch: "0%", sales: "0 UzS", sales_ch: "0%", topSource: "—", topPct: "0% ulush" },
    tasks: [],
  },
  c1: {
    stats: [
      { label: "Bajarildi", value: "0", change: "0", icon: CheckCircle2, color: "text-[var(--accent-green)]", bg: "bg-[var(--accent-green)]/10" },
      { label: "Jarayonda", value: "0", change: "0 bugun", icon: Clock, color: "text-[var(--accent-blue)]", bg: "bg-[var(--accent-blue)]/10" },
      { label: "Kechikkan", value: "0", change: "zo'r!", icon: AlertCircle, color: "text-[var(--accent-orange)]", bg: "bg-[var(--accent-orange)]/10" },
      { label: "Konversiya", value: "0%", change: "0%", icon: BarChart3, color: "text-[var(--accent-purple)]", bg: "bg-[var(--accent-purple)]/10" },
    ],
    crm: { leads: "0", leads_ch: "0%", sales: "0 UzS", sales_ch: "0%", topSource: "—", topPct: "0% ulush" },
    tasks: [],
  },
  c2: {
    stats: [
      { label: "Bajarildi", value: "0", change: "0", icon: CheckCircle2, color: "text-[var(--accent-green)]", bg: "bg-[var(--accent-green)]/10" },
      { label: "Jarayonda", value: "0", change: "0 bugun", icon: Clock, color: "text-[var(--accent-blue)]", bg: "bg-[var(--accent-blue)]/10" },
      { label: "Kechikkan", value: "0", change: "zo'r!", icon: AlertCircle, color: "text-[var(--accent-orange)]", bg: "bg-[var(--accent-orange)]/10" },
      { label: "Konversiya", value: "0%", change: "0%", icon: BarChart3, color: "text-[var(--accent-purple)]", bg: "bg-[var(--accent-purple)]/10" },
    ],
    crm: { leads: "0", leads_ch: "0%", sales: "0 UzS", sales_ch: "0%", topSource: "—", topPct: "0% ulush" },
    tasks: [],
  },
  c3: {
    stats: [
      { label: "Bajarildi", value: "0", change: "0", icon: CheckCircle2, color: "text-[var(--accent-green)]", bg: "bg-[var(--accent-green)]/10" },
      { label: "Jarayonda", value: "0", change: "0 bugun", icon: Clock, color: "text-[var(--accent-blue)]", bg: "bg-[var(--accent-blue)]/10" },
      { label: "Kechikkan", value: "0", change: "zo'r!", icon: AlertCircle, color: "text-[var(--accent-orange)]", bg: "bg-[var(--accent-orange)]/10" },
      { label: "Konversiya", value: "0%", change: "0%", icon: BarChart3, color: "text-[var(--accent-purple)]", bg: "bg-[var(--accent-purple)]/10" },
    ],
    crm: { leads: "0", leads_ch: "0%", sales: "0 UzS", sales_ch: "0%", topSource: "—", topPct: "0% ulush" },
    tasks: [],
  },
};

export default function DashboardPage() {
  const { role } = useAuth();
  const { selectedCompany, isAll } = useCompany();
  const data = companyData[selectedCompany.id] || companyData.all;

  return (
    <div className="space-y-6 animate-in">
      <section>
        <h1 className="text-[24px] md:text-[32px] font-semibold text-white tracking-tight leading-tight">
          {isAll ? "Xush kelibsiz 👋" : selectedCompany.name}
        </h1>
        <p className="text-[13px] md:text-[15px] text-[var(--muted-foreground)] mt-1">
          {isAll ? "Bugungi agentlik faoliyati qisqacha." : `${selectedCompany.name} loyihasi bo'yicha qisqacha.`}
        </p>
      </section>

      <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        {data.stats.map((stat, i) => (
          <div key={i} className="glass-card p-4 md:p-5 flex flex-col gap-3 md:gap-4">
            <div className="flex items-center justify-between">
              <div className={cn("w-9 h-9 md:w-10 md:h-10 rounded-[12px] flex items-center justify-center", stat.bg)}>
                <stat.icon className={cn("w-[18px] h-[18px]", stat.color)} />
              </div>
              <span className="text-[12px] font-medium text-[var(--accent-green)]">{stat.change}</span>
            </div>
            <div>
              <div className="text-[28px] font-semibold text-white tracking-tight leading-none">{stat.value}</div>
              <div className="text-[12px] text-[var(--muted-foreground)] mt-1 font-medium">{stat.label}</div>
            </div>
          </div>
        ))}
      </section>

      <div className="grid lg:grid-cols-5 gap-6">
        {(role === "admin" || role === "manager") && (
          <section className="lg:col-span-3 glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[17px] font-semibold text-white">CRM Monitoring</h2>
                <p className="text-[12px] text-[var(--muted-foreground)] mt-0.5">
                  {isAll ? "Real-time lead va sotuvlar" : `${selectedCompany.name} — real-time`}
                </p>
              </div>
              <Link href="/crm" className="btn-secondary text-[12px] py-2 px-4">
                Batafsil <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.04] p-4">
                <div className="text-[11px] text-[var(--muted-foreground)] font-medium mb-2">Jami Leadlar</div>
                <div className="text-[24px] font-semibold text-white tracking-tight">{data.crm.leads}</div>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3 text-[var(--accent-green)]" />
                  <span className="text-[11px] font-medium text-[var(--accent-green)]">{data.crm.leads_ch}</span>
                </div>
              </div>
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.04] p-4">
                <div className="text-[11px] text-[var(--muted-foreground)] font-medium mb-2">Sotuvlar</div>
                <div className="text-[24px] font-semibold text-white tracking-tight">{data.crm.sales}</div>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3 text-[var(--accent-green)]" />
                  <span className="text-[11px] font-medium text-[var(--accent-green)]">{data.crm.sales_ch}</span>
                </div>
              </div>
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.04] p-4">
                <div className="text-[11px] text-[var(--muted-foreground)] font-medium mb-2">Top Manba</div>
                <div className="text-[24px] font-semibold text-white tracking-tight">{data.crm.topSource}</div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[11px] font-medium text-[var(--muted-foreground)]">{data.crm.topPct}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className={cn("glass-card p-6", role === "admin" || role === "manager" ? "lg:col-span-2" : "lg:col-span-5")}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[17px] font-semibold text-white">Eng Muhim</h2>
              <p className="text-[12px] text-[var(--muted-foreground)] mt-0.5">Yaqinlashayotgan ishlar</p>
            </div>
            <Link href="/tasks" className="btn-secondary text-[12px] py-2 px-4">Hammasi</Link>
          </div>
          <div className="space-y-2">
            {data.tasks.length > 0 ? data.tasks.map((task, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-[14px] hover:bg-white/[0.04] transition-colors cursor-pointer group">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: task.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-white truncate group-hover:text-[var(--accent-blue)] transition-colors">{task.title}</div>
                </div>
                <div className="text-[11px] text-[var(--muted-foreground)] font-medium shrink-0">{task.time}</div>
              </div>
            )) : (
              <div className="text-[12px] text-center text-[var(--muted-foreground)] py-8 border border-dashed border-white/10 rounded-xl">
                Yaqin orada bajarilishi kerak bo'lgan ishlar yo'q
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
