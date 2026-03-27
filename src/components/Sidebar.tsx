"use client";

import { useState } from "react";
import { LayoutDashboard, Calendar, ClipboardList, TrendingUp, Settings, LogOut, FileBarChart, Users, FolderKanban, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["admin", "manager", "editor", "client"] },
  { label: "CRM Live", href: "/crm", icon: TrendingUp, roles: ["admin", "manager", "editor"] },
  { label: "Hisobotlar", href: "/reports", icon: FileBarChart, roles: ["admin", "manager", "editor"] },
  { label: "Kalendar", href: "/calendar", icon: Calendar, roles: ["admin", "manager", "editor", "client"] },
  { label: "Ishlar", href: "/tasks", icon: ClipboardList, roles: ["admin", "manager", "editor", "client"] },
  { label: "Jamoa", href: "/team", icon: Users, roles: ["admin", "manager", "editor"] },
  { label: "Loyihalar", href: "/projects", icon: FolderKanban, roles: ["admin", "manager", "editor"] },
];

function NavContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { role, signOut } = useAuth();

  const filteredItems = navItems.filter(item => {
    if (!role) return false;
    return item.roles.includes(role);
  });

  return (
    <>
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-[var(--accent-blue)] flex items-center justify-center shrink-0">
            <span className="text-white text-[13px] font-bold tracking-tight">P</span>
          </div>
          <div>
            <div className="text-[14px] font-semibold text-white tracking-tight">Performance Agency</div>
            <div className="text-[11px] text-[var(--muted-foreground)]">Marketing Platform</div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-white hover:bg-white/[0.06] transition-all md:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        <div className="section-label px-3 pb-2 pt-2 text-[10px]">Asosiy</div>
        {filteredItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-[10px] rounded-[10px] transition-all duration-200 group relative",
                isActive
                  ? "bg-white/[0.08] text-white"
                  : "text-[var(--muted-foreground)] hover:text-white hover:bg-white/[0.04]"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[var(--accent-blue)] rounded-r-full" />
              )}
              <item.icon className={cn("w-[18px] h-[18px] shrink-0", isActive ? "text-[var(--accent-blue)]" : "group-hover:text-white/70")} />
              <span className="text-[13px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 space-y-0.5 border-t border-white/[0.06]">
        <Link
          href="/settings"
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 px-3 py-[10px] rounded-[10px] transition-all duration-200",
            pathname === "/settings"
              ? "bg-white/[0.08] text-white"
              : "text-[var(--muted-foreground)] hover:text-white hover:bg-white/[0.04]"
          )}
        >
          <Settings className="w-[18px] h-[18px]" />
          <span className="text-[13px] font-medium">Sozlamalar</span>
        </Link>
        <button
          onClick={() => { signOut(); onClose?.(); }}
          className="w-full flex items-center gap-3 px-3 py-[10px] rounded-[10px] text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10 transition-all duration-200"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span className="text-[13px] font-medium">Chiqish</span>
        </button>
      </div>
    </>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Hamburger trigger button (rendered in Header area - exported separately) */}
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-[280px] flex flex-col border-r border-white/[0.06] bg-[#0a0a0a]/95 backdrop-blur-2xl z-50 transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <NavContent onClose={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[240px] lg:w-[260px] h-full flex-col border-r border-white/[0.06] bg-black/40 backdrop-blur-2xl relative z-20 shrink-0">
        <NavContent />
      </aside>

      {/* Mobile hamburger button — floats in top-left */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3.5 left-4 z-30 p-2 rounded-[10px] bg-white/[0.06] border border-white/[0.08] text-white md:hidden"
        aria-label="Menyuni ochish"
      >
        <Menu className="w-5 h-5" />
      </button>
    </>
  );
}
