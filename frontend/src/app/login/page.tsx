"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      const user = authData?.user;
      if (!user) {
        throw new Error("Unable to retrieve session profile.");
      }

      // 2. Query target organization details to fetch user's customized role
      const { data: orgData, error: dbError } = await supabase
        .from("organizations")
        .select("role")
        .eq("id", user.id)
        .single();

      if (dbError) {
        console.warn("DB profile lookup failed, falling back to manufacturer:", dbError);
        router.push("/dashboard?role=manufacturer");
        return;
      }

      router.push(`/dashboard?role=${orgData?.role || "manufacturer"}`);

    } catch (err: any) {
      console.error("Login error:", err);
      setErrorMsg(err.message || "Invalid authentication credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSandboxBypass = (roleType: string) => {
    router.push(`/dashboard?role=${roleType}&sandbox=true`);
  };

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col font-sans relative">
      {/* Visual Guide Border Lines */}
      <div className="absolute inset-y-0 left-1/4 w-px bg-border-subtle/40 pointer-events-none hidden lg:block" />
      <div className="absolute inset-y-0 right-1/4 w-px bg-border-subtle/40 pointer-events-none hidden lg:block" />

      {/* Header */}
      <header className="border-b border-border-subtle bg-surface px-6 py-4 flex items-center justify-between z-10">
        <a href="/" className="flex items-center gap-2 font-sans font-bold text-lg tracking-tight">
          <span className="block size-2.5 rounded-full bg-accent" />
          BizzNet
        </a>
        <a href="/signup" className="text-xs font-mono font-medium hover:text-accent transition-colors">
          REGISTER NEW ORG [SIGN UP]
        </a>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="max-w-md w-full border border-border-subtle rounded-lg bg-surface-elevated overflow-hidden shadow-sm">
          
          <div className="border-b border-border-subtle p-6 bg-surface/30 text-center">
            <h2 className="text-xl font-bold tracking-tight text-text-primary">Sign In to BizzNet</h2>
            <p className="text-xs font-mono text-text-tertiary mt-1">Independent B2B Provenance Ledger</p>
          </div>

          <div className="p-6">
            {errorMsg && (
              <div className="mb-4 p-3 rounded-md bg-self-reported-light border border-self-reported/20 text-xs font-mono text-self-reported">
                [ERROR]: {errorMsg}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-text-secondary mb-1.5 uppercase">Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 border border-border bg-surface rounded-md text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-text-secondary mb-1.5 uppercase">Security Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2 border border-border bg-surface rounded-md text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded bg-cta-bg hover:opacity-90 text-cta-text py-2.5 text-xs font-semibold transition-opacity disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Unlocking Vault...
                    </>
                  ) : (
                    <>
                      Access Secure Terminal
                      <ArrowRight size={12} />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-border-subtle text-center">
              <span className="font-mono text-[10px] text-text-tertiary block">OR SKIP TO MOCK PREVIEW</span>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSandboxBypass("manufacturer")}
                  className="px-2.5 py-1.5 border border-border bg-surface text-text-primary hover:bg-border-subtle rounded text-[10px] font-mono transition-colors"
                >
                  [Manufacturer Sandbox]
                </button>
                <button
                  onClick={() => handleSandboxBypass("auditor")}
                  className="px-2.5 py-1.5 border border-border bg-surface text-text-primary hover:bg-border-subtle rounded text-[10px] font-mono transition-colors"
                >
                  [Auditor Sandbox]
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
