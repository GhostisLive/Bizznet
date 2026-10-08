"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { api, AuditorCompany, Certification } from "@/lib/api";
import { useCurrentOrg } from "@/lib/useCurrentOrg";
import { Award, Plus, Search, ShieldCheck } from "lucide-react";

const typeName = (type: string) => `${type.charAt(0).toUpperCase()}${type.slice(1)}`;
const date = (value: string | null) => value ? new Date(value).toLocaleDateString() : "—";

export default function AuditorCertificationsPage() {
  const currentOrg = useCurrentOrg();
  const [certificates, setCertificates] = useState<Certification[]>([]);
  const [companies, setCompanies] = useState<AuditorCompany[]>([]);
  const [query, setQuery] = useState("");
  const [parameter, setParameter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [score, setScore] = useState("");
  const [type, setType] = useState<Certification["audit_type"]>("company");
  const [error, setError] = useState("");

  const load = () => Promise.all([api.getCertifications(), api.getAuditorCompanies()]).then(([items, orgs]) => { setCertificates(items); setCompanies(orgs); }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load certifications."));
  useEffect(() => { if (!currentOrg.loading) void load(); }, [currentOrg.loading]);

  const visible = useMemo(() => certificates.filter((item) => `${item.company.name} ${item.certificate_number}`.toLowerCase().includes(query.toLowerCase().trim()) && (parameter === "All" || item.audit_type === parameter)), [certificates, query, parameter]);
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try { await api.createCertification({ company_id: companyId, audit_type: type, score: score ? Number(score) : undefined }); setShowForm(false); setCompanyId(""); setScore(""); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to create certificate."); }
  };

  if (currentOrg.loading) return <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center"><p className="font-mono text-sm text-[#5C5040]">Loading certifications...</p></div>;
  return <div className="min-h-screen bg-[#FAF8F5] text-[#2C2418] flex flex-col lg:flex-row"><Sidebar currentRole={currentOrg.roleLabel} orgName={currentOrg.orgName} nodeId={currentOrg.nodeId} /><main className="flex-1 min-w-0 space-y-7 px-5 py-6 md:px-10 md:py-8">
    <header className="flex flex-col gap-4 border-b border-[#E8E0D4] pb-6 md:flex-row md:items-end md:justify-between"><div><div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-[0.18em] text-[#8A7E6E]"><ShieldCheck size={15} className="text-[#2E7D5B]" /> Auditor workspace</div><h1 className="mt-3 text-3xl font-extrabold md:text-4xl">Certifications</h1><p className="mt-2 text-sm text-[#6B6257]">Certificates issued from real auditor records.</p></div><button onClick={() => setShowForm(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2E7D5B] px-4 py-3 text-xs font-bold text-white"><Plus size={16} /> Create certificate log</button></header>
    {error && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    <div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-[#E8E0D4] bg-white p-5"><p className="text-[11px] font-mono uppercase text-[#8A7E6E]">All issued</p><p className="mt-3 text-3xl font-extrabold">{certificates.length}</p></div><div className="rounded-2xl border border-[#E8E0D4] bg-white p-5"><p className="text-[11px] font-mono uppercase text-[#8A7E6E]">Active</p><p className="mt-3 text-3xl font-extrabold text-[#2E7D5B]">{certificates.filter((item) => item.status === "active").length}</p></div><div className="rounded-2xl border border-[#E8E0D4] bg-white p-5"><p className="text-[11px] font-mono uppercase text-[#8A7E6E]">Parameters covered</p><p className="mt-3 text-3xl font-extrabold">{new Set(certificates.map((item) => item.audit_type)).size}</p></div></div>
    <section className="rounded-2xl border border-[#E8E0D4] bg-white shadow-sm"><div className="flex flex-col gap-3 border-b border-[#E8E0D4] bg-[#FCFAF7] p-4 md:flex-row"><div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A89B8A]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search certificate ID or company" className="h-11 w-full rounded-xl border border-[#E8E0D4] pl-9 pr-3 text-sm" /></div><select value={parameter} onChange={(event) => setParameter(event.target.value)} className="h-11 rounded-xl border border-[#E8E0D4] bg-white px-3 text-sm"><option value="All">All</option><option value="company">Company</option><option value="labour">Labour</option><option value="carbon">Carbon</option></select></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="border-b border-[#E8E0D4] text-[10px] font-mono uppercase text-[#8A7E6E]"><tr><th className="px-5 py-3">Certificate</th><th className="px-4 py-3">Company</th><th className="px-4 py-3">Parameter</th><th className="px-4 py-3">Issued</th><th className="px-4 py-3">Expiry</th><th className="px-4 py-3">Status</th><th className="px-5 py-3">Score</th></tr></thead><tbody className="divide-y divide-[#F0EBE3]">{visible.map((item) => <tr key={item.id}><td className="px-5 py-4"><Award size={16} className="mr-2 inline text-[#315A87]" /><span className="font-mono text-xs font-bold">{item.certificate_number}</span></td><td className="px-4 py-4 text-sm font-bold">{item.company.name}</td><td className="px-4 py-4 text-sm">{typeName(item.audit_type)} audit</td><td className="px-4 py-4 text-sm">{date(item.issued_at)}</td><td className="px-4 py-4 text-sm">{date(item.expires_at)}</td><td className="px-4 py-4 text-sm font-semibold">{item.status}</td><td className="px-5 py-4 font-mono text-sm">{item.score ?? "—"}/100</td></tr>)}</tbody></table>{visible.length === 0 && <p className="p-8 text-center text-sm text-[#8A7E6E]">No certifications match your filters.</p>}</div></section>
  </main>{showForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C2418]/45 p-5"><form onSubmit={save} className="w-full max-w-lg space-y-4 rounded-2xl bg-[#FFFDF9] p-6 shadow-2xl"><h2 className="text-xl font-extrabold">Create certificate log</h2><select required value={companyId} onChange={(event) => setCompanyId(event.target.value)} className="h-11 w-full rounded-xl border border-[#E8E0D4] px-3 text-sm"><option value="">Select registered company</option>{companies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select value={type} onChange={(event) => setType(event.target.value as Certification["audit_type"])} className="h-11 w-full rounded-xl border border-[#E8E0D4] px-3 text-sm"><option value="company">Company audit</option><option value="labour">Labour audit</option><option value="carbon">Carbon audit</option></select><input required min="0" max="100" type="number" value={score} onChange={(event) => setScore(event.target.value)} placeholder="Score (0-100)" className="h-11 w-full rounded-xl border border-[#E8E0D4] px-3 text-sm" /><div className="flex justify-end gap-3"><button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-[#E8E0D4] px-4 py-2 text-sm">Cancel</button><button className="rounded-xl bg-[#2E7D5B] px-4 py-2 text-sm font-bold text-white">Issue certificate</button></div></form></div>}</div>;
}
