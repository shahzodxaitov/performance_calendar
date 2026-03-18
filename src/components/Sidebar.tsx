"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, CheckSquare, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const routes = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Kalendar", href: "/calendar", icon: Calendar },
  { name: "Ishlar", href: "/tasks", icon: CheckSquare },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 h-screen hidden md:flex flex-col glass-panel border-r border-white/5 sticky top-0">
      <div className="p-6 flex items-center space-x-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center shadow-lg shadow-primary/30">
          <span className="text-white font-bold text-xl leading-none">B</span>
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
          BPG
        </span>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {routes.map((route) => {
          const isActive = pathname === route.href || (route.href !== "/" && pathname.startsWith(route.href));
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                isActive 
                  ? "text-white font-medium bg-primary/20 border border-primary/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <route.icon 
                className={cn(
                  "w-5 h-5 transition-transform duration-300",
                  isActive ? "text-primary scale-110" : "group-hover:scale-110 group-hover:text-foreground"
                )} 
              />
              <span className="relative z-10">{route.name}</span>
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50 z-0"></div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <button className="flex items-center space-x-3 px-3 py-3 w-full rounded-xl text-muted-foreground hover:bg-white/5 transition-colors group">
          <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
          <span>Sozlamalar</span>
        </button>
      </div>
    </div>
  );
}
