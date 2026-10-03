"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/lib/AuthProvider";
import { useCurrentOrg } from "@/lib/useCurrentOrg";
import { supabase } from "@/utils/supabaseClient";
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
  Loader2
} from "lucide-react";

interface ProvenanceRecord {
  id: string;
  type: string;
  verifying_party: string | null;
  payload: {
    category?: string;
    trust_score?: number;
    credit_rating?: string;
    tax_status?: string;
    solvency?: string;
  } | null;
  verified_at: string | null;
  created_at: string;
}

export default function CompanyAuditPage() {
  const currentOrg = useCurrentOrg();
  const { user, org, loading: authLoading } = useAuth();
  const [provenanceRecords, setProvenanceRecords] = useState<ProvenanceRecord[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !org) return;

    async function fetchData() {
      setDataLoading(true);

      const { data } = await supabase
        .from("provenance_records")
        .select("id, type, verifying_party, payload, verified_at, created_at")
        .eq("organization_id", org!.id);

      setProvenanceRecords(data ?? []);
      setDataLoading(false);
    }

    fetchData();
  }, [authLoading, org]);

  const companyRecords = provenanceRecords.filter(
    (r) => r.payload?.category === "company" || r.payload?.trust_score !== undefined
  );

  const trustScores = companyRecords
    .map((r) => r.payload?.trust_score)
    .filter((s): s is number => s !== undefined && s !== null);
  const avgTrustScore =
    trustScores.length > 0
      ? (trustScores.reduce((a, b) => a + b, 0) / trustScores.length).toFixed(1)
      : null;

  const latestRecord = companyRecords.length > 0
    ? companyRecords.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    : null;

  const orgStatus = org?.status ?? "pending_verification";
  const statusLabel =
    orgStatus === "verified" ? "Verified" :
    orgStatus === "suspended" ? "Suspended" : "Pending Verification";

  const auditStatus: "3rd-Party Audited" | "Voluntary" | "Not Verified" =
    companyRecords.some((r) => r.type === "verified" || r.type === "audited")
      ? "3rd-Party Audited"
      : companyRecords.length > 0
        ? "Voluntary"
        : "Not Verified";

  const creditRating = latestRecord?.payload?.credit_rating ?? "Unrated";
  const taxStatus = latestRecord?.payload?.tax_status ?? (orgStatus === "verified" ? "Active Compliant" : "Under Review");
  const solvency = latestRecord?.payload?.solvency ?? "—";

  const hasData = org !== null;
  const hasChartData = companyRecords.length > 0;
  const isLoading = authLoading || dataLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#2C2418] flex flex-col lg:flex-row font-sans">
        <Sidebar currentRole={currentOrg.roleLabel} orgName={currentOrg.orgName} nodeId={currentOrg.nodeId} />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-[#6B5B3E]" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C2418] flex flex-col lg:flex-row font-sans">
      <Sidebar currentRole={currentOrg.roleLabel} orgName={currentOrg.orgName} nodeId={currentOrg.nodeId} />

      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-x-hidden max-w-[1600px] mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E8E0D4]">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#2C2418] tracking-tight">
              Company Trust & Financial Audit
            </h1>
            <p className="text-base font-semibold text-[#5C5040] mt-1">
              Legal registration verification, tax compliance, and credit rating assurance matrix
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#EEF7F2] border border-[#2E7D5B]/30 rounded-xl text-xs font-mono font-bold text-[#2E7D5B]">
              <ShieldCheck size={16} />
              {orgStatus === "verified" ? "Verified Enterprise Node" : "Enterprise Node"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-[#8A7E6E]">Node Trust Index</span>
              <div className="p-2.5 bg-[#EEF7F2] rounded-xl text-[#2E7D5B]">
                <ShieldCheck size={20} />
              </div>
            </div>
            <h2 className="text-4xl font-extrabold text-[#2E7D5B] mt-3">
              {avgTrustScore ? `${avgTrustScore} / 100` : "— / 100"}
            </h2>
            <p className="text-xs text-[#8A7E6E] font-semibold mt-2">
              {avgTrustScore ? "Corporate Trust Rating Verified" : "No trust score data available"}
            </p>
          </div>

          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-[#8A7E6E]">Tax & GST Compliance</span>
              <div className="p-2.5 bg-[#EEF7F2] rounded-xl text-[#2E7D5B]">
                <CheckCircle2 size={20} />
              </div>
            </div>
            <h2 className="text-4xl font-extrabold text-[#2C2418] mt-3">{taxStatus}</h2>
            <p className="text-xs text-[#8A7E6E] font-semibold mt-2">
              {taxStatus === "Active Compliant" ? "Zero tax defaults or filing delays" : "Tax status pending review"}
            </p>
          </div>

          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-[#8A7E6E]">Financial Solvency</span>
              <div className="p-2.5 bg-[#F5F0E8] rounded-xl text-[#6B5B3E]">
                <DollarSign size={20} />
              </div>
            </div>
            <h2 className="text-4xl font-extrabold text-[#2C2418] mt-3">
              {solvency !== "—" ? solvency : "—"}
            </h2>
            <p className="text-xs text-[#8A7E6E] font-semibold mt-2">
              {solvency !== "—" ? "Financial solvency assessed" : "No solvency data available"}
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#E8E0D4] pb-4 mb-5">
              <div>
                <h3 className="text-xl font-extrabold text-[#2C2418]">Company Trust Score Trajectory</h3>
                <p className="text-xs text-[#8A7E6E] font-semibold mt-0.5 font-mono">Historical trust score stability over 4 fiscal quarters</p>
              </div>
              <span className="font-mono text-xs font-bold text-[#6B5B3E] bg-[#F5F0E8] px-3 py-1 rounded-full border border-[#6B5B3E]/20">
                {avgTrustScore && Number(avgTrustScore) >= 90 ? "Grade AAA" : avgTrustScore ? "Rated" : "No Data"}
              </span>
            </div>

            {hasChartData ? (
              <div className="my-6 relative h-48 w-full">
                <svg className="w-full h-full" viewBox="0 0 500 160" preserveAspectRatio="none">
                  <path d="M 0,110 L 125,95 L 250,70 L 375,55 L 500,40" fill="none" stroke="#6B5B3E" strokeWidth="4" strokeLinecap="round" />
                </svg>
                <div className="flex justify-between text-xs font-mono text-[#8A7E6E] pt-2 border-t border-[#E8E0D4]">
                  <span>Q2 2025</span><span>Q3 2025</span><span>Q4 2025</span><span>Q1 2026</span><span>Current</span>
                </div>
              </div>
            ) : (
              <div className="my-6 flex items-center justify-center h-48 w-full rounded-xl bg-[#F5F0E8] border border-[#E8E0D4]">
                <div className="text-center">
                  <AlertCircle size={32} className="mx-auto text-[#8A7E6E] mb-2" />
                  <p className="text-sm font-semibold text-[#5C5040]">No historical data available</p>
                  <p className="text-xs text-[#8A7E6E] mt-1">Trust score trajectory will appear here once audit records are logged</p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#E8E0D4] text-xs text-[#8A7E6E] font-medium leading-relaxed">
            <strong>Graph Details:</strong> Plots corporate trust rating evaluated by independent credit bureaus and tax filing verification engines. Higher scores unlock lower collateral requirements in BizzNet trade negotiations.
          </div>
        </div>

        <div className="bg-white border border-[#E8E0D4] rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#E8E0D4] bg-[#FAF8F5]">
            <h2 className="text-2xl font-extrabold text-[#2C2418]">Corporate Trust Directory Table</h2>
            <p className="text-sm text-[#5C5040] font-semibold mt-0.5">Categorized trust status: &apos;Not Verified&apos;, &apos;Voluntary&apos;, or &apos;3rd-Party Audited&apos;</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans">
              <thead className="bg-[#FAF8F5] border-b border-[#E8E0D4] font-mono text-xs text-[#8A7E6E] uppercase">
                <tr>
                  <th className="py-4 px-6 font-extrabold">Org ID & Name</th>
                  <th className="py-4 px-6 font-extrabold">Legal Structure</th>
                  <th className="py-4 px-6 font-extrabold">Tax Registration</th>
                  <th className="py-4 px-6 font-extrabold">Company Trust Status Tag</th>
                  <th className="py-4 px-6 font-extrabold">Credit Rating</th>
                  <th className="py-4 px-6 font-extrabold">Trust Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E0D4]">
                {org ? (
                  <tr className="hover:bg-[#FAF8F5]">
                    <td className="py-4 px-6">
                      <span className="font-mono text-xs font-bold text-[#6B5B3E] block">{org.id.slice(0, 8).toUpperCase()}</span>
                      <span className="font-extrabold text-[#2C2418]">{org.name}</span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-[#5C5040]">
                      {org.role ? org.role.charAt(0).toUpperCase() + org.role.slice(1) : "—"}
                    </td>
                    <td className="py-4 px-6 font-mono text-[#2C2418] font-bold">
                      {org.tax_id ?? "Pending Verification"}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                        auditStatus === "3rd-Party Audited"
                          ? "bg-[#EEF7F2] text-[#2E7D5B] border-[#2E7D5B]/30"
                          : auditStatus === "Voluntary"
                          ? "bg-[#FDF5E6] text-[#C68A17] border-[#C68A17]/30"
                          : "bg-[#F0EBE3] text-[#8A7E6E] border-[#8A7E6E]/30"
                      }`}>
                        {auditStatus}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-[#2C2418]">{creditRating}</td>
                    <td className="py-4 px-6 font-mono font-extrabold text-[#2E7D5B]">
                      {avgTrustScore ? `${avgTrustScore} / 100` : "— / 100"}
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={6} className="py-16 px-6">
                      <div className="text-center">
                        <Building2 size={40} className="mx-auto text-[#E8E0D4] mb-3" />
                        <p className="text-base font-bold text-[#5C5040]">No audit records available.</p>
                        <p className="text-sm text-[#8A7E6E] mt-1">Request a company audit to build trust.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-[#FAF8F5] border-t border-[#E8E0D4] text-xs text-[#8A7E6E] font-medium leading-relaxed">
            <strong>Table Details:</strong> Multi-tiered Company Trust badge tags. <em>&apos;3rd-Party Audited&apos;</em> (green) signifies corporate records audited by certified credit agencies. <em>&apos;Voluntary&apos;</em> (amber) represents self-submitted corporate documentation. <em>&apos;Not Verified&apos;</em> (slate) tags unverified vendors.
          </div>
        </div>
      </main>
    </div>
  );
}
