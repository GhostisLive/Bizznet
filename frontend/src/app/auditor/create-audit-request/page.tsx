"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { api, AuditorCompany, AuditRequest } from "@/lib/api";
import { useCurrentOrg } from "@/lib/useCurrentOrg";
import { ShieldCheck, Save, Loader2, ArrowLeft } from "lucide-react";

export default function CreateAuditRequestPage() {
  const currentOrg = useCurrentOrg();
  const router = useRouter();
  const [companies, setCompanies] = useState<AuditorCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [companyId, setCompanyId] = useState("");
  const [auditType, setAuditType] = useState<AuditRequest["audit_type"]>("company");
  const [scopeNote, setScopeNote] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (currentOrg.loading) return;
    api.getAuditorCompanies()
      .then(setCompanies)
      .catch(() => setError("Unable to load companies"))
      .finally(() => setLoading(false));
  }, [currentOrg.loading]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!companyId.trim() || !auditType) {
      setError("Please select a company and audit type.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.createAuditRequest({
        company_id: companyId,
        audit_type: auditType,
        scope_note: scopeNote.trim() || undefined,
        due_at: dueDate || undefined,
      });
      router.push("/auditor/audit-logs");
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
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">Create audit request</h1>
            <p className="mt-2 text-sm font-medium text-[#6B6257]">
              Schedule a new audit for a registered company
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg text-[#8A7E6E] hover:text-[#2C2418] hover:bg-[#F5F0E8] transition-colors"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
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
                Company *
              </label>
              <select
                required
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-bold text-[#2C2418] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
              >
                <option value="">Select a registered company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.role})
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
                onChange={(e) => setAuditType(e.target.value as AuditRequest["audit_type"])}
                className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-bold text-[#2C2418] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
              >
                <option value="company">Company audit</option>
                <option value="labour">Labour audit</option>
                <option value="carbon">Carbon audit</option>
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
                Create audit request
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}