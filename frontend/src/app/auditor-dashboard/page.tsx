"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useCurrentOrg } from "@/lib/useCurrentOrg";
import { api } from "@/lib/api";
import {
  AlertCircle,
  ArrowUpRight,
  Award,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  FileSignature,
  FileCheck2,
  Filter,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Plus,
  X,
  Users,
} from "lucide-react";

type AuditStatus = "Pending" | "In progress" | "Completed";
type AuditType = "Company" | "Labour" | "Carbon";

interface AuditRequest {
  id: string;
  company: string;
  type: AuditType;
  location: string;
  submitted: string;
  due: string;
  status: AuditStatus;
  score?: number;
  initials: string;
  tone: string;
}

interface Certificate {
  id: string;
  company: string;
  type: AuditType;
  issued: string;
  expires: string;
  status: "Active" | "Expiring soon";
  score: number;
}

const activity = [
  { icon: CheckCircle2, color: "text-[#2E7D5B]", title: "Audit completed", detail: "Atlas Precision · Company audit", time: "18 min ago" },
  { icon: FileCheck2, color: "text-[#6B5B3E]", title: "Evidence submitted", detail: "Verde Logistics · Carbon audit", time: "2 hours ago" },
  { icon: Bell, color: "text-[#C68A17]", title: "New audit request", detail: "Northstar Components · Company audit", time: "Today, 09:42" },
];

type PastAudit = {
  id: string;
  company: string;
  type: AuditType;
  completed: string;
  score: number;
  findings: string;
  contract: string;
  contractStatus: string;
};

function statusClasses(status: AuditStatus) {
  if (status === "Completed") return "bg-[#EEF7F2] text-[#2E7D5B]";
  if (status === "In progress") return "bg-[#FFF4E3] text-[#AD6B0B]";
  return "bg-[#F5F0E8] text-[#6B5B3E]";
}

function typeClasses(type: AuditType) {
  if (type === "Carbon") return "bg-[#E7F3EC] text-[#2E7D5B]";
  if (type === "Labour") return "bg-[#F8EBDD] text-[#9A6017]";
  return "bg-[#E6EEF8] text-[#315A87]";
}

function typeName(type: string): AuditType {
  return type === "labour" ? "Labour" : type === "carbon" ? "Carbon" : "Company";
}

export default function AuditorDashboardPage() {
  const currentOrg = useCurrentOrg();
  const router = useRouter();
  const [filter, setFilter] = useState<"All" | AuditStatus>("All");
  const [query, setQuery] = useState("");
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [audits, setAudits] = useState<AuditRequest[]>([]);
  const [pastAuditRecords, setPastAuditRecords] = useState<PastAudit[]>([]);
  const [overview, setOverview] = useState({ open_requests: 0, completed_audits: 0, active_certifications: 0 });
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certificateForm, setCertificateForm] = useState({ company: "", type: "Company" as AuditType, score: "" });

  useEffect(() => {
    if (currentOrg.loading) return;
    Promise.all([api.getAuditorOverview(), api.getAuditRequests(), api.getAuditLogs(), api.getCertifications()])
      .then(([metrics, requests, logs, nextCertificates]) => {
        setOverview(metrics);
        setAudits(requests.map((item) => ({
          id: item.id,
          company: item.company.name,
          type: typeName(item.audit_type),
          location: "Registered company",
          submitted: new Date(item.requested_at).toLocaleDateString(),
          due: item.due_at ? new Date(item.due_at).toLocaleDateString() : "Not specified",
          status: item.status === "in_progress" ? "In progress" : item.status === "completed" ? "Completed" : "Pending",
          initials: item.company.name.slice(0, 2).toUpperCase(),
          tone: "bg-[#E6EEF8] text-[#315A87]",
        })));
        setPastAuditRecords(logs.map((item) => ({
          id: item.id,
          company: item.company.name,
          type: typeName(item.audit_type),
          completed: item.completed_at ? new Date(item.completed_at).toLocaleDateString() : "Not completed",
          score: item.score ?? 0,
          findings: item.findings || "No findings recorded",
          contract: item.digital_contract_id || "Not attached",
          contractStatus: item.digital_contract_id ? "Attached" : "Not attached",
        })));
        setCertificates(nextCertificates.map((item) => ({
          id: item.certificate_number,
          company: item.company.name,
          type: typeName(item.audit_type),
          issued: new Date(item.issued_at).toLocaleDateString(),
          expires: item.expires_at ? new Date(item.expires_at).toLocaleDateString() : "No expiry",
          status: item.status === "active" ? "Active" : "Expiring soon",
          score: item.score ?? 0,
        })));
      })
      .catch(() => {
        setAudits([]);
        setPastAuditRecords([]);
        setCertificates([]);
      });
  }, [currentOrg.loading]);

  const visibleAudits = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return audits.filter((audit) => {
      const matchesFilter = filter === "All" || audit.status === filter;
      const matchesQuery =
        !normalizedQuery ||
        audit.company.toLowerCase().includes(normalizedQuery) ||
        audit.id.toLowerCase().includes(normalizedQuery) ||
        audit.type.toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [audits, filter, query]);

  const createCertificate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!certificateForm.company.trim() || !certificateForm.score) return;
    router.push("/auditor/certifications");
  };

  if (currentOrg.loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <p className="text-[#5C5040] font-mono text-sm">Loading auditor workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C2418] flex flex-col lg:flex-row">
      <Sidebar currentRole={currentOrg.roleLabel} orgName={currentOrg.orgName} nodeId={currentOrg.nodeId} />

      <main className="flex-1 min-w-0 px-5 py-6 md:px-10 md:py-8 space-y-7">
        <header className="flex flex-col gap-5 border-b border-[#E8E0D4] pb-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-[0.18em] text-[#8A7E6E]">
              <ShieldCheck size={15} className="text-[#2E7D5B]" />
              Independent assurance workspace
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">Auditor dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-[#6B6257]">
              Review evidence, manage audit requests, and keep every certification decision traceable.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="hidden h-10 items-center gap-2 rounded-xl border border-[#E8E0D4] bg-white px-4 text-sm font-bold text-[#5C5040] shadow-sm transition hover:border-[#CFC3B2] sm:flex">
              <Download size={16} /> Export report
            </button>
            <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#E8E0D4] bg-white text-[#6B5B3E] shadow-sm transition hover:bg-[#F5F0E8]" aria-label="Notifications">
              <Bell size={18} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#C68A17]" />
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Open requests", value: String(overview.open_requests), note: "Live database count", icon: FileCheck2, tone: "text-[#6B5B3E]", accent: "bg-[#F5F0E8]" },
            { label: "Due this week", value: String(audits.filter((audit) => audit.due !== "Not specified").length), note: "Requests with due dates", icon: Clock3, tone: "text-[#AD6B0B]", accent: "bg-[#FFF4E3]" },
            { label: "Completed audits", value: String(overview.completed_audits), note: "Live database count", icon: CheckCircle2, tone: "text-[#2E7D5B]", accent: "bg-[#EEF7F2]" },
            { label: "Active certificates", value: String(overview.active_certifications), note: "Live database count", icon: Award, tone: "text-[#315A87]", accent: "bg-[#E6EEF8]" },
          ].map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="rounded-2xl border border-[#E8E0D4] bg-white p-5 shadow-[0_4px_18px_rgba(75,59,37,0.04)]">
                <div className="flex items-start justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-[0.14em] text-[#8A7E6E]">{metric.label}</span>
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${metric.accent} ${metric.tone}`}><Icon size={18} /></span>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <span className="text-3xl font-extrabold tracking-tight">{metric.value}</span>
                  <span className={`text-xs font-mono font-bold ${metric.tone}`}>{metric.note}</span>
                </div>
              </div>
            );
          })}
        </section>

        <section id="logs" className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-2xl border border-[#E8E0D4] bg-white shadow-[0_4px_18px_rgba(75,59,37,0.04)]">
            <div className="flex flex-col gap-4 border-b border-[#E8E0D4] p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-extrabold">Audit request queue</h2>
                <p className="mt-1 text-xs font-medium text-[#8A7E6E]">Prioritized work across your assigned organizations</p>
              </div>
              <Link href="/auditor-dashboard#logs" className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#6B5B3E] hover:text-[#2C2418]">
                View all requests <ArrowUpRight size={14} />
              </Link>
            </div>
            <div className="flex flex-col gap-3 border-b border-[#E8E0D4] bg-[#FCFAF7] p-4 md:flex-row">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A89B8A]" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search company, audit type, or ID" className="h-10 w-full rounded-xl border border-[#E8E0D4] bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#6B5B3E] focus:ring-2 focus:ring-[#6B5B3E]/10" />
              </div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={15} className="text-[#8A7E6E]" />
                <select value={filter} onChange={(event) => setFilter(event.target.value as "All" | AuditStatus)} className="h-10 rounded-xl border border-[#E8E0D4] bg-white px-3 text-sm font-semibold outline-none focus:border-[#6B5B3E]">
                  <option>All</option>
                  <option>Pending</option>
                  <option>In progress</option>
                  <option>Completed</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead className="border-b border-[#E8E0D4] text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-[#8A7E6E]">
                  <tr><th className="px-5 py-3">Organization</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Due date</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Score</th><th className="px-5 py-3" /></tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE3]">
                  {visibleAudits.map((audit) => (
                    <tr key={audit.id} className="group transition hover:bg-[#FCFAF7]">
                      <td className="px-5 py-4"><div className="flex items-center gap-3"><span className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-extrabold ${audit.tone}`}>{audit.initials}</span><div><div className="font-bold">{audit.company}</div><div className="mt-0.5 text-xs text-[#8A7E6E]">{audit.id} · {audit.location}</div></div></div></td>
                      <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-mono font-bold ${typeClasses(audit.type)}`}>{audit.type}</span></td>
                      <td className="px-4 py-4 text-sm font-semibold text-[#5C5040]">{audit.due}</td>
                      <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-mono font-bold ${statusClasses(audit.status)}`}>{audit.status}</span></td>
                      <td className="px-4 py-4 text-sm font-mono font-bold">{audit.score ? `${audit.score}/100` : "—"}</td>
                      <td className="px-5 py-4 text-right"><button aria-label={`Open ${audit.company}`} className="rounded-lg p-2 text-[#A89B8A] transition hover:bg-[#F5F0E8] hover:text-[#2C2418]"><ChevronRight size={17} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {visibleAudits.length === 0 && <div className="p-10 text-center text-sm font-medium text-[#8A7E6E]">No audit requests match your filters.</div>}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-[#E8E0D4] bg-[#3D3425] p-5 text-white shadow-[0_8px_24px_rgba(61,52,37,0.16)]">
              <div className="flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6B5B3E]"><AlertCircle size={19} /></div><span className="rounded-full bg-[#C68A17]/20 px-2.5 py-1 text-[11px] font-mono font-bold text-[#F2C66D]">Needs attention</span></div>
              <h3 className="mt-5 text-lg font-extrabold">4 certificates expiring soon</h3>
              <p className="mt-2 text-sm leading-6 text-[#D7CDBE]">Review renewal evidence before the next certification window closes.</p>
              <Link href="#certifications" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#FFFDF9] px-4 py-2.5 text-xs font-bold text-[#3D3425] transition hover:bg-white">Review certificates <ArrowUpRight size={14} /></Link>
            </div>
            <div className="rounded-2xl border border-[#E8E0D4] bg-white p-5 shadow-[0_4px_18px_rgba(75,59,37,0.04)]">
              <div className="flex items-center justify-between"><h3 className="font-extrabold">Recent activity</h3><button className="text-[#8A7E6E] hover:text-[#2C2418]" aria-label="Filter activity"><Filter size={16} /></button></div>
              <div className="mt-4 space-y-4">{activity.map((item) => { const Icon = item.icon; return <div key={item.title + item.time} className="flex gap-3"><Icon size={17} className={`mt-0.5 shrink-0 ${item.color}`} /><div className="min-w-0"><p className="text-sm font-bold">{item.title}</p><p className="mt-0.5 truncate text-xs text-[#8A7E6E]">{item.detail}</p><p className="mt-1 text-[10px] font-mono text-[#A89B8A]">{item.time}</p></div></div>; })}</div>
            </div>
          </div>
        </section>

        <section id="past-audits" className="rounded-2xl border border-[#E8E0D4] bg-white shadow-[0_4px_18px_rgba(75,59,37,0.04)]">
          <div className="flex flex-col gap-3 border-b border-[#E8E0D4] p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-extrabold">Past audits performed</h2>
              <p className="mt-1 text-xs font-medium text-[#8A7E6E]">Completed audit details and the digital contract for every engagement</p>
            </div>
            <span className="rounded-full bg-[#EEF7F2] px-3 py-1 text-[11px] font-mono font-bold text-[#2E7D5B]">{pastAuditRecords.length} completed recently</span>
          </div>
          <div className="grid gap-4 p-5 lg:grid-cols-3">
            {pastAuditRecords.map((audit) => (
              <article key={audit.id} className="rounded-xl border border-[#E8E0D4] bg-[#FCFAF7] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-extrabold">{audit.company}</p><p className="mt-1 text-xs font-mono text-[#8A7E6E]">{audit.id} · Completed {audit.completed}</p></div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-mono font-bold ${typeClasses(audit.type)}`}>{audit.type}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg border border-[#E8E0D4] bg-white p-3"><p className="text-[#8A7E6E]">Audit score</p><p className="mt-1 text-lg font-extrabold">{audit.score}<span className="text-xs text-[#8A7E6E]">/100</span></p></div>
                  <div className="rounded-lg border border-[#E8E0D4] bg-white p-3"><p className="text-[#8A7E6E]">Findings</p><p className="mt-1 font-bold">{audit.findings}</p></div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[#E8E0D4] pt-3">
                  <div className="flex items-center gap-2 text-xs"><FileSignature size={15} className="text-[#2E7D5B]" /><div><p className="font-bold">Digital contract</p><p className="text-[10px] text-[#8A7E6E]">{audit.contract} · {audit.contractStatus}</p></div></div>
                  <button className="rounded-lg p-2 text-[#6B5B3E] transition hover:bg-[#F5F0E8]" aria-label={`Download digital contract for ${audit.company}`}><Download size={15} /></button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="certifications" className="rounded-2xl border border-[#E8E0D4] bg-white shadow-[0_4px_18px_rgba(75,59,37,0.04)]">
          <div className="flex flex-col gap-4 border-b border-[#E8E0D4] p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E6EEF8] text-[#315A87]"><Users size={20} /></div><div><h2 className="text-xl font-extrabold">Certification register</h2><p className="mt-1 text-xs font-medium text-[#8A7E6E]">All certificates issued by you across company, labour, and carbon parameters</p></div></div>
            <button onClick={() => router.push("/auditor/certifications")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2E7D5B] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#25694C]"><Plus size={15} /> Create new certificate log</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="border-b border-[#E8E0D4] text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-[#8A7E6E]">
                <tr><th className="px-5 py-3">Certificate</th><th className="px-4 py-3">Company</th><th className="px-4 py-3">Parameter</th><th className="px-4 py-3">Issued</th><th className="px-4 py-3">Expiry</th><th className="px-4 py-3">Status</th><th className="px-5 py-3">Score</th></tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE3]">
                {certificates.map((certificate) => (
                  <tr key={certificate.id} className="transition hover:bg-[#FCFAF7]">
                    <td className="px-5 py-4"><div className="flex items-center gap-2"><Award size={16} className="text-[#315A87]" /><span className="font-mono text-xs font-bold">{certificate.id}</span></div></td>
                    <td className="px-4 py-4 text-sm font-bold">{certificate.company}</td>
                    <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-mono font-bold ${typeClasses(certificate.type)}`}>{certificate.type} audit</span></td>
                    <td className="px-4 py-4 text-sm text-[#5C5040]">{certificate.issued}</td>
                    <td className="px-4 py-4 text-sm text-[#5C5040]">{certificate.expires}</td>
                    <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-mono font-bold ${certificate.status === "Active" ? "bg-[#EEF7F2] text-[#2E7D5B]" : "bg-[#FFF4E3] text-[#AD6B0B]"}`}>{certificate.status}</span></td>
                    <td className="px-5 py-4 text-sm font-mono font-bold">{certificate.score}/100</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {showCertificateModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#2C2418]/45 p-5">
          <div role="dialog" aria-modal="true" aria-labelledby="certificate-dialog-title" className="w-full max-w-lg rounded-2xl border border-[#E8E0D4] bg-[#FFFDF9] p-6 shadow-2xl">
            <div className="flex items-start justify-between"><div><h2 id="certificate-dialog-title" className="text-xl font-extrabold">Create certificate log</h2><p className="mt-1 text-xs text-[#8A7E6E]">Record a new certificate issued by the auditor.</p></div><button onClick={() => setShowCertificateModal(false)} className="rounded-lg p-2 text-[#8A7E6E] hover:bg-[#F5F0E8]" aria-label="Close certificate form"><X size={18} /></button></div>
            <form onSubmit={createCertificate} className="mt-5 space-y-4">
              <label className="block text-xs font-mono font-bold uppercase tracking-wide text-[#6B5B3E]">Company<input required value={certificateForm.company} onChange={(event) => setCertificateForm((form) => ({ ...form, company: event.target.value }))} placeholder="Enter company name" className="mt-2 h-11 w-full rounded-xl border border-[#E8E0D4] bg-white px-3 text-sm font-sans outline-none focus:border-[#6B5B3E] focus:ring-2 focus:ring-[#6B5B3E]/10" /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-mono font-bold uppercase tracking-wide text-[#6B5B3E]">Audit parameter<select value={certificateForm.type} onChange={(event) => setCertificateForm((form) => ({ ...form, type: event.target.value as AuditType }))} className="mt-2 h-11 w-full rounded-xl border border-[#E8E0D4] bg-white px-3 text-sm font-sans outline-none focus:border-[#6B5B3E]"><option>Company</option><option>Labour</option><option>Carbon</option></select></label>
                <label className="block text-xs font-mono font-bold uppercase tracking-wide text-[#6B5B3E]">Audit score<input required min="0" max="100" type="number" value={certificateForm.score} onChange={(event) => setCertificateForm((form) => ({ ...form, score: event.target.value }))} placeholder="0–100" className="mt-2 h-11 w-full rounded-xl border border-[#E8E0D4] bg-white px-3 text-sm font-sans outline-none focus:border-[#6B5B3E] focus:ring-2 focus:ring-[#6B5B3E]/10" /></label>
              </div>
              <div className="rounded-xl bg-[#EEF7F2] p-3 text-xs leading-5 text-[#2E7D5B]">A certificate ID and one-year expiry date will be generated when this log is saved.</div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setShowCertificateModal(false)} className="rounded-xl border border-[#E8E0D4] px-4 py-2.5 text-xs font-bold text-[#5C5040] hover:bg-[#F5F0E8]">Cancel</button><button type="submit" className="rounded-xl bg-[#2E7D5B] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#25694C]">Save certificate log</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
