"use client";

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

type UserRole = "admin" | "manager" | "editor" | "client";

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  // ⚡ Bolt: Initialize loading state based on configuration to avoid synchronous setState inside useEffect
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);

  // ⚡ Bolt: Hoist and memoize fetchProfile to prevent unnecessary function re-allocations
  const fetchProfile = useCallback(async (userId: string, mountedRef: { current: boolean }) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (mountedRef.current) {
      if (!error && data) {
        setRole(data.role as UserRole);
      }
      setLoading(false);
    }
  }, []);

  // ⚡ Bolt: Memoize signOut function reference
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const mountedRef = { current: true };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mountedRef.current) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, mountedRef);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mountedRef.current) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, mountedRef);
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // ⚡ Bolt: Memoize the context object to prevent cascading re-renders across all useAuth() subscribers
  const contextValue = useMemo(
    () => ({ user, role, loading, signOut }),
    [user, role, loading, signOut]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
