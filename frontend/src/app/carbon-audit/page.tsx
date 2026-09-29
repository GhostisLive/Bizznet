"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import {
  Leaf,
  ShieldCheck,
  CheckCircle2,
  TrendingDown,
  CloudRain,
  Activity
} from "lucide-react";

export default function CarbonAuditPage() {
  const carbonInventory = [
    {
      id: "CARB-501",
      material: "Cold-Rolled Steel Sheets CR4",
      supplier: "Tata Steel Ltd.",
      intensity: "2.1 kg CO₂e/kg",
      status: "3rd-Party Verified" as const,
      iso: "ISO 14064 Certified",
      scope: "Scope 1 + 2 + 3",
      reduction: "-12.4% vs 2024"
    },
    {
      id: "CARB-502",
      material: "Recycled HDPE Pellets",
      supplier: "Dalmia Polypro",
      intensity: "1.8 kg CO₂e/kg",
      status: "3rd-Party Verified" as const,
      iso: "ISO 14064 Certified",
      scope: "Scope 1 + 3",
      reduction: "-24.0% vs 2024"
    },
    {
      id: "CARB-503",
      material: "Organic Cotton Yarn 30Ne",
      supplier: "Vardhman Textiles",
      intensity: "5.4 kg CO₂e/kg",
      status: "Voluntary Self-Report" as const,
      iso: "Supplier Estimate",
      scope: "Scope 1 + 2",
      reduction: "-4.2% vs 2024"
    },
    {
      id: "CARB-504",
      material: "Virgin Aluminum Ingots AL-99",
      supplier: "Hindalco Industries",
      intensity: "8.4 kg CO₂e/kg",
      status: "Voluntary Self-Report" as const,
      iso: "Facility Self-Report",
      scope: "Scope 1 + 2",
      reduction: "-1.8% vs 2024"
    },
    {
      id: "CARB-505",
      material: "Unverified Local Raw Ore",
      supplier: "Small Mining Co.",
      intensity: "14.2 kg CO₂e/kg",
      status: "N/A" as const,
      iso: "Uncertified",
      scope: "Unreported",
      reduction: "0.0%"
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

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-[#8A7E6E]">Total YTD Carbon</span>
              <div className="p-2.5 bg-[#EEF7F2] rounded-xl text-[#2E7D5B]">
                <Leaf size={20} />
              </div>
            </div>
            <h2 className="text-4xl font-extrabold text-[#2C2418] mt-3">4,850 MT</h2>
            <p className="text-xs text-[#2E7D5B] font-bold mt-2 flex items-center gap-1">
              <TrendingDown size={14} /> -8.4% below 2025 baseline
            </p>
          </div>

          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-[#8A7E6E]">Avg Carbon Intensity</span>
              <div className="p-2.5 bg-[#EEF7F2] rounded-xl text-[#2E7D5B]">
                <Activity size={20} />
              </div>
            </div>
            <h2 className="text-4xl font-extrabold text-[#2E7D5B] mt-3">2.1 kg CO₂e/kg</h2>
            <p className="text-xs text-[#8A7E6E] font-semibold mt-2">Grade A Low Carbon Classification</p>
          </div>

          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-[#8A7E6E]">Scope 3 Upstream Coverage</span>
              <div className="p-2.5 bg-[#F5F0E8] rounded-xl text-[#6B5B3E]">
                <ShieldCheck size={20} />
              </div>
            </div>
            <h2 className="text-4xl font-extrabold text-[#2C2418] mt-3">88.4% Covered</h2>
            <p className="text-xs text-[#8A7E6E] font-semibold mt-2">12 Tier-1 suppliers mapped to registry</p>
          </div>
        </div>

        {/* Scope 1/2/3 Breakdown Chart */}
        <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#E8E0D4] pb-4 mb-5">
              <div>
                <h3 className="text-xl font-extrabold text-[#2C2418]">Scope 1, Scope 2 & Scope 3 Decarbonization Trajectory</h3>
                <p className="text-xs text-[#8A7E6E] font-semibold mt-0.5 font-mono">Emissions trajectory comparing facility direct vs supply chain indirect</p>
              </div>
              <span className="font-mono text-xs font-bold text-[#2E7D5B] bg-[#EEF7F2] px-3 py-1 rounded-full border border-[#2E7D5B]/20">
                Net Zero 2035 Target
              </span>
            </div>

            <div className="my-6 relative h-48 w-full">
              <svg className="w-full h-full" viewBox="0 0 500 160" preserveAspectRatio="none">
                <path d="M 0,130 L 100,110 L 200,90 L 300,70 L 400,50 L 500,35" fill="none" stroke="#2E7D5B" strokeWidth="4" strokeLinecap="round" />
              </svg>
              <div className="flex justify-between text-xs font-mono text-[#8A7E6E] pt-2 border-t border-[#E8E0D4]">
                <span>Q1 2025</span><span>Q2 2025</span><span>Q3 2025</span><span>Q4 2025</span><span>Q1 2026</span><span>Target</span>
              </div>
            </div>
          </div>

          {/* Explanatory Details Directly Below Chart */}
          <div className="pt-4 border-t border-[#E8E0D4] text-xs text-[#8A7E6E] font-medium leading-relaxed">
            <strong>Graph Details:</strong> Measures facility direct emissions (Scope 1), purchased electricity (Scope 2), and upstream material extraction emissions (Scope 3). The trajectory reflects ongoing replacement of fossil-intensive alloys with certified recycled raw materials.
          </div>
        </div>

        {/* Material Carbon Table */}
        <div className="bg-white border border-[#E8E0D4] rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#E8E0D4] bg-[#FAF8F5]">
            <h2 className="text-2xl font-extrabold text-[#2C2418]">Material Carbon Footprint Table</h2>
            <p className="text-sm text-[#5C5040] font-semibold mt-0.5">Categorized carbon status: 'N/A', 'Voluntary Self-Report', or '3rd-Party Verified'</p>
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
                  <th className="py-4 px-6 font-extrabold">Reduction vs 2024</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E0D4]">
                {carbonInventory.map(item => (
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
                ))}
              </tbody>
            </table>
          </div>

          {/* Explanatory Details Directly Below Table */}
          <div className="p-4 bg-[#FAF8F5] border-t border-[#E8E0D4] text-xs text-[#8A7E6E] font-medium leading-relaxed">
            <strong>Table Details:</strong> Multi-tiered Carbon Footprint status tags. <em>'3rd-Party Verified'</em> (green) denotes ISO 14064 accredited audit certificates. <em>'Voluntary Self-Report'</em> (amber) represents unverified supplier statements. <em>'N/A'</em> (slate) flags unrated materials.
          </div>
        </div>
      </main>
    </div>
  );
}
