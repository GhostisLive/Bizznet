"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { api, AuditRequest } from "@/lib/api";
import { useCurrentOrg } from "@/lib/useCurrentOrg";
import { ShieldCheck, CheckCircle2, X, Save, Loader2 } from "lucide-react";

const label = (type: string) => `${type.charAt(0).toUpperCase()}${type.slice(1)}`;

function PerformAuditContent() {
  const currentOrg = useCurrentOrg();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("requestId");

  const [request, setRequest] = useState<AuditRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [score, setScore] = useState("");
  const [findings, setFindings] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    if (currentOrg.loading) return;

    const loadRequest = async () => {
      if (!requestId) {
        setError("No audit request specified.");
        setLoading(false);
        return;
      }
      try {
        const requests = await api.getAuditRequests();
        const found = requests.find((r) => r.id === requestId);
        if (!found) {
          setError("Audit request not found.");
        } else {
          setRequest(found);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load audit request");
      } finally {
        setLoading(false);
      }
    };
    loadRequest();
  }, [currentOrg.loading, requestId]);

  const handleStartAudit = async () => {
    if (!request) return;
    setSaving(true);
    try {
      await api.updateAuditRequest(request.id, { status: "in_progress" });
      setRequest({ ...request, status: "in_progress" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start audit");
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteAudit = async () => {
    if (!request || !score.trim() || !findings.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const result = await api.completeAudit({
        request_id: request.id,
        score: Number(score),
        findings: findings.trim(),
        recommendations: recommendations.trim(),
        expires_at: expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : undefined,
      });
      setRequest({ ...request, status: "completed" });
      setSuccess(Boolean(result.certification.certificate_number));
      setTimeout(() => router.push("/auditor/audit-logs"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete audit");
    } finally {
      setSaving(false);
    }
  };

  if (currentOrg.loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <p className="font-mono text-sm text-[#5C5040]">Loading auditor workspace...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <p className="font-mono text-sm text-[#5C5040]">Loading audit request...</p>
      </div>
    );
  }

  if (error && !request) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="text-center p-8">
          <ShieldCheck size={48} className="mx-auto text-[#C44133] mb-4" />
          <h2 className="text-xl font-extrabold text-[#2C2418]">Unable to load audit request</h2>
          <p className="mt-2 text-[#8A7E6E]">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-6 px-6 py-3 bg-[#2C2418] text-white rounded-xl font-bold"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (!request) return null;

  const isPending = request.status === "pending";
  const isInProgress = request.status === "in_progress";
  const isCompleted = request.status === "completed";

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

            <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
              {isCompleted ? "Audit completed" : "Perform audit"}
            </h1>
            <p className="mt-2 text-sm font-medium text-[#6B6257]">
              {isPending
                ? "Review the request details and start the audit."
                : isInProgress
                ? "Document your findings, score, and recommendations."
                : "This audit has been completed."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isPending && (
              <button
                onClick={handleStartAudit}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2E7D5B] px-4 py-3 text-xs font-bold text-white hover:bg-[#247A53] disabled:opacity-50"
              >
                <CheckCircle2 size={16} />
                Start audit
              </button>
            )}
            {isInProgress && (
              <button
                onClick={handleCompleteAudit}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2C2418] px-4 py-3 text-xs font-bold text-white hover:bg-[#4E4433] disabled:opacity-50"
              >
                <Save size={16} />
                Complete audit
              </button>
            )}
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg text-[#8A7E6E] hover:text-[#2C2418] hover:bg-[#F5F0E8] transition-colors"
              aria-label="Back"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div role="status" className="rounded-xl border border-[#2E7D5B]/25 bg-[#EEF7F2] px-4 py-3 text-sm font-semibold text-[#2E7D5B]">
            Audit completed. Certificate generated and shared with the organization. Redirecting...
          </div>
        )}

        <section className="rounded-2xl border border-[#E8E0D4] bg-white shadow-sm">
          <div className="border-b border-[#E8E0D4] p-5">
            <h2 className="text-xl font-extrabold">Audit request details</h2>
            <p className="mt-1 text-xs text-[#8A7E6E]">Review before starting the audit</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-mono font-bold uppercase text-[#8A7E6E]">Company</p>
                <p className="font-bold text-lg">{request.company.name}</p>
              </div>
              <div>
                <p className="text-xs font-mono font-bold uppercase text-[#8A7E6E]">Audit type</p>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold">
                  {label(request.audit_type)} audit
                </span>
              </div>
              <div>
                <p className="text-xs font-mono font-bold uppercase text-[#8A7E6E]">Status</p>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold ${
                    isPending
                      ? "bg-[#F5F0E8] text-[#6B5B3E]"
                      : isInProgress
                      ? "bg-[#FFF4E3] text-[#AD6B0B]"
                      : "bg-[#EEF7F2] text-[#2E7D5B]"
                  }`}
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  {request.status}
                </span>
              </div>
              <div>
                <p className="text-xs font-mono font-bold uppercase text-[#8A7E6E]">Request ID</p>
                <p className="font-mono text-sm text-[#6B5B3E]">{request.id}</p>
              </div>
              <div>
                <p className="text-xs font-mono font-bold uppercase text-[#8A7E6E]">Requested</p>
                <p>{new Date(request.requested_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs font-mono font-bold uppercase text-[#8A7E6E]">Due</p>
                <p>{request.due_at ? new Date(request.due_at).toLocaleDateString() : "Not specified"}</p>
              </div>
              {request.scope_note && (
                <div className="md:col-span-2">
                  <p className="text-xs font-mono font-bold uppercase text-[#8A7E6E]">Scope note</p>
                  <p className="text-sm text-[#5C5040]">{request.scope_note}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {(isPending || isInProgress) && (
          <section className="rounded-2xl border border-[#E8E0D4] bg-white shadow-sm">
            <div className="border-b border-[#E8E0D4] p-5">
              <h2 className="text-xl font-extrabold">Perform audit</h2>
              <p className="mt-1 text-xs text-[#8A7E6E]">Document your findings, score, and recommendations</p>
            </div>
            <form className="p-5 space-y-5" onSubmit={(e) => { e.preventDefault(); handleCompleteAudit(); }}>
              <div>
                <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">
                  Score (0-100) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="e.g. 85"
                  className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-semibold text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">
                  Findings *
                </label>
                <textarea
                  required
                  rows={4}
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  placeholder="Document your key findings, observations, and any non-conformities..."
                  className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-semibold text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E] resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">
                  Recommendations
                </label>
                <textarea
                  rows={3}
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  placeholder="Provide recommendations for improvement, corrective actions, or follow-up items..."
                  className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-semibold text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E] resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">
                  Certificate expiry
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
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
                  Complete audit & log
                </button>
              </div>
            </form>
          </section>
        )}

        {isCompleted && (
          <section className="rounded-2xl border border-[#E8E0D4] bg-white shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#EEF7F2] rounded-xl text-[#2E7D5B]">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#2E7D5B]">Audit completed</h3>
                <p className="text-sm text-[#8A7E6E]">
                  This audit has been logged. View it in the <a href="/auditor/audit-logs" className="text-[#2E7D5B] underline hover:text-[#247A53]">audit logs</a>.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default function PerformAuditPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center"><p className="font-mono text-sm text-[#5C5040]">Loading audit request...</p></div>}>
      <PerformAuditContent />
    </Suspense>
  );
}