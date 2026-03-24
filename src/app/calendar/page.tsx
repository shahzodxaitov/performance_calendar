"use client";

import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompany } from "@/context/CompanyContext";
import { useAuth } from "@/context/AuthContext";
import { TaskModal } from "@/components/TaskModal";

const MONTHS_UZ = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];
const DAYS_UZ = ["Du", "Se", "Cho", "Pa", "Ju", "Sha", "Ya"];

const statusColors: Record<string, string> = {
  todo: "var(--muted-foreground)", // Grayish
  in_progress: "var(--accent-blue)", // Blue
  review: "var(--accent-orange)", // Orange
  done: "var(--accent-green)", // Green
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday start
}

interface LocalTask {
  id: string;
  title: string;
  assignee_name: string;
  status: "todo" | "in_progress" | "review" | "done";
  due_date: string;
}

export default function CalendarPage() {
  const { selectedCompany, isAll } = useCompany();
  const { role } = useAuth();
  
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [tasks, setTasks] = useState<LocalTask[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks?company_id=${selectedCompany.id}`);
      const data = await res.json();
      if (data.tasks) setTasks(data.tasks);
    } catch {
      setTasks([]);
    }
  }, [selectedCompany.id]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  // Group tasks by due_date
  const eventsByDate = tasks.reduce((acc, task) => {
    if (!task.due_date) return acc;
    if (!acc[task.due_date]) acc[task.due_date] = [];
    acc[task.due_date].push({
      title: task.title,
      assignee: task.assignee_name,
      color: statusColors[task.status] || "var(--accent-blue)"
    });
    return acc;
  }, {} as Record<string, { title: string; assignee: string; color: string }[]>);

  return (
    <div className="space-y-8 animate-in">
      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onTaskCreated={fetchTasks} />

      {/* Header */}
      <section className="flex items-end justify-between">
        <div>
          <h1 className="text-[32px] font-semibold text-white tracking-tight">
            {isAll ? "Kalendar" : `${selectedCompany.name} Kalendari`}
          </h1>
          <p className="text-[15px] text-[var(--muted-foreground)] mt-1">Loyiha bo'yicha belgilangan ishlar sanasi.</p>
        </div>
        {(role === "admin" || role === "manager") && (
          <button onClick={() => setIsModalOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Yangi ish
          </button>
        )}
      </section>

      {/* Calendar Card */}
      <div className="glass-card overflow-hidden">
        {/* Month Nav */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <button onClick={prev} className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors">
            <ChevronLeft className="w-5 h-5 text-[var(--muted-foreground)]" />
          </button>
          <h2 className="text-[17px] font-semibold text-white">
            {MONTHS_UZ[month]} {year}
          </h2>
          <button onClick={next} className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors">
            <ChevronRight className="w-5 h-5 text-[var(--muted-foreground)]" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-white/[0.06]">
          {DAYS_UZ.map(d => (
            <div key={d} className="text-center py-3 text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="min-h-[140px] border-b border-r border-white/[0.03]" />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isToday = dateStr === todayStr;
            const events = eventsByDate[dateStr] || [];

            return (
              <div
                key={dateStr}
                className={cn(
                  "min-h-[140px] p-2 border-b border-r border-white/[0.03] hover:bg-white/[0.02] transition-colors flex flex-col group",
                  isToday && "bg-[var(--accent-blue)]/5"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-medium mb-2",
                  isToday ? "bg-[var(--accent-blue)] text-white" : "text-[var(--muted-foreground)] group-hover:text-white"
                )}>
                  {day}
                </div>
                <div className="space-y-1.5 flex-1 max-h-[100px] overflow-y-auto no-scrollbar">
                  {events.map((ev, j) => (
                    <div
                      key={j}
                      className="px-2 py-1.5 rounded-[6px] border border-white/[0.05]"
                      style={{ backgroundColor: `color-mix(in srgb, ${ev.color} 10%, transparent)` }}
                    >
                      <div className="text-[11px] font-semibold text-white truncate">{ev.title}</div>
                      <div className="text-[10px] opacity-80 mt-0.5 truncate" style={{ color: ev.color }}>
                        {ev.assignee}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
