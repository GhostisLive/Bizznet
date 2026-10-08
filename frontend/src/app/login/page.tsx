"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
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
       // Call the backend login endpoint
       const { access_token, refresh_token, user } = await api.login(email, password);
       
       // Set the token in the API client for subsequent requests
       api.setToken(access_token);
       
       // The user object from the backend should contain the necessary info
       // For now, we'll redirect to dashboard and let AuthProvider load the session
       // In a more complete implementation, we might extract role/org from the user object
       router.push("/dashboard");
       
       // Note: broadcastSessionRefresh is no longer needed since we're not using Supabase auth state
       // but we'll keep the function call for compatibility if it's used elsewhere
       // broadcastSessionRefresh();

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
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C2418] flex flex-col font-sans relative">
      <header className="border-b border-[#E8E0D4] bg-white px-6 py-4 flex items-center justify-between z-10 shadow-xs">
        <a href="/" className="flex items-center gap-2.5 font-sans font-bold text-lg tracking-tight text-[#2C2418]">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6B5B3E] text-white shadow-xs">
            <ShieldCheck size={16} />
          </div>
          <span>Bizz<span className="text-[#6B5B3E]">Net</span></span>
        </a>
        <a href="/signup" className="text-xs font-mono font-semibold text-[#6B5B3E] hover:underline">
          REGISTER NEW ORG [SIGN UP]
        </a>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="max-w-md w-full border border-[#E8E0D4] rounded-xl bg-white shadow-sm overflow-hidden">
          
          <div className="border-b border-[#E8E0D4] p-6 bg-[#FAF8F5] text-center">
            <h2 className="text-xl font-bold tracking-tight text-[#2C2418]">Sign In to BizzNet</h2>
            <p className="text-xs font-mono text-[#8A7E6E] mt-1">Enterprise Supply Chain Platform</p>
          </div>

          <div className="p-6">
            {errorMsg && (
              <div className="mb-4 p-3 rounded-md bg-[#FDF0EE] border border-[#C44133]/20 text-xs font-mono text-[#C44133]">
                [ERROR]: {errorMsg}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#5C5040] mb-1.5 uppercase font-medium">Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-lg text-xs text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-1 focus:ring-[#6B5B3E] focus:border-[#6B5B3E]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#5C5040] mb-1.5 uppercase font-medium">Security Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-lg text-xs text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-1 focus:ring-[#6B5B3E] focus:border-[#6B5B3E]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#2C2418] hover:bg-[#4E4433] text-white py-3 text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs"
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

            <div className="mt-6 pt-5 border-t border-[#E8E0D4] text-center">
              <span className="font-mono text-[10px] text-[#A89B8A] block font-medium">OR QUICK LAUNCH DASHBOARD</span>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSandboxBypass("manufacturer")}
                  className="px-2.5 py-2 border border-[#E8E0D4] bg-[#FAF8F5] text-[#2C2418] hover:bg-white rounded-lg text-[11px] font-mono transition-colors font-medium shadow-xs"
                >
                  Manufacturer Sandbox
                </button>
                <button
                  onClick={() => handleSandboxBypass("auditor")}
                  className="px-2.5 py-2 border border-[#E8E0D4] bg-[#FAF8F5] text-[#2C2418] hover:bg-white rounded-lg text-[11px] font-mono transition-colors font-medium shadow-xs"
                >
                  Auditor Sandbox
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
