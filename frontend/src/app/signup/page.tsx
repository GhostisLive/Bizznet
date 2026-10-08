"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import Logo from "@/components/Logo";

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
       // Call the backend signup endpoint
       const { access_token, refresh_token, user } = await api.signup(email, password, role);
       
       // Set the token in the API client for subsequent requests
       api.setToken(access_token);
       
       // Create organization record in the database
       const orgData = {
         id: user.id,
         name: orgName,
         tax_id: taxId || `TAX-${Math.floor(100000 + Math.random() * 900000)}`,
         role: role,
         status: "pending_verification",
       };
       
       // Note: We would normally call an endpoint to create the organization,
       // but for now we'll simulate success since the backend doesn't have this endpoint yet
       // In a real implementation, we would call something like:
       // await api.request('/organizations', { method: 'POST', body: JSON.stringify(orgData) });
       
       setSuccess(true);
       setTimeout(() => {
         router.push(`/dashboard?role=${role}`);
       }, 1500);

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
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C2418] flex flex-col font-sans relative">
      <header className="border-b border-[#E8E0D4] bg-white px-6 py-4 flex items-center justify-between z-10 shadow-xs">
        <a href="/" className="flex items-center gap-2.5 font-sans font-bold text-lg tracking-tight text-[#2C2418]">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EFE9DF] shadow-xs ring-1 ring-[#E8E0D4]">
            <Logo size={16} />
          </div>
          <span>Bizz<span className="text-[#6B5B3E]">Net</span></span>
        </a>
        <a href="/login" className="text-xs font-mono font-semibold text-[#6B5B3E] hover:underline">
          ALREADY SIGNED? [LOG IN]
        </a>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="max-w-md w-full border border-[#E8E0D4] rounded-xl bg-white shadow-sm overflow-hidden">
          
          <div className="border-b border-[#E8E0D4] p-6 bg-[#FAF8F5] text-center">
            <h2 className="text-xl font-bold tracking-tight text-[#2C2418]">Create Your BizzNet Node</h2>
            <p className="text-xs font-mono text-[#8A7E6E] mt-1">Enterprise Supply Chain Platform</p>
          </div>

          <div className="p-6">
            {errorMsg && (
              <div className="mb-4 p-3 rounded-md bg-[#FDF0EE] border border-[#C44133]/20 text-xs font-mono text-[#C44133]">
                [ERROR]: {errorMsg}
              </div>
            )}

            {success ? (
              <div className="py-8 text-center space-y-3">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-[#EEF7F2] text-[#2E7D5B]">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-sm text-[#2E7D5B]">Node Registration Initiated</h3>
                <p className="text-xs font-mono text-[#5C5040] leading-relaxed">
                  A verification link has been sent to your email. Click the link to activate your ledger access.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                
                <div>
                  <label className="block text-xs font-mono text-[#5C5040] mb-1.5 uppercase font-medium">Supply Chain Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-lg text-xs text-[#2C2418] focus:outline-none focus:ring-1 focus:ring-[#6B5B3E] focus:border-[#6B5B3E]"
                  >
                    <option value="raw_material_supplier">Raw Material Supplier</option>
                    <option value="manufacturer">Manufacturer / Component Assembler</option>
                    <option value="distributor">Distributor / Warehouse Operator</option>
                    <option value="retailer">Retailer / Brand Outlet</option>
                    <option value="transporter">Logistics & Transporter Carrier</option>
                    <option value="auditor">Third-Party Auditor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#5C5040] mb-1.5 uppercase font-medium">Organization Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tata Advanced Materials"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-lg text-xs text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-1 focus:ring-[#6B5B3E] focus:border-[#6B5B3E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#5C5040] mb-1.5 uppercase font-medium">Tax Registration / VAT ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GSTIN27AAAC1234F"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-lg text-xs text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-1 focus:ring-[#6B5B3E] focus:border-[#6B5B3E]"
                  />
                </div>

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
                  <label className="block text-xs font-mono text-[#5C5040] mb-1.5 uppercase font-medium">Access Password</label>
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
