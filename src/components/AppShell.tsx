import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CompanyProvider } from "@/context/CompanyContext";
import { useEffect } from "react";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicRoute = 
    pathname === '/login' || 
    pathname === '/register' ||
    pathname?.startsWith('/client') || 
    pathname?.startsWith('/reports/share');

  useEffect(() => {
    if (!loading && !user && !isPublicRoute) {
      router.push("/login");
    }
  }, [user, loading, isPublicRoute, router]);

  if (loading && !isPublicRoute) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="w-8 h-8 border-4 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (!user) return null;

  return (
    <CompanyProvider>
      <div className="flex h-screen overflow-hidden w-full">
        <Sidebar />
        <main className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
          <Header />
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-[1400px] mx-auto px-4 py-5 md:px-8 md:py-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </CompanyProvider>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>
        {children}
      </AuthGuard>
    </AuthProvider>
  );
}
