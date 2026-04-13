"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Shield, Users, UserRound, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"admin" | "manager" | "editor">("editor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminCount, setAdminCount] = useState(0);
  const [checkingAdmins, setCheckingAdmins] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAdmins() {
      try {
        const { count, error } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "admin");
        
        if (!error && count !== null) {
          setAdminCount(count);
        }
      } catch (err) {
        console.error("Error checking admins:", err);
      } finally {
        setCheckingAdmins(false);
      }
    }
    checkAdmins();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Final security check for Admin role
    if (role === "admin" && adminCount >= 3) {
      setError("Adminlar soni cheklangan (maksimal 3 ta). Iltimos boshqa rol tanlang.");
      setLoading(false);
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  const roles = [
    { id: "admin", label: "Admin", icon: Shield, description: "Barcha huquqlarga ega", disabled: adminCount >= 3 },
    { id: "manager", label: "Menejer", icon: Users, description: "CRM va Vazifalar boshqaruvi" },
    { id: "editor", label: "Xodim", icon: UserRound, description: "Faqat o'z vazifalari" },
  ];

  return (
    <div className="flex items-center justify-center min-h-screen bg-black p-4">
      <Card className="w-full max-w-lg glass-panel border-white/10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-white">Ro'yxatdan o'tish</CardTitle>
          <CardDescription className="text-center text-white/60">
            Platformaga a'zo bo'lish uchun ma'lumotlarni kiriting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-white/80">To'liq ism-sharifingiz</Label>
                <Input
                  id="fullName"
                  placeholder="Ali Valiyev"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/80">Parol</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-white/80">Sizning rolingiz:</Label>
              <div className={cn("grid gap-3", checkingAdmins ? "opacity-50" : "")}>
                {roles.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    disabled={r.disabled || checkingAdmins}
                    onClick={() => setRole(r.id as any)}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-xl border text-left transition-all relative overflow-hidden",
                      role === r.id 
                        ? "bg-[var(--accent-blue)]/20 border-[var(--accent-blue)]" 
                        : "bg-white/5 border-white/10 hover:bg-white/10",
                      r.disabled && "opacity-50 cursor-not-allowed bg-red-950/20 border-red-500/20"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      role === r.id ? "bg-[var(--accent-blue)] text-white" : "bg-white/5 text-[var(--muted-foreground)]"
                    )}>
                      <r.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{r.label}</div>
                      <div className="text-[11px] text-white/50">{r.description}</div>
                    </div>
                    {r.id === "admin" && (
                      <div className="absolute top-2 right-3 text-[9px] font-bold uppercase tracking-wider text-white/30">
                        {adminCount}/3 band
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4 pt-2">
              <Button type="submit" className="w-full bg-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/90 text-white py-6" disabled={loading || checkingAdmins}>
                {loading ? (
                   <div className="flex items-center gap-2">
                     <Loader2 className="w-4 h-4 animate-spin" /> Ro'yxatdan o'tish...
                   </div>
                ) : "Ro'yxatdan o'tish"}
              </Button>
              <p className="text-sm text-center text-white/60">
                Profilingiz bormi?{" "}
                <Link href="/login" className="text-[var(--accent-blue)] hover:underline">
                  Kirish
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
