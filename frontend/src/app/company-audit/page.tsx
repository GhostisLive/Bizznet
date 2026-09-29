"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp
} from "lucide-react";

export default function CompanyAuditPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const companies = [
    {
      id: "ORG-101",
      name: "Tata Steel Ltd.",
      type: "Public Limited Corporation",
      registration: "GSTIN27AAAC1234F",
      creditRating: "AAA (Crisil Certified)",
      status: "3rd-Party Audited" as const,
      trustScore: "99.4 / 100",
      incorporation: "1907",
      taxStatus: "Active Compliant"
    },
    {
      id: "ORG-102",
      name: "Greenfield Polymers Ltd.",
      type: "Private Limited",
      registration: "GSTIN24AABC9876K",
      creditRating: "AA (Dun & Bradstreet)",
      status: "Voluntary" as const,
      trustScore: "88.2 / 100",
      incorporation: "2014",
      taxStatus: "Active Compliant"
    },
    {
      id: "ORG-103",
      name: "Vardhman Textiles Ltd.",
      type: "Public Limited Corporation",
      registration: "GSTIN03AAAC5432R",
      creditRating: "AA+ (ICRA Certified)",
      status: "3rd-Party Audited" as const,
      trustScore: "96.5 / 100",
      incorporation: "1965",
      taxStatus: "Active Compliant"
    },
    {
      id: "ORG-104",
      name: "Apex Auto Component Assembly",
      type: "Private Limited",
      registration: "GSTIN33AACA1122D",
      creditRating: "A+ (Self-Declared)",
      status: "Voluntary" as const,
      trustScore: "85.0 / 100",
      incorporation: "2018",
      taxStatus: "Active Compliant"
    },
    {
      id: "ORG-105",
      name: "Unregistered Small Vendor",
      type: "Partnership Firm",
      registration: "Pending Verification",
      creditRating: "Unrated",
      status: "Not Verified" as const,
      trustScore: "42.0 / 100",
      incorporation: "2024",
      taxStatus: "Under Review"
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
              Company Trust & Financial Audit
            </h1>
            <p className="text-base font-semibold text-[#5C5040] mt-1">
              Legal registration verification, tax compliance, and credit rating assurance matrix
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#EEF7F2] border border-[#2E7D5B]/30 rounded-xl text-xs font-mono font-bold text-[#2E7D5B]">
              <ShieldCheck size={16} />
              Verified Enterprise Node
            </span>
          </div>
        </div>

        {/* Top Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-[#8A7E6E]">Node Trust Index</span>
              <div className="p-2.5 bg-[#EEF7F2] rounded-xl text-[#2E7D5B]">
                <ShieldCheck size={20} />
              </div>
            </div>
            <h2 className="text-4xl font-extrabold text-[#2E7D5B] mt-3">94.8 / 100</h2>
            <p className="text-xs text-[#8A7E6E] font-semibold mt-2">AAA Corporate Trust Rating Verified</p>
          </div>

          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-[#8A7E6E]">Tax & GST Compliance</span>
              <div className="p-2.5 bg-[#EEF7F2] rounded-xl text-[#2E7D5B]">
                <CheckCircle2 size={20} />
              </div>
            </div>
            <h2 className="text-4xl font-extrabold text-[#2C2418] mt-3">100% Active</h2>
            <p className="text-xs text-[#8A7E6E] font-semibold mt-2">Zero tax defaults or filing delays</p>
          </div>

          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-[#8A7E6E]">Financial Solvency</span>
              <div className="p-2.5 bg-[#F5F0E8] rounded-xl text-[#6B5B3E]">
                <DollarSign size={20} />
              </div>
            </div>
            <h2 className="text-4xl font-extrabold text-[#2C2418] mt-3">High Solvency</h2>
            <p className="text-xs text-[#8A7E6E] font-semibold mt-2">Dun & Bradstreet rating updated Q1 2026</p>
          </div>
        </div>

        {/* Company Trust Trajectory Graph */}
        <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#E8E0D4] pb-4 mb-5">
              <div>
                <h3 className="text-xl font-extrabold text-[#2C2418]">Company Trust Score Trajectory</h3>
                <p className="text-xs text-[#8A7E6E] font-semibold mt-0.5 font-mono">Historical trust score stability over 4 fiscal quarters</p>
              </div>
              <span className="font-mono text-xs font-bold text-[#6B5B3E] bg-[#F5F0E8] px-3 py-1 rounded-full border border-[#6B5B3E]/20">
                Grade AAA
              </span>
            </div>

            <div className="my-6 relative h-48 w-full">
              <svg className="w-full h-full" viewBox="0 0 500 160" preserveAspectRatio="none">
                <path d="M 0,110 L 125,95 L 250,70 L 375,55 L 500,40" fill="none" stroke="#6B5B3E" strokeWidth="4" strokeLinecap="round" />
              </svg>
              <div className="flex justify-between text-xs font-mono text-[#8A7E6E] pt-2 border-t border-[#E8E0D4]">
                <span>Q2 2025</span><span>Q3 2025</span><span>Q4 2025</span><span>Q1 2026</span><span>Current</span>
              </div>
            </div>
          </div>

          {/* Explanatory Details Directly Below Graph */}
          <div className="pt-4 border-t border-[#E8E0D4] text-xs text-[#8A7E6E] font-medium leading-relaxed">
            <strong>Graph Details:</strong> Plots corporate trust rating evaluated by independent credit bureaus and tax filing verification engines. Higher scores unlock lower collateral requirements in BizzNet trade negotiations.
          </div>
        </div>

        {/* Company Audit Directory Table */}
        <div className="bg-white border border-[#E8E0D4] rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#E8E0D4] bg-[#FAF8F5]">
            <h2 className="text-2xl font-extrabold text-[#2C2418]">Corporate Trust Directory Table</h2>
            <p className="text-sm text-[#5C5040] font-semibold mt-0.5">Categorized trust status: 'Not Verified', 'Voluntary', or '3rd-Party Audited'</p>
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
                {companies.map(comp => (
                  <tr key={comp.id} className="hover:bg-[#FAF8F5]">
                    <td className="py-4 px-6">
                      <span className="font-mono text-xs font-bold text-[#6B5B3E] block">{comp.id}</span>
                      <span className="font-extrabold text-[#2C2418]">{comp.name}</span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-[#5C5040]">{comp.type}</td>
                    <td className="py-4 px-6 font-mono text-[#2C2418] font-bold">{comp.registration}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                        comp.status === "3rd-Party Audited"
                          ? "bg-[#EEF7F2] text-[#2E7D5B] border-[#2E7D5B]/30"
                          : comp.status === "Voluntary"
                          ? "bg-[#FDF5E6] text-[#C68A17] border-[#C68A17]/30"
                          : "bg-[#F0EBE3] text-[#8A7E6E] border-[#8A7E6E]/30"
                      }`}>
                        {comp.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-[#2C2418]">{comp.creditRating}</td>
                    <td className="py-4 px-6 font-mono font-extrabold text-[#2E7D5B]">{comp.trustScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Explanatory Details Directly Below Table */}
          <div className="p-4 bg-[#FAF8F5] border-t border-[#E8E0D4] text-xs text-[#8A7E6E] font-medium leading-relaxed">
            <strong>Table Details:</strong> Multi-tiered Company Trust badge tags. <em>'3rd-Party Audited'</em> (green) signifies corporate records audited by certified credit agencies. <em>'Voluntary'</em> (amber) represents self-submitted corporate documentation. <em>'Not Verified'</em> (slate) tags unverified vendors.
          </div>
        </div>
      </main>
    </div>
  );
}
