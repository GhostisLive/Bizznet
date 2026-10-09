"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { api, AuditRequest } from "@/lib/api";
import { useCurrentOrg } from "@/lib/useCurrentOrg";
import { Loader2, Search, FileCheck2 } from "lucide-react";

export default function WorkspacePage() {
  const currentOrg = useCurrentOrg();
  const router = useRouter();
  const [requests, setRequests] = useState<AuditRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (currentOrg.loading) return;
    api.getAuditRequests()
      .then(setRequests)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [currentOrg.loading]);

  const filtered = requests.filter((r) =>
    `${r.company.name} ${r.audit_type}`.toLowerCase().includes(query.toLowerCase())
  );

  if (loading) return <div className="p-8 flex justify-center items-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C2418] flex flex-col lg:flex-row">
      <Sidebar currentRole={currentOrg.roleLabel} orgName={currentOrg.orgName} nodeId={currentOrg.nodeId} />
      <main className="flex-1 p-6 space-y-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Workspace</h1>
          <p className="text-sm text-[#6B6257]">View audit requests from all companies.</p>
        </header>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">{error}</div>}
        <div className="flex items-center gap-3 rounded-xl border border-[#E8E0D4] p-2">
          <Search size={16} className="text-[#8A7E6E]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company or audit type"
            className="border-none outline-none flex-1 bg-transparent text-sm"
          />
        </div>
        <section className="rounded-2xl border border-[#E8E0D4] bg-white shadow-sm">
          <div className="p-5 border-b border-[#E8E0D4]">
            <h2 className="text-xl font-extrabold">Audit Requests ({filtered.length})</h2>
          </div>
          <table className="w-full text-left">
            <thead className="border-b border-[#E8E0D4] text-xs font-mono font-bold uppercase tracking-[0.14em] text-[#8A7E6E]">
              <tr>
                <th className="px-5 py-3">Company</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Requested</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBE3]">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-[#F9F5F0] transition-colors">
                  <td className="px-5 py-4 font-bold">{r.company.name}</td>
                  <td className="px-4 py-4 text-sm">{r.audit_type}</td>
                  <td className="px-4 py-4 text-sm">{new Date(r.requested_at).toLocaleDateString()}</td>
                  <td className="px-4 py-4 text-sm">{r.status}</td>
                  <td className="px-5 py-4 text-right">
                    {(r.status === "pending" || r.status === "in_progress") && (
                      <button
                        onClick={() => router.push(`/auditor/perform-audit?requestId=${r.id}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#2E7D5B] hover:bg-[#247A53] transition-colors"
                      >
                        <FileCheck2 size={12} />
                        Perform audit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-[#8A7E6E]">
                    No audit requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
