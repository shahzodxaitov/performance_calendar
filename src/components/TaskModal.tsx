"use client";

import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { useCompany } from "@/context/CompanyContext";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  full_name: string;
  role: string;
  chat_id: string | null;
  avatar_color: string;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
}

export function TaskModal({ isOpen, onClose, onTaskCreated }: TaskModalProps) {
  const { companies, selectedCompany, isAll } = useCompany();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [companyId, setCompanyId] = useState(isAll ? "c1" : selectedCompany.id);
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("normal");

  useEffect(() => {
    if (isOpen) {
      fetch(`/api/team?t=${Date.now()}`, { cache: "no-store" })
        .then(res => res.json())
        .then(data => {
          if (data.team) setTeamMembers(data.team);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedMember = teamMembers.find((m) => m.id === assigneeId);
  const selectedCompanyObj = companies.find((c) => c.id === companyId);

  function getInitials(name: string) {
    return name.split(" ").map(w => w[0]).join("").toUpperCase().substring(0, 2);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigneeId) { alert("Bajaruvchini tanlang!"); return; }
    setLoading(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          company_id: companyId,
          company_name: selectedCompanyObj?.name || "—",
          assignee_id: assigneeId,
          status,
          priority,
          due_date: dueDate,
          due_time: dueTime || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        onTaskCreated();
        onClose();
        setTitle(""); setDescription(""); setDueDate(""); setDueTime("");
        setAssigneeId(""); setStatus("todo"); setPriority("normal");
      } else {
        alert("Xatolik: " + (data.error || "Noma'lum"));
      }
    } catch (err) {
      alert("Tarmoq xatoligi");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-xl rounded-[20px] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <h2 className="text-[17px] font-semibold text-white">Yangi Vazifa</h2>
            <p className="text-[12px] text-[var(--muted-foreground)] mt-0.5">Jamoa a'zosiga vazifa berish</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/[0.06] text-[var(--muted-foreground)] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Title */}
          <div>
            <label className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5 block">Vazifa nomi</label>
            <input
              required value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Masalan: Instagram Reels montaj"
              className="w-full h-[42px] rounded-[12px] bg-white/[0.04] border border-white/[0.08] px-4 text-[13px] text-white placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/40 transition-all"
            />
          </div>

          {/* Company + Assignee */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5 block">Loyiha</label>
              <select
                value={companyId} onChange={(e) => setCompanyId(e.target.value)}
                className="w-full h-[42px] rounded-[12px] bg-white/[0.04] border border-white/[0.08] px-4 text-[13px] text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/40 transition-all"
              >
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5 block">Bajaruvchi</label>
              <select
                required value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full h-[42px] rounded-[12px] bg-white/[0.04] border border-white/[0.08] px-4 text-[13px] text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/40 transition-all"
              >
                <option value="">Tanlang...</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.full_name} ({m.role})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Deadline + Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5 block">Muddat</label>
              <input
                required type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-[42px] rounded-[12px] bg-white/[0.04] border border-white/[0.08] px-4 text-[13px] text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/40 transition-all [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5 block">Vaqt (ixtiyoriy)</label>
              <input
                type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)}
                className="w-full h-[42px] rounded-[12px] bg-white/[0.04] border border-white/[0.08] px-4 text-[13px] text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/40 transition-all [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Priority + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5 block">Muhimlik</label>
              <select
                value={priority} onChange={(e) => setPriority(e.target.value)}
                className="w-full h-[42px] rounded-[12px] bg-white/[0.04] border border-white/[0.08] px-4 text-[13px] text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/40 transition-all"
              >
                <option value="low">🟢 Past</option>
                <option value="normal">🟡 O'rta</option>
                <option value="high">🟠 Yuqori</option>
                <option value="urgent">🔴 Shoshilinch</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5 block">Status</label>
              <select
                value={status} onChange={(e) => setStatus(e.target.value)}
                className="w-full h-[42px] rounded-[12px] bg-white/[0.04] border border-white/[0.08] px-4 text-[13px] text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/40 transition-all"
              >
                <option value="todo">Kutishda</option>
                <option value="in_progress">Jarayonda</option>
                <option value="review">Tekshiruv</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5 block">Tavsif</label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Batafsil ma'lumot..."
              className="w-full h-24 rounded-[12px] bg-white/[0.04] border border-white/[0.08] p-4 text-[13px] text-white placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/40 transition-all resize-none"
            />
          </div>

          {/* Notification info */}
          {selectedMember && (
            <div className="flex items-center gap-2 p-3 rounded-[12px] bg-[var(--accent-blue)]/5 border border-[var(--accent-blue)]/10">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: selectedMember.avatar_color }}>
                {getInitials(selectedMember.full_name)}
              </div>
              <div className="flex-1">
                <div className="text-[12px] font-medium text-white">{selectedMember.full_name}</div>
                <div className="text-[10px] text-[var(--muted-foreground)]">
                  {selectedMember.chat_id ? "📨 Telegram orqali xabar yuboriladi" : "⚠️ Telegram ulanmagan"}
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 h-[42px] rounded-[12px] border border-white/[0.08] text-[13px] font-medium text-[var(--muted-foreground)] hover:text-white hover:bg-white/[0.04] transition-all">
              Bekor qilish
            </button>
            <button type="submit" disabled={loading}
              className="flex-[2] h-[42px] rounded-[12px] bg-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/80 text-[13px] font-semibold text-white transition-all flex items-center justify-center gap-2">
              {loading ? "Saqlanmoqda..." : <><Save className="w-4 h-4" /> Vazifa berish</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
