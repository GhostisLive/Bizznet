"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { api, AuditLog, AuditRequest } from "@/lib/api";
import { useCurrentOrg } from "@/lib/useCurrentOrg";
import { Search, ShieldCheck } from "lucide-react";

const label = (type: string) => `${type.charAt(0).toUpperCase()}${type.slice(1)}`;
const date = (value: string | null) => value ? new Date(value).toLocaleDateString() : "—";

export default function AuditorAuditLogsPage() {
  const currentOrg = useCurrentOrg();
  const [requests, setRequests] = useState<AuditRequest[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [error, setError] = useState("");

  useEffect(() => {
    if (currentOrg.loading) return;
    Promise.all([api.getAuditRequests(), api.getAuditLogs()])
      .then(([nextRequests, nextLogs]) => { setRequests(nextRequests); setLogs(nextLogs); })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load auditor records."));
  }, [currentOrg.loading]);

  const filteredRequests = useMemo(() => requests.filter((item) => {
    const text = `${item.company.name} ${item.id} ${item.audit_type}`.toLowerCase();
    return text.includes(query.toLowerCase().trim()) && (status === "All" || item.status === status);
  }), [requests, query, status]);
  const filteredLogs = useMemo(() => logs.filter((item) => {
    const text = `${item.company.name} ${item.id} ${item.audit_type}`.toLowerCase();
    return text.includes(query.toLowerCase().trim()) && (status === "All" || status === "Completed");
  }), [logs, query, status]);

  if (currentOrg.loading) return <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center"><p className="font-mono text-sm text-[#5C5040]">Loading audit logs...</p></div>;
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C2418] flex flex-col lg:flex-row">
      <Sidebar currentRole={currentOrg.roleLabel} orgName={currentOrg.orgName} nodeId={currentOrg.nodeId} />
      <main className="flex-1 min-w-0 space-y-7 px-5 py-6 md:px-10 md:py-8">
        <header className="border-b border-[#E8E0D4] pb-6"><div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-[0.18em] text-[#8A7E6E]"><ShieldCheck size={15} className="text-[#2E7D5B]" /> Auditor workspace</div><h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">Audit logs</h1><p className="mt-2 text-sm font-medium text-[#6B6257]">Requests and completed audits loaded from the auditor workspace.</p></header>
        {error && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        <div className="flex flex-col gap-3 rounded-2xl border border-[#E8E0D4] bg-white p-4 shadow-sm md:flex-row"><div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A89B8A]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search company, audit type, or ID" className="h-11 w-full rounded-xl border border-[#E8E0D4] pl-9 pr-3 text-sm outline-none focus:border-[#6B5B3E]" /></div><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-[#E8E0D4] bg-white px-3 text-sm font-semibold"><option>All</option><option>pending</option><option>in_progress</option><option>completed</option><option>Completed</option></select></div>
        <section className="rounded-2xl border border-[#E8E0D4] bg-white shadow-sm"><div className="border-b border-[#E8E0D4] p-5"><h2 className="text-xl font-extrabold">Auditor request queue</h2><p className="mt-1 text-xs text-[#8A7E6E]">{filteredRequests.length} requests from registered companies</p></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead className="border-b border-[#E8E0D4] text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-[#8A7E6E]"><tr><th className="px-5 py-3">Company</th><th className="px-4 py-3">Parameter</th><th className="px-4 py-3">Requested</th><th className="px-4 py-3">Due</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-[#F0EBE3]">{filteredRequests.map((item) => <tr key={item.id}><td className="px-5 py-4 font-bold">{item.company.name}<p className="text-xs font-normal text-[#8A7E6E]">{item.id}</p></td><td className="px-4 py-4">{label(item.audit_type)} audit</td><td className="px-4 py-4 text-sm">{date(item.requested_at)}</td><td className="px-4 py-4 text-sm">{date(item.due_at)}</td><td className="px-5 py-4 text-sm font-semibold">{item.status}</td></tr>)}</tbody></table>{filteredRequests.length === 0 && <p className="p-8 text-center text-sm text-[#8A7E6E]">No requests match your filters.</p>}</div></section>
        <section className="rounded-2xl border border-[#E8E0D4] bg-white shadow-sm"><div className="border-b border-[#E8E0D4] p-5"><h2 className="text-xl font-extrabold">Past audits performed</h2><p className="mt-1 text-xs text-[#8A7E6E]">{filteredLogs.length} completed audit records and digital contracts</p></div><div className="grid gap-4 p-5 lg:grid-cols-3">{filteredLogs.map((item) => <article key={item.id} className="rounded-xl border border-[#E8E0D4] bg-[#FCFAF7] p-4"><p className="font-extrabold">{item.company.name}</p><p className="mt-1 text-xs font-mono text-[#8A7E6E]">{label(item.audit_type)} · {date(item.completed_at)}</p><p className="mt-4 text-2xl font-extrabold">{item.score ?? "—"}<span className="text-xs text-[#8A7E6E]">/100</span></p><p className="mt-3 text-xs text-[#5C5040]">{item.findings || "No findings recorded."}</p><p className="mt-4 flex items-center gap-2 text-xs font-mono text-[#6B5B3E]">Digital contract: {item.digital_contract_id || "Not attached"}</p></article>)}</div>{filteredLogs.length === 0 && <p className="p-8 text-center text-sm text-[#8A7E6E]">No completed audits match your filters.</p>}</section>
      </main>
    </div>
  );
}
