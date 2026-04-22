"use client";

import { useAuth } from "@/context/AuthContext";
import { useCompany } from "@/context/CompanyContext";
import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Clock, AlertCircle, CheckCircle2, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskModal } from "@/components/TaskModal";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  todo: { label: "Kutishda", color: "var(--muted-foreground)", icon: Clock },
  in_progress: { label: "Jarayonda", color: "var(--accent-blue)", icon: Clock },
  review: { label: "Tekshiruv", color: "var(--accent-orange)", icon: AlertCircle },
  done: { label: "Bajarildi", color: "var(--accent-green)", icon: CheckCircle2 },
};

const priorityLabel: Record<string, string> = {
  low: "🟢", normal: "🟡", high: "🟠", urgent: "🔴",
};

interface LocalTask {
  id: string;
  title: string;
  description?: string;
  company_id: string;
  company_name: string;
  assignee_id: string;
  assignee_name: string;
  status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "normal" | "high" | "urgent";
  due_date: string;
  due_time?: string;
}

export default function TasksPage() {
  const { role } = useAuth();
  const { selectedCompany, isAll } = useCompany();
  const [tasks, setTasks] = useState<LocalTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks?company_id=${selectedCompany.id}&t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (data.tasks) setTasks(data.tasks);
    } catch {
      setTasks([]);
    }
    setLoading(false);
  }, [selectedCompany.id]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  function getInitials(name: string) {
    if (!name) return "?";
    return name.split(" ").map(w => w[0]).join("").toUpperCase().substring(0, 2);
  }

  // ⚡ Bolt: Hoist search query transformation out of the filter loop.
  // Reduces O(N) string transformations during high-frequency filtering.
  const filtered = search
    ? (() => {
        const query = search.toLowerCase();
        return tasks.filter((t) =>
          t.title.toLowerCase().includes(query) ||
          t.assignee_name.toLowerCase().includes(query)
        );
      })()
    : tasks;

  return (
    <div className="space-y-8 animate-in">
      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onTaskCreated={fetchTasks} />

      {/* Header */}
      <section className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] md:text-[32px] font-semibold text-white tracking-tight">
            {isAll ? "Ishlar" : `${selectedCompany.name} Ishlari`}
          </h1>
          <p className="text-[13px] md:text-[15px] text-[var(--muted-foreground)] mt-1">
            {filtered.length} ta vazifa{!isAll && ` · ${selectedCompany.name}`}
          </p>
        </div>
        {(role === "admin" || role === "manager") && (
          <button onClick={() => setIsModalOpen(true)} className="btn-primary shrink-0">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Yangi vazifa</span><span className="sm:hidden">Yangi</span>
          </button>
        )}
      </section>

      {/* Search */}
      <section className="flex items-center gap-3">
        <div className="relative flex-1 max-w-[400px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Vazifa yoki bajaruvchi qidiruv..."
            className="w-full h-[38px] pl-9 pr-4 rounded-[10px] bg-white/[0.04] border border-white/[0.06] text-[13px] text-white placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/40 transition-all"
          />
        </div>
      </section>

      {/* Mobile Card List */}
      <section className="md:hidden space-y-3">
        {loading ? (
          <div className="glass-card p-8 text-center text-[13px] text-[var(--muted-foreground)]">Yuklanmoqda...</div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <div className="text-[36px] mb-3">📋</div>
            <div className="text-[14px] font-medium text-white mb-1">Vazifalar topilmadi</div>
          </div>
        ) : filtered.map((task) => {
          const sc = statusConfig[task.status] || statusConfig.todo;
          const Icon = sc.icon;
          return (
            <div key={task.id} className="glass-card p-4 space-y-3">
              <div className="flex items-start gap-2 justify-between">
                <div className="flex items-start gap-2 min-w-0">
                  <span className="text-[13px] mt-0.5 shrink-0">{priorityLabel[task.priority] || "🟡"}</span>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-white">{task.title}</div>
                    {task.description && <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5 line-clamp-1">{task.description}</div>}
                  </div>
                </div>
                <span className="tag shrink-0" style={{ color: sc.color, backgroundColor: `color-mix(in srgb, ${sc.color} 12%, transparent)` }}>
                  <Icon className="w-3 h-3" /> {sc.label}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white/[0.08] flex items-center justify-center text-[9px] font-semibold text-white shrink-0">{getInitials(task.assignee_name)}</div>
                  <span className="text-[12px] text-[var(--muted-foreground)]">{task.assignee_name}</span>
                </div>
                <div className="text-[11px] text-[var(--muted-foreground)]">{task.due_date}{task.due_time && ` · ${task.due_time}`}</div>
              </div>
              {!isAll && <div className="text-[11px] text-[var(--accent-blue)]">{task.company_name}</div>}
            </div>
          );
        })}
      </section>

      {/* Desktop Table */}
      <section className="hidden md:block glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Vazifa</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Loyiha</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Bajaruvchi</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Muhlat</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-[13px] text-[var(--muted-foreground)]">Yuklanmoqda...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center">
                  <div className="text-[var(--muted-foreground)]">
                    <div className="text-[40px] mb-3">📋</div>
                    <div className="text-[15px] font-medium text-white mb-1">Vazifalar topilmadi</div>
                    <div className="text-[13px]">Yangi vazifa qo'shish uchun yuqoridagi tugmani bosing.</div>
                  </div>
                </td>
              </tr>
            ) : filtered.map((task) => {
              const sc = statusConfig[task.status] || statusConfig.todo;
              const Icon = sc.icon;
              return (
                <tr key={task.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px]">{priorityLabel[task.priority] || "🟡"}</span>
                      <div>
                        <div className="text-[13px] font-medium text-white group-hover:text-[var(--accent-blue)] transition-colors">{task.title}</div>
                        {task.description && <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5 max-w-xs truncate">{task.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[13px] text-[var(--muted-foreground)]">{task.company_name || "—"}</td>
                  <td className="px-5 py-4">
                    <span className="tag" style={{ color: sc.color, backgroundColor: `color-mix(in srgb, ${sc.color} 12%, transparent)` }}>
                      <Icon className="w-3 h-3" /> {sc.label}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white/[0.08] flex items-center justify-center text-[9px] font-semibold text-white">
                        {getInitials(task.assignee_name)}
                      </div>
                      <span className="text-[13px] text-[var(--muted-foreground)]">{task.assignee_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-[13px] text-[var(--muted-foreground)]">{task.due_date}</div>
                    {task.due_time && <div className="text-[10px] text-[var(--muted-foreground)]/60">{task.due_time}</div>}
                  </td>
                  <td className="px-5 py-4">
                    {(role === "admin" || role === "manager") && (
                      <button className="p-1.5 rounded-lg hover:bg-white/[0.06] opacity-0 group-hover:opacity-100 transition-all">
                        <MoreHorizontal className="w-4 h-4 text-[var(--muted-foreground)]" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
