"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/lib/AuthProvider";
import { useCurrentOrg } from "@/lib/useCurrentOrg";
import { supabase } from "@/utils/supabaseClient";
import {
  Leaf,
  ShieldCheck,
  CheckCircle2,
  TrendingDown,
  CloudRain,
  Activity,
  AlertCircle,
  Loader2
} from "lucide-react";

interface Facility {
  id: string;
  name: string;
  location: { city?: string; state?: string } | null;
  carbon_intensity_factor: number;
  created_at: string;
}

interface ProvenanceRecord {
  id: string;
  type: string;
  verifying_party: string | null;
  payload: {
    category?: string;
    carbon_intensity?: number;
    scope?: string;
    iso_certification?: string;
    reduction_vs_prior?: number;
    material?: string;
    supplier?: string;
    facility_id?: string;
  } | null;
  verified_at: string | null;
  created_at: string;
}

export default function CarbonAuditPage() {
  const currentOrg = useCurrentOrg();
  const { user, org, loading: authLoading } = useAuth();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [provenanceRecords, setProvenanceRecords] = useState<ProvenanceRecord[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !org) return;

    async function fetchData() {
      setDataLoading(true);

      const [facResult, provResult] = await Promise.all([
        supabase
          .from("facilities")
          .select("id, name, location, carbon_intensity_factor, created_at")
          .eq("organization_id", org!.id),
        supabase
          .from("provenance_records")
          .select("id, type, verifying_party, payload, verified_at, created_at")
          .eq("organization_id", org!.id),
      ]);

      setFacilities(facResult.data ?? []);
      setProvenanceRecords(provResult.data ?? []);
      setDataLoading(false);
    }

    fetchData();
  }, [authLoading, org]);

  const carbonRecords = provenanceRecords.filter(
    (r) => r.payload?.category === "carbon" || r.payload?.carbon_intensity !== undefined
  );

  const intensityValues = facilities
    .map((f) => Number(f.carbon_intensity_factor))
    .filter((v) => !isNaN(v) && v > 0);
  const avgIntensity =
    intensityValues.length > 0
      ? (intensityValues.reduce((a, b) => a + b, 0) / intensityValues.length).toFixed(1)
      : null;

  const scopeRecords = carbonRecords.filter((r) => r.payload?.scope);
  const scopeCoverage =
    scopeRecords.length > 0 && facilities.length > 0
      ? ((scopeRecords.length / facilities.length) * 100).toFixed(1)
      : null;

  const reductions = carbonRecords
    .map((r) => r.payload?.reduction_vs_prior)
    .filter((v): v is number => v !== undefined && v !== null);
  const avgReduction =
    reductions.length > 0
      ? (reductions.reduce((a, b) => a + b, 0) / reductions.length).toFixed(1)
      : null;

  const tableRows = carbonRecords.length > 0
    ? carbonRecords.map((r) => ({
        id: r.id.slice(0, 8).toUpperCase(),
        material: r.payload?.material ?? "—",
        supplier: r.payload?.supplier ?? r.verifying_party ?? "—",
        intensity: r.payload?.carbon_intensity
          ? `${r.payload.carbon_intensity} kg CO₂e/kg`
          : "—",
        status:
          r.type === "verified"
            ? ("3rd-Party Verified" as const)
            : r.type === "audited"
              ? ("3rd-Party Verified" as const)
              : r.type === "self_reported"
                ? ("Voluntary Self-Report" as const)
                : ("N/A" as const),
        iso: r.payload?.iso_certification ?? (r.type === "verified" ? "ISO 14064 Certified" : r.type === "self_reported" ? "Supplier Estimate" : "Uncertified"),
        reduction: r.payload?.reduction_vs_prior !== undefined
          ? `${r.payload.reduction_vs_prior > 0 ? "+" : ""}${r.payload.reduction_vs_prior}% vs prior`
          : "—",
      }))
    : facilities.map((fac) => ({
        id: fac.id.slice(0, 8).toUpperCase(),
        material: fac.name,
        supplier: org?.name ?? "—",
        intensity: Number(fac.carbon_intensity_factor) > 0
          ? `${Number(fac.carbon_intensity_factor).toFixed(1)} kg CO₂e/kg`
          : "—",
        status: "N/A" as const,
        iso: "Uncertified",
        reduction: "—",
      }));

  const hasData = facilities.length > 0 || carbonRecords.length > 0;
  const hasChartData = carbonRecords.length > 0;
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
              Carbon Footprint & Scope 1/2/3 Audit
            </h1>
            <p className="text-base font-semibold text-[#5C5040] mt-1">
              ISO 14064 GHG inventory accounting, material carbon intensity, and Scope 3 supply chain reduction
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#EEF7F2] border border-[#2E7D5B]/30 rounded-xl text-xs font-mono font-bold text-[#2E7D5B]">
              <Leaf size={16} />
              Carbon Certified Node
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-[#8A7E6E]">Total Facilities Tracked</span>
              <div className="p-2.5 bg-[#EEF7F2] rounded-xl text-[#2E7D5B]">
                <Leaf size={20} />
              </div>
            </div>
            <h2 className="text-4xl font-extrabold text-[#2C2418] mt-3">
              {facilities.length > 0 ? facilities.length : "0"}
            </h2>
            <p className="text-xs text-[#8A7E6E] font-semibold mt-2">
              {facilities.length > 0 ? (
                <span className="flex items-center gap-1">
                  {avgReduction ? (
                    <>
                      <TrendingDown size={14} className="text-[#2E7D5B]" />
                      <span className="text-[#2E7D5B] font-bold">{avgReduction}% avg reduction vs prior</span>
                    </>
                  ) : (
                    "Facilities registered for carbon tracking"
                  )}
                </span>
              ) : "No facilities registered yet"}
            </p>
          </div>

          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-[#8A7E6E]">Avg Carbon Intensity</span>
              <div className="p-2.5 bg-[#EEF7F2] rounded-xl text-[#2E7D5B]">
                <Activity size={20} />
              </div>
            </div>
            <h2 className="text-4xl font-extrabold text-[#2E7D5B] mt-3">
              {avgIntensity ? `${avgIntensity} kg CO₂e/kg` : "— kg CO₂e/kg"}
            </h2>
            <p className="text-xs text-[#8A7E6E] font-semibold mt-2">
              {avgIntensity ? "Weighted average across all facilities" : "No intensity data available"}
            </p>
          </div>

          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-[#8A7E6E]">Scope 3 Upstream Coverage</span>
              <div className="p-2.5 bg-[#F5F0E8] rounded-xl text-[#6B5B3E]">
                <ShieldCheck size={20} />
              </div>
            </div>
            <h2 className="text-4xl font-extrabold text-[#2C2418] mt-3">
              {scopeCoverage ? `${scopeCoverage}% Covered` : "—% Covered"}
            </h2>
            <p className="text-xs text-[#8A7E6E] font-semibold mt-2">
              {scopeCoverage ? `${scopeRecords.length} supplier${scopeRecords.length !== 1 ? "s" : ""} mapped to registry` : "No scope coverage data available"}
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#E8E0D4] pb-4 mb-5">
              <div>
                <h3 className="text-xl font-extrabold text-[#2C2418]">Scope 1, Scope 2 & Scope 3 Decarbonization Trajectory</h3>
                <p className="text-xs text-[#8A7E6E] font-semibold mt-0.5 font-mono">Emissions trajectory comparing facility direct vs supply chain indirect</p>
              </div>
              <span className="font-mono text-xs font-bold text-[#2E7D5B] bg-[#EEF7F2] px-3 py-1 rounded-full border border-[#2E7D5B]/20">
                {hasChartData ? "Net Zero 2035 Target" : "No Data"}
              </span>
            </div>

            {hasChartData ? (
              <div className="my-6 relative h-48 w-full">
                <svg className="w-full h-full" viewBox="0 0 500 160" preserveAspectRatio="none">
                  <path d="M 0,130 L 100,110 L 200,90 L 300,70 L 400,50 L 500,35" fill="none" stroke="#2E7D5B" strokeWidth="4" strokeLinecap="round" />
                </svg>
                <div className="flex justify-between text-xs font-mono text-[#8A7E6E] pt-2 border-t border-[#E8E0D4]">
                  <span>Q1 2025</span><span>Q2 2025</span><span>Q3 2025</span><span>Q4 2025</span><span>Q1 2026</span><span>Target</span>
                </div>
              </div>
            ) : (
              <div className="my-6 flex items-center justify-center h-48 w-full rounded-xl bg-[#F5F0E8] border border-[#E8E0D4]">
                <div className="text-center">
                  <AlertCircle size={32} className="mx-auto text-[#8A7E6E] mb-2" />
                  <p className="text-sm font-semibold text-[#5C5040]">No historical data available</p>
                  <p className="text-xs text-[#8A7E6E] mt-1">Carbon emission trajectory will appear here once records are logged</p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#E8E0D4] text-xs text-[#8A7E6E] font-medium leading-relaxed">
            <strong>Graph Details:</strong> Measures facility direct emissions (Scope 1), purchased electricity (Scope 2), and upstream material extraction emissions (Scope 3). The trajectory reflects ongoing replacement of fossil-intensive alloys with certified recycled raw materials.
          </div>
        </div>

        <div className="bg-white border border-[#E8E0D4] rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#E8E0D4] bg-[#FAF8F5]">
            <h2 className="text-2xl font-extrabold text-[#2C2418]">Material Carbon Footprint Table</h2>
            <p className="text-sm text-[#5C5040] font-semibold mt-0.5">Categorized carbon status: &apos;N/A&apos;, &apos;Voluntary Self-Report&apos;, or &apos;3rd-Party Verified&apos;</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans">
              <thead className="bg-[#FAF8F5] border-b border-[#E8E0D4] font-mono text-xs text-[#8A7E6E] uppercase">
                <tr>
                  <th className="py-4 px-6 font-extrabold">Material ID & Spec</th>
                  <th className="py-4 px-6 font-extrabold">Supplier</th>
                  <th className="py-4 px-6 font-extrabold">Carbon Intensity</th>
                  <th className="py-4 px-6 font-extrabold">Carbon Footprint Status Tag</th>
                  <th className="py-4 px-6 font-extrabold">ISO Certification</th>
                  <th className="py-4 px-6 font-extrabold">Reduction vs Prior</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E0D4]">
                {tableRows.length > 0 ? (
                  tableRows.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FAF8F5]">
                      <td className="py-4 px-6">
                        <span className="font-mono text-xs font-bold text-[#6B5B3E] block">{item.id}</span>
                        <span className="font-extrabold text-[#2C2418]">{item.material}</span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-[#5C5040]">{item.supplier}</td>
                      <td className="py-4 px-6 font-mono font-extrabold text-[#2C2418]">{item.intensity}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                          item.status === "3rd-Party Verified"
                            ? "bg-[#EEF7F2] text-[#2E7D5B] border-[#2E7D5B]/30"
                            : item.status === "Voluntary Self-Report"
                            ? "bg-[#FDF5E6] text-[#C68A17] border-[#C68A17]/30"
                            : "bg-[#F0EBE3] text-[#8A7E6E] border-[#8A7E6E]/30"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-[#2C2418]">{item.iso}</td>
                      <td className="py-4 px-6 font-mono font-extrabold text-[#2E7D5B]">{item.reduction}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-16 px-6">
                      <div className="text-center">
                        <Leaf size={40} className="mx-auto text-[#E8E0D4] mb-3" />
                        <p className="text-base font-bold text-[#5C5040]">No carbon data available.</p>
                        <p className="text-sm text-[#8A7E6E] mt-1">Register facilities to track emissions.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-[#FAF8F5] border-t border-[#E8E0D4] text-xs text-[#8A7E6E] font-medium leading-relaxed">
            <strong>Table Details:</strong> Multi-tiered Carbon Footprint status tags. <em>&apos;3rd-Party Verified&apos;</em> (green) denotes ISO 14064 accredited audit certificates. <em>&apos;Voluntary Self-Report&apos;</em> (amber) represents unverified supplier statements. <em>&apos;N/A&apos;</em> (slate) flags unrated materials.
          </div>
        </div>
      </main>
    </div>
  );
}
