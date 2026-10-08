"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { api, isAuthError } from "@/lib/api";
interface User { id: string; email: string; aud: string; email_confirmed_at?: string; phone?: string; phone_confirmed_at?: string; confirmed_at?: string; last_sign_in_at?: string; app_metadata: Record<string, unknown>; user_metadata: Record<string, unknown>; created_at: string; updated_at: string; is_anonymous: boolean; }

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
  login: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  org: null,
  loading: true,
  signOut: async () => {},
  login: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [org, setOrg] = useState<OrgProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async () => {
    if (!api.hasSession()) {
      setUser(null);
      setOrg(null);
      setLoading(false);
      return;
    }

    try {
      const userData = await api.getCurrentUserInfo();

      const backendUser: User = {
        id: userData.id.toString(),
        aud: "authenticated",
        email: userData.email,
        email_confirmed_at: undefined,
        phone: undefined,
        phone_confirmed_at: undefined,
        confirmed_at: undefined,
        last_sign_in_at: undefined,
        app_metadata: { provider: "email", providers: ["email"] },
        user_metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_anonymous: false,
      };

      setUser(backendUser);

      const orgData = await api.getOrganizationById(userData.organization_id.toString());
      setOrg({
        id: orgData.id,
        name: orgData.name,
        role: orgData.role,
        tax_id: orgData.tax_id,
        status: orgData.status,
        created_at: orgData.created_at,
        updated_at: orgData.updated_at,
      });
    } catch (error) {
      if (isAuthError(error)) {
        // Session is dead (refresh failed or no refresh token): sign out silently.
        api.setToken("");
      } else {
        // Transient/network error: keep the stored tokens and retry next load.
        console.warn("Failed to load session:", error);
      }
      setUser(null);
      setOrg(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const signOut = async () => {
    api.setToken("");
    setUser(null);
    setOrg(null);
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      api.setToken(response.access_token);
      setLoading(true);
      await loadSession();
    } catch (error: any) {
      throw new Error(`Login failed: ${error.message}`);
    }
  };

  return (
    <AuthContext.Provider value={{ user, org, loading, signOut, login }}>
      {children}
    </AuthContext.Provider>
  );
}
