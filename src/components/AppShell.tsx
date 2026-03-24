"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { AuthProvider } from "@/context/AuthContext";
import { CompanyProvider } from "@/context/CompanyContext";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const isPublicRoute = 
    pathname === '/login' || 
    pathname?.startsWith('/client') || 
    pathname?.startsWith('/reports/share');

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <AuthProvider>
      <CompanyProvider>
        <div className="flex h-screen overflow-hidden w-full">
          <Sidebar />
          <main className="flex-1 flex flex-col h-full overflow-hidden relative">
            <Header />
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-[1400px] mx-auto px-8 py-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </CompanyProvider>
    </AuthProvider>
  );
}
