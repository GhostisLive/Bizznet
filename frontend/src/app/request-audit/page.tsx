"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { api, AuditorCompany } from "@/lib/api";
import { useCurrentOrg } from "@/lib/useCurrentOrg";
import { ShieldCheck, X, Save, Loader2 } from "lucide-react";

export default function RequestAuditPage() {
  const currentOrg = useCurrentOrg();
  const router = useRouter();
  const [auditors, setAuditors] = useState<AuditorCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [auditorId, setAuditorId] = useState("");
  const [auditType, setAuditType] = useState<"company" | "labour" | "carbon">("company");
  const [scopeNote, setScopeNote] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (currentOrg.loading) return;
    api.getAuditors()
      .then(setAuditors)
      .catch(() => setError("Unable to load auditors"))
      .finally(() => setLoading(false));
  }, [currentOrg.loading]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auditorId.trim() || !auditType) {
      setError("Please select an auditor and audit type.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.createCompanyAuditRequest({
        auditor_id: auditorId,
        audit_type: auditType,
        scope_note: scopeNote.trim() || undefined,
        due_at: dueDate ? new Date(`${dueDate}T23:59:59`).toISOString() : undefined,
      });
      router.push("/company-audit");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create audit request");
    } finally {
      setSaving(false);
    }
  };

  if (currentOrg.loading || loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <p className="font-mono text-sm text-[#5C5040]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C2418] flex flex-col lg:flex-row">
      <Sidebar currentRole={currentOrg.roleLabel} orgName={currentOrg.orgName} nodeId={currentOrg.nodeId} />

      <main className="flex-1 min-w-0 space-y-7 px-5 py-6 md:px-10 md:py-8">
        <header className="flex flex-col gap-4 border-b border-[#E8E0D4] pb-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-[0.18em] text-[#8A7E6E]">
              <ShieldCheck size={15} className="text-[#2E7D5B]" />
              Auditor workspace
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">Request Audit</h1>
            <p className="mt-2 text-sm font-medium text-[#6B6257]">
              Schedule a new audit for your organization
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg text-[#8A7E6E] hover:text-[#2C2418] hover:bg-[#F5F0E8] transition-colors"
            aria-label="Back"
          >
            <X size={20} />
          </button>
        </header>

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-[#E8E0D4] bg-white shadow-sm">
          <div className="border-b border-[#E8E0D4] p-5">
            <h2 className="text-xl font-extrabold">New audit request</h2>
            <p className="mt-1 text-xs text-[#8A7E6E]">Fill in the details to create a new audit request</p>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            <div>
              <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">
                Auditor *
              </label>
              <select
                required
                value={auditorId}
                onChange={(e) => setAuditorId(e.target.value)}
                className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-bold text-[#2C2418] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
              >
                <option value="">Select an auditor</option>
                {auditors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">
                Audit type *
              </label>
              <select
                required
                value={auditType}
                onChange={(e) => setAuditType(e.target.value as "company" | "labour" | "carbon")}
                className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-bold text-[#2C2418] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
              >
                <option value="company">Company Audit</option>
                <option value="labour">Labour Audit</option>
                <option value="carbon">Carbon Audit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">
                Scope note
              </label>
              <textarea
                rows={3}
                value={scopeNote}
                onChange={(e) => setScopeNote(e.target.value)}
                placeholder="Describe the scope, focus areas, or specific requirements for this audit..."
                className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-semibold text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E] resize-y"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">
                Due date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-semibold text-[#2C2418] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
              />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-[#E8E0D4]">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-5 py-2.5 border border-[#E8E0D4] hover:bg-[#FAF8F5] text-[#5C5040] font-bold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-[#2C2418] hover:bg-[#4E4433] disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors shadow-sm inline-flex items-center gap-2"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                <Save size={14} />
                Submit audit request
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}