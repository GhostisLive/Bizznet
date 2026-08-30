"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [role, setRole] = useState("manufacturer");
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Sign up user in Supabase Auth with custom metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            org_name: orgName,
            role: role,
            tax_id: taxId || `TAX-${Math.floor(100000 + Math.random() * 900000)}`,
          }
        }
      });

      if (authError) throw authError;

      const user = authData?.user;
      if (!user) {
        throw new Error("Failed to register. Please try again.");
      }

      // If a session is returned immediately (email confirmation disabled/auto-confirm), sync and redirect
      if (authData.session) {
        const { error: dbError } = await supabase
          .from("organizations")
          .upsert({
            id: user.id,
            name: orgName,
            tax_id: taxId || `TAX-${Math.floor(100000 + Math.random() * 900000)}`,
            role: role,
            status: "pending_verification",
          });
        if (dbError) throw dbError;

        setSuccess(true);
        setTimeout(() => {
          router.push(`/dashboard?role=${role}`);
        }, 1500);
      } else {
        // Email validation confirmation is required
        setSuccess(true);
      }

    } catch (err: any) {
      console.error("Signup error:", err);
      setErrorMsg(err.message || "An unexpected error occurred during registration.");
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
        <a href="/login" className="text-xs font-mono font-medium hover:text-accent transition-colors">
          ALREADY SIGNED? [LOG IN]
        </a>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="max-w-md w-full border border-border-subtle rounded-lg bg-surface-elevated overflow-hidden shadow-sm">
          
          <div className="border-b border-border-subtle p-6 bg-surface/30 text-center">
            <h2 className="text-xl font-bold tracking-tight text-text-primary">Create Your BizzNet Node</h2>
            <p className="text-xs font-mono text-text-tertiary mt-1">Independent B2B Provenance Ledger</p>
          </div>

          <div className="p-6">
            {errorMsg && (
              <div className="mb-4 p-3 rounded-md bg-self-reported-light border border-self-reported/20 text-xs font-mono text-self-reported">
                [ERROR]: {errorMsg}
              </div>
            )}

            {success ? (
              <div className="py-8 text-center space-y-3">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-verified-light text-verified">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-sm text-verified">Node Registration Initiated</h3>
                <p className="text-xs font-mono text-text-secondary leading-relaxed">
                  A verification link has been sent to your email. Click the link to activate your ledger access.
                </p>
                <div className="pt-2 text-[10px] text-text-tertiary font-mono">
                  [Note: Local sandbox routes remain accessible below for instant review]
                </div>
              </div>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                
                {/* Mode Selector */}
                <div>
                  <label className="block text-xs font-mono text-text-secondary mb-1.5 uppercase">Supply Chain Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2 border border-border bg-surface rounded-md text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="supplier">Raw Material Supplier</option>
                    <option value="manufacturer">Manufacturer / Component Assembler</option>
                    <option value="distributor">Distributor / Warehouse Operator</option>
                    <option value="retailer">Retailer / Brand Outlet</option>
                    <option value="transporter">Logistics & Transporter Carrier</option>
                    <option value="auditor">Third-Party Auditor</option>
                  </select>
                  <p className="text-[10px] text-text-tertiary mt-1">This role is locked to your organization domain after signup.</p>
                </div>

                <div>
                  <label className="block text-xs font-mono text-text-secondary mb-1.5 uppercase">Organization Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tata Advanced Materials"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-border bg-surface rounded-md text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-text-secondary mb-1.5 uppercase">Tax Registration / VAT ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GSTIN27AAAC1234F"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full px-3.5 py-2 border border-border bg-surface rounded-md text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

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
                  <label className="block text-xs font-mono text-text-secondary mb-1.5 uppercase">Access Password</label>
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
                        Generating Keys...
                      </>
                    ) : (
                      <>
                        Register Organization
                        <ArrowRight size={12} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

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
