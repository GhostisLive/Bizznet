"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import {
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Users,
  Search
} from "lucide-react";

export default function LabourAuditPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const auditFacilities = [
    {
      id: "LAB-801",
      facility: "Tata Steel Plant #4",
      location: "Jamshedpur, JH",
      workers: 2400,
      status: "3rd-Party Inspected" as const,
      auditor: "Bureau Veritas",
      lastAudit: "2026-02-15",
      sa8000: "Certified Grade A",
      wageCompliance: "100%",
      safetyScore: "98/100"
    },
    {
      id: "LAB-802",
      facility: "Greenfield Polymer Plant",
      location: "Dahej, GJ",
      workers: 650,
      status: "Worker Voluntary" as const,
      auditor: "Self-Submitted Survey",
      lastAudit: "2026-01-20",
      sa8000: "Voluntary Self-Report",
      wageCompliance: "96%",
      safetyScore: "91/100"
    },
    {
      id: "LAB-803",
      facility: "Vardhman Spinning Mill",
      location: "Ludhiana, PB",
      workers: 1850,
      status: "3rd-Party Inspected" as const,
      auditor: "SGS International",
      lastAudit: "2026-03-01",
      sa8000: "Certified Grade A",
      wageCompliance: "100%",
      safetyScore: "96/100"
    },
    {
      id: "LAB-804",
      facility: "Hindalco Smelter Division",
      location: "Renukoot, UP",
      workers: 3100,
      status: "3rd-Party Inspected" as const,
      auditor: "TÜV SÜD",
      lastAudit: "2026-02-28",
      sa8000: "Certified Grade A",
      wageCompliance: "100%",
      safetyScore: "99/100"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C2418] flex flex-col lg:flex-row font-sans">
      <Sidebar currentRole="Manufacturer" orgName="Manufacturer Alpha" />

      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-x-hidden max-w-[1600px] mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E8E0D4]">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#2C2418] tracking-tight">
              Labour & Fair Workplace Audit
            </h1>
            <p className="text-base font-semibold text-[#5C5040] mt-1">
              Social accountability (SA8000), worker welfare, and workplace safety inspection logs
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#EEF7F2] border border-[#2E7D5B]/30 rounded-xl text-xs font-mono font-bold text-[#2E7D5B]">
              <ShieldCheck size={16} />
              SA8000 Compliant Node
            </span>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-[#8A7E6E]">Audited Workforce</span>
              <div className="p-2.5 bg-[#F5F0E8] rounded-xl text-[#6B5B3E]">
                <Users size={20} />
              </div>
            </div>
            <h2 className="text-4xl font-extrabold text-[#2C2418] mt-3">8,000+</h2>
            <p className="text-xs text-[#8A7E6E] font-semibold mt-2">Active factory workers under verified audit</p>
          </div>

          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-[#8A7E6E]">Safety Rating Score</span>
              <div className="p-2.5 bg-[#EEF7F2] rounded-xl text-[#2E7D5B]">
                <ShieldCheck size={20} />
              </div>
            </div>
            <h2 className="text-4xl font-extrabold text-[#2E7D5B] mt-3">96.8 / 100</h2>
            <p className="text-xs text-[#8A7E6E] font-semibold mt-2">Zero critical safety violations recorded YTD</p>
          </div>

          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-[#8A7E6E]">Wage Compliance</span>
              <div className="p-2.5 bg-[#EEF7F2] rounded-xl text-[#2E7D5B]">
                <CheckCircle2 size={20} />
              </div>
            </div>
            <h2 className="text-4xl font-extrabold text-[#2C2418] mt-3">99.2%</h2>
            <p className="text-xs text-[#8A7E6E] font-semibold mt-2">Fair living wage & OT registry verified</p>
          </div>
        </div>

        {/* Visual Inspection Breakdown Chart */}
        <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#E8E0D4] pb-4 mb-5">
              <div>
                <h3 className="text-xl font-extrabold text-[#2C2418]">Labour Compliance Breakdown Graph</h3>
                <p className="text-xs text-[#8A7E6E] font-semibold mt-0.5 font-mono">Fair Wage Ratio, Health & Safety, Working Hours Limits</p>
              </div>
              <span className="font-mono text-xs font-bold text-[#2E7D5B] bg-[#EEF7F2] px-3 py-1 rounded-full border border-[#2E7D5B]/20">
                100% Certified
              </span>
            </div>

            <div className="my-6 relative h-48 w-full">
              <svg className="w-full h-full" viewBox="0 0 500 160" preserveAspectRatio="none">
                <path d="M 0,120 L 100,110 L 200,90 L 300,75 L 400,60 L 500,45" fill="none" stroke="#2E7D5B" strokeWidth="4" strokeLinecap="round" />
                <path d="M 0,140 L 100,130 L 200,120 L 300,105 L 400,90 L 500,80" fill="none" stroke="#6B5B3E" strokeWidth="3" strokeDasharray="5 3" strokeLinecap="round" />
              </svg>
              <div className="flex justify-between text-xs font-mono text-[#8A7E6E] pt-2 border-t border-[#E8E0D4]">
                <span>Q1 2025</span><span>Q2 2025</span><span>Q3 2025</span><span>Q4 2025</span><span>Q1 2026</span><span>Current</span>
              </div>
            </div>
          </div>

          {/* Explanatory Details Directly Below Graph */}
          <div className="pt-4 border-t border-[#E8E0D4] text-xs text-[#8A7E6E] font-medium leading-relaxed">
            <strong>Graph Details:</strong> Solid green line plots independent auditor safety compliance index over 6 quarters. Blue dashed line tracks worker voluntary survey satisfaction scores. 100% of manufacturing units meet international SA8000 standards.
          </div>
        </div>

        {/* Detailed Facility Table */}
        <div className="bg-white border border-[#E8E0D4] rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#E8E0D4] bg-[#FAF8F5]">
            <h2 className="text-2xl font-extrabold text-[#2C2418]">Facility Labour Inspection Table</h2>
            <p className="text-sm text-[#5C5040] font-semibold mt-0.5">Categorized audit status: 'Worker Voluntary' vs '3rd-Party Inspected'</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans">
              <thead className="bg-[#FAF8F5] border-b border-[#E8E0D4] font-mono text-xs text-[#8A7E6E] uppercase">
                <tr>
                  <th className="py-4 px-6 font-extrabold">Facility ID & Name</th>
                  <th className="py-4 px-6 font-extrabold">Location</th>
                  <th className="py-4 px-6 font-extrabold">Workers</th>
                  <th className="py-4 px-6 font-extrabold">Labour Audit Status Tag</th>
                  <th className="py-4 px-6 font-extrabold">Auditor Agency</th>
                  <th className="py-4 px-6 font-extrabold">Safety Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E0D4]">
                {auditFacilities.map(fac => (
                  <tr key={fac.id} className="hover:bg-[#FAF8F5]">
                    <td className="py-4 px-6">
                      <span className="font-mono text-xs font-bold text-[#6B5B3E] block">{fac.id}</span>
                      <span className="font-extrabold text-[#2C2418]">{fac.facility}</span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-[#5C5040]">{fac.location}</td>
                    <td className="py-4 px-6 font-mono font-bold text-[#2C2418]">{fac.workers.toLocaleString()}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                        fac.status === "3rd-Party Inspected"
                          ? "bg-[#EEF7F2] text-[#2E7D5B] border-[#2E7D5B]/30"
                          : "bg-[#FDF5E6] text-[#C68A17] border-[#C68A17]/30"
                      }`}>
                        {fac.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-[#2C2418]">{fac.auditor}</td>
                    <td className="py-4 px-6 font-mono font-extrabold text-[#2E7D5B]">{fac.safetyScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Explanatory Details Directly Below Table */}
          <div className="p-4 bg-[#FAF8F5] border-t border-[#E8E0D4] text-xs text-[#8A7E6E] font-medium leading-relaxed">
            <strong>Table Details:</strong> Multi-tiered labour audit badge system. <em>'3rd-Party Inspected'</em> (green) denotes physical site inspection by accredited agencies like Bureau Veritas or SGS. <em>'Worker Voluntary'</em> (amber) denotes internal worker survey submissions.
          </div>
        </div>
      </main>
    </div>
  );
}
