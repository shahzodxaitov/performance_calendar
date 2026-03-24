"use client";

import { useAuth } from "@/context/AuthContext";
import { useCompany } from "@/context/CompanyContext";
import { useState } from "react";
import { Plus, Trash2, Link } from "lucide-react";

export default function ProjectsPage() {
  const { role } = useAuth();
  const { companies, refreshCompanies } = useCompany();
  
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);

  // Filter out the 'all' option from Context
  const projectList = companies.filter(c => c.id !== "all");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    setLoading(true);
    try {
      await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      setNewName("");
      setIsAdding(false);
      refreshCompanies();
    } catch {
      alert("Xatolik");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`${name} loyihasini o'chirishni xohlaysizmi? Bu unga bog'liq statistikaga ta'sir qilmasligi mumkin, lekin ro'yxatdan olib tashlanadi.`)) return;
    try {
      await fetch(`/api/companies?id=${id}`, { method: "DELETE" });
      refreshCompanies();
    } catch {
      alert("Xatolik");
    }
  };

  return (
    <div className="space-y-8 animate-in max-w-4xl pb-16">
      {/* Header */}
      <section className="flex items-end justify-between">
        <div>
          <h1 className="text-[32px] font-semibold text-white tracking-tight">Kompaniya Loyihalari</h1>
          <p className="text-[15px] text-[var(--muted-foreground)] mt-1">
            Mijozlar va ularning loyihalarini boshqarish
          </p>
        </div>
        {role === "admin" && (
          <button onClick={() => setIsAdding(!isAdding)} className="btn-primary">
            <Plus className="w-4 h-4" /> Yangi loyiha
          </button>
        )}
      </section>

      {/* Add Form */}
      {isAdding && (
        <section className="glass-card p-6 animate-in slide-in-from-top-4">
          <h3 className="text-[15px] font-semibold text-white mb-4">Loyiha qo'shish</h3>
          <form onSubmit={handleAdd} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5 block">Loyiha Nomi</label>
              <input
                required value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Masalan: Milliy taomlar restorani"
                className="w-full h-[42px] rounded-[12px] bg-white/[0.04] border border-white/[0.08] px-4 text-[13px] text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/40 transition-all"
              />
            </div>
            <button type="submit" disabled={loading} className="h-[42px] px-6 rounded-[12px] bg-[var(--accent-green)] hover:bg-[var(--accent-green)]/80 text-white text-[13px] font-semibold transition-all">
              {loading ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </form>
        </section>
      )}

      {/* List */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projectList.length === 0 ? (
          <div className="col-span-full py-16 text-center text-[var(--muted-foreground)]"> Loyihalar yo'q </div>
        ) : projectList.map(project => (
          <div key={project.id} className="glass-card p-5 group transition-all hover:bg-white/[0.04]">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg">
                  {project.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-white">{project.name}</h3>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/client/${project.token}`;
                      navigator.clipboard.writeText(url);
                      alert("Link nusxalandi:\n" + url);
                    }}
                    className="flex items-center gap-1.5 text-[11px] text-[var(--accent-blue)] hover:text-white mt-1 transition-colors"
                  >
                    <Link className="w-3 h-3" /> Mijoz linkini nusxalash
                  </button>
                </div>
              </div>
              {role === "admin" && (
                <button onClick={() => handleDelete(project.id, project.name)} className="p-2 rounded-lg text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="pt-4 border-t border-white/[0.06] space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1 block">Facebook Ad ID</label>
                  <input
                     placeholder="act_123456789"
                     defaultValue={project.fb_ad_account_id || ""}
                     disabled={role !== "admin"}
                     onBlur={async (e) => {
                       const val = e.target.value;
                       if (val === project.fb_ad_account_id) return;
                       await fetch("/api/companies", {
                         method: "PATCH",
                         headers: { "Content-Type": "application/json" },
                         body: JSON.stringify({ id: project.id, fb_ad_account_id: val }),
                       });
                       refreshCompanies();
                     }}
                     className="w-full h-[36px] rounded-[10px] bg-white/[0.04] border border-white/[0.08] px-3 text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/40 transition-all font-mono disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1 block">Facebook Token</label>
                  <input
                     placeholder="EAAI..."
                     defaultValue={project.fb_access_token || ""}
                     disabled={role !== "admin"}
                     onBlur={async (e) => {
                       const val = e.target.value;
                       if (val === project.fb_access_token) return;
                       await fetch("/api/companies", {
                         method: "PATCH",
                         headers: { "Content-Type": "application/json" },
                         body: JSON.stringify({ id: project.id, fb_access_token: val }),
                       });
                       refreshCompanies();
                     }}
                     className="w-full h-[36px] rounded-[10px] bg-white/[0.04] border border-white/[0.08] px-3 text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/40 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1 block">AmoCRM Domen</label>
                  <input
                     placeholder="sunnatumra.amocrm.ru"
                     defaultValue={project.amocrm_domain || ""}
                     disabled={role !== "admin"}
                     onBlur={async (e) => {
                       const val = e.target.value;
                       if (val === project.amocrm_domain) return;
                       await fetch("/api/companies", {
                         method: "PATCH",
                         headers: { "Content-Type": "application/json" },
                         body: JSON.stringify({ id: project.id, amocrm_domain: val }),
                       });
                       refreshCompanies();
                     }}
                     className="w-full h-[36px] rounded-[10px] bg-white/[0.04] border border-white/[0.08] px-3 text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-orange)]/40 transition-all disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1 block">AmoCRM Token</label>
                  <input
                     placeholder="Integration ulash kaliti..."
                     defaultValue={project.amocrm_access_token || ""}
                     disabled={role !== "admin"}
                     onBlur={async (e) => {
                       const val = e.target.value;
                       if (val === project.amocrm_access_token) return;
                       await fetch("/api/companies", {
                         method: "PATCH",
                         headers: { "Content-Type": "application/json" },
                         body: JSON.stringify({ id: project.id, amocrm_access_token: val }),
                       });
                       refreshCompanies();
                     }}
                     className="w-full h-[36px] rounded-[10px] bg-white/[0.04] border border-white/[0.08] px-3 text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-orange)]/40 transition-all font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
