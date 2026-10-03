"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/utils/supabaseClient";
import type { User } from "@supabase/supabase-js";

export interface OrgProfile {
  id: string;
  name: string;
  role: string;
  tax_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextValue {
  user: User | null;
  org: OrgProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  org: null,
  loading: true,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [org, setOrg] = useState<OrgProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (cancelled) return;
      setUser(u ?? null);

      if (u) {
        const { data } = await supabase
          .from("organizations")
          .select("id, name, role, tax_id, status, created_at, updated_at")
          .eq("id", u.id)
          .maybeSingle();
        if (!cancelled) setOrg(data ?? null);
      } else {
        setOrg(null);
      }
      if (!cancelled) setLoading(false);
    }

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        supabase
          .from("organizations")
          .select("id, name, role, tax_id, status, created_at, updated_at")
          .eq("id", u.id)
          .maybeSingle()
          .then(({ data }) => {
            if (!cancelled) {
              setOrg(data ?? null);
              setLoading(false);
            }
          });
      } else {
        setOrg(null);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setOrg(null);
  };

  return (
    <AuthContext.Provider value={{ user, org, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
