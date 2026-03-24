"use client";

import { LayoutDashboard, Calendar, ClipboardList, TrendingUp, Settings, LogOut, MessageSquare, FileBarChart, Users, FolderKanban } from "lucide-react";
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

export function Sidebar() {
  const pathname = usePathname();
  const { role, signOut } = useAuth();

  const filteredItems = navItems.filter(item => {
    if (!role) return false;
    return item.roles.includes(role);
  });

  return (
    <aside className="w-[260px] h-full flex flex-col border-r border-white/[0.06] bg-black/40 backdrop-blur-2xl relative z-20">
      {/* Logo */}
      <div className="px-7 pt-8 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-[var(--accent-blue)] flex items-center justify-center">
            <span className="text-white text-[13px] font-bold tracking-tight">P</span>
          </div>
          <div>
            <div className="text-[15px] font-semibold text-white tracking-tight">Performance Agency</div>
            <div className="text-[11px] text-[var(--muted-foreground)]">Marketing Platform</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <div className="section-label px-3 pb-2 pt-4">Asosiy</div>
        {filteredItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
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
              <item.icon className={cn("w-[18px] h-[18px]", isActive ? "text-[var(--accent-blue)]" : "group-hover:text-white/70")} />
              <span className="text-[13px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 space-y-1 border-t border-white/[0.06]">
        <Link
          href="/settings"
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
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-[10px] rounded-[10px] text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10 transition-all duration-200"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span className="text-[13px] font-medium">Chiqish</span>
        </button>
      </div>
    </aside>
  );
}
