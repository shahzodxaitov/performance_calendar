"use client";

import { Search, Bell, ChevronDown, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCompany } from "@/context/CompanyContext";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Header() {
  const { user, role } = useAuth();
  const { companies, selectedCompany, setSelectedCompany } = useCompany();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="h-[56px] flex items-center justify-between px-8 border-b border-white/[0.06] bg-black/30 backdrop-blur-2xl sticky top-0 z-30 shrink-0">
      {/* Left: Project Selector + Search */}
      <div className="flex items-center gap-4">
        {/* Project Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className={cn(
              "flex items-center gap-2 h-[34px] px-3.5 rounded-[10px] border transition-all text-[13px] font-medium",
              open
                ? "bg-white/[0.1] border-[var(--accent-blue)]/40 text-white"
                : "bg-white/[0.04] border-white/[0.06] text-[var(--muted-foreground)] hover:text-white hover:bg-white/[0.06]"
            )}
          >
            {selectedCompany.id !== "all" && (
              <span className="w-5 h-5 rounded-md bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)] flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                {selectedCompany.name.substring(0, 1)}
              </span>
            )}
            <span className="max-w-[140px] truncate">{selectedCompany.name}</span>
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
          </button>

          {open && (
            <div className="absolute top-[calc(100%+6px)] left-0 w-[220px] py-1.5 rounded-[14px] bg-[#1c1c1e]/95 backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/50 z-50 animate-in">
              {companies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => { setSelectedCompany(company); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-medium transition-colors",
                    selectedCompany.id === company.id
                      ? "text-white bg-white/[0.06]"
                      : "text-[var(--muted-foreground)] hover:text-white hover:bg-white/[0.04]"
                  )}
                >
                  {company.id === "all" ? (
                    <span className="w-5 h-5 rounded-md bg-white/[0.08] flex items-center justify-center text-[10px]">✦</span>
                  ) : (
                    <span className="w-5 h-5 rounded-md bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)] flex items-center justify-center text-[9px] font-bold text-white">
                      {company.name.substring(0, 1)}
                    </span>
                  )}
                  <span className="flex-1 text-left truncate">{company.name}</span>
                  {selectedCompany.id === company.id && <Check className="w-3.5 h-3.5 text-[var(--accent-blue)]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-[280px] w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
          <input
            placeholder="Qidiruv..."
            className="w-full h-[34px] pl-9 pr-4 rounded-lg bg-white/[0.06] border border-white/[0.06] text-[13px] text-white placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/40 focus:border-[var(--accent-blue)]/40 transition-all"
          />
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setNotifOpen(!notifOpen)}
            className={cn(
               "relative p-2 rounded-lg transition-colors",
               notifOpen ? "bg-white/[0.1] text-white" : "hover:bg-white/[0.06] text-[var(--muted-foreground)] hover:text-white"
            )}
          >
            <Bell className="w-[18px] h-[18px]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--accent-red)] rounded-full border-2 border-black" />
          </button>

          {notifOpen && (
            <div className="absolute top-[calc(100%+6px)] right-0 w-[320px] rounded-[16px] bg-[#1c1c1e]/95 backdrop-blur-3xl border border-white/[0.08] shadow-2xl shadow-black/60 z-50 animate-in overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <h3 className="text-[13px] font-semibold text-white">Xabarnomalar</h3>
                <span className="text-[10px] font-medium bg-[var(--accent-blue)] text-white px-2 py-0.5 rounded-full">1 Yangi</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                <div className="p-3 hover:bg-white/[0.02] transition-colors border-b border-white/[0.04] cursor-pointer relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[var(--accent-blue)] rounded-r-full"></div>
                  <div className="pl-3">
                    <p className="text-[12px] font-medium text-white mb-1"><span className="text-[var(--accent-blue)]">Sunnat Umra</span> dan yangi lead!</p>
                    <p className="text-[11px] text-[#86868b] line-clamp-1">Anvar Aliyev (Instagram DM) orqali yozdi.</p>
                    <p className="text-[10px] text-[#48484a] mt-2">Hozirgina</p>
                  </div>
                </div>
                
                <div className="p-3 hover:bg-white/[0.02] transition-colors cursor-pointer opacity-70">
                  <div className="pl-3">
                    <p className="text-[12px] font-medium text-white mb-1">✅ Vazifa yakunlandi</p>
                    <p className="text-[11px] text-[#86868b] line-clamp-1">"Umra Paket Video" vazifasi muvaffaqiyatli topshirildi.</p>
                    <p className="text-[10px] text-[#48484a] mt-2">2 soat oldin</p>
                  </div>
                </div>
              </div>
              <div className="p-2 border-t border-white/[0.06] text-center filter bg-black/20">
                <button className="text-[11px] font-medium text-[var(--accent-blue)] hover:text-white transition-colors">
                  Barchasini o'qilgan deb belgilash
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-white/[0.06]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)] flex items-center justify-center text-[11px] font-bold text-white shadow-md">
            {user?.user_metadata?.full_name?.substring(0, 2).toUpperCase() || "PG"}
          </div>
          <div className="hidden md:block">
            <div className="text-[13px] font-medium text-white leading-tight">
              {user?.user_metadata?.full_name || "Agent"}
            </div>
            <div className="text-[11px] text-[var(--muted-foreground)] leading-tight capitalize">
              {role || "Admin"}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
