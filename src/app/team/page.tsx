"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { Plus, CheckCircle2, XCircle, Trash2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  full_name: string;
  role: string;
  chat_id: string | null;
  avatar_color: string;
}

export default function TeamPage() {
  const { role } = useAuth();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  // New member form
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("editor");
  const [addingLoading, setAddingLoading] = useState(false);

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/team?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (data.team) setTeam(data.team);
    } catch {
      setTeam([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    setAddingLoading(true);
    try {
      await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: newName, role: newRole }),
      });
      setNewName("");
      setIsAdding(false);
      fetchTeam();
    } catch {
      alert("Xatolik");
    }
    setAddingLoading(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`${name}ni jamoatdan o'chirishni xohlaysizmi?`)) return;
    try {
      await fetch(`/api/team?id=${id}`, { method: "DELETE" });
      fetchTeam();
    } catch {
      alert("Xatolik");
    }
  };

  const handleUpdateChatId = async (id: string, current: string | null) => {
    const newId = prompt("Foydalanuvchining Telegram Chat ID raqamini kiriting:\n(Buni ular botga /start deb yozganda bilib olishadi)", current || "");
    if (newId !== null && newId.trim() !== current) {
      try {
        await fetch("/api/team", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, chat_id: newId.trim() }),
        });
        fetchTeam();
      } catch {
        alert("Xatolik");
      }
    }
  };

  function getInitials(name: string) {
    return name.split(" ").map(w => w[0]).join("").toUpperCase().substring(0, 2);
  }

  return (
    <div className="space-y-8 animate-in max-w-5xl">
      {/* Header */}
      <section className="flex items-end justify-between">
        <div>
          <h1 className="text-[32px] font-semibold text-white tracking-tight">Jamoa</h1>
          <p className="text-[15px] text-[var(--muted-foreground)] mt-1">
            Platformaga ulanish va vazifalar taqsimoti
          </p>
        </div>
        {role === "admin" && (
          <button onClick={() => setIsAdding(!isAdding)} className="btn-primary">
            <Plus className="w-4 h-4" /> Yangi a'zo
          </button>
        )}
      </section>

      {/* Add Form */}
      {isAdding && (
        <section className="glass-card p-6 animate-in slide-in-from-top-4">
          <h3 className="text-[15px] font-semibold text-white mb-4">Yangi a'zo qo'shish</h3>
          <form onSubmit={handleAdd} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5 block">To'liq ism</label>
              <input
                required value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Masalan: Sardor Rustamov"
                className="w-full h-[42px] rounded-[12px] bg-white/[0.04] border border-white/[0.08] px-4 text-[13px] text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/40 transition-all"
              />
            </div>
            <div className="w-[200px]">
              <label className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5 block">Rol</label>
              <select
                value={newRole} onChange={e => setNewRole(e.target.value)}
                className="w-full h-[42px] rounded-[12px] bg-white/[0.04] border border-white/[0.08] px-4 text-[13px] text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/40 transition-all"
              >
                <option value="editor">Xodim (Editor)</option>
                <option value="manager">Menejer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" disabled={addingLoading} className="h-[42px] px-6 rounded-[12px] bg-[var(--accent-green)] hover:bg-[var(--accent-green)]/80 text-white text-[13px] font-semibold transition-all">
              {addingLoading ? "Qo'shilmoqda..." : "Saqlash"}
            </button>
          </form>
        </section>
      )}

      {/* Table */}
      <section className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">A'zo</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Rol</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Telegram Aloqasi</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-5 py-12 text-center text-[13px] text-[var(--muted-foreground)]">Yuklanmoqda...</td></tr>
            ) : team.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-16 text-center text-[var(--muted-foreground)]">Jamoa a'zolari yo'q</td></tr>
            ) : team.map((member) => (
              <tr key={member.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase" style={{ backgroundColor: member.avatar_color }}>
                      {getInitials(member.full_name)}
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-white">{member.full_name}</div>
                      <div className="text-[11px] text-[var(--muted-foreground)]">ID: {member.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-white/[0.06] text-white capitalize">{member.role}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    {member.chat_id ? (
                      <span className="flex items-center gap-1.5 text-[12px] text-[var(--accent-green)]">
                        <CheckCircle2 className="w-4 h-4" /> Ulangan ({member.chat_id})
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[12px] text-[var(--muted-foreground)]">
                        <XCircle className="w-4 h-4 text-white/20" /> Yo'q
                      </span>
                    )}
                    {role === "admin" && (
                      <button onClick={() => handleUpdateChatId(member.id, member.chat_id)} className="text-[11px] text-[var(--accent-blue)] hover:underline ml-2">
                        Tahrirlash
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  {role === "admin" && (
                    <button onClick={() => handleDelete(member.id, member.full_name)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--muted-foreground)] hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
