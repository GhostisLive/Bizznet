"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import {
  User,
  ShieldCheck,
  Building2,
  Key,
  CheckCircle2,
  Lock,
  Copy
} from "lucide-react";

export default function ProfilePage() {
  const [copied, setCopied] = useState(false);

  const nodeInfo = {
    name: "Manufacturer Alpha",
    roleLabel: "Manufacturer & Component Assembler",
    nodeId: "BIZZ-MFG-0914",
    taxId: "GSTIN33AACA1122D",
    location: "Chennai, Tamil Nadu, India",
    publicPublicKey: "0x8f9a2b7c4d1e3f6a5b8c7d9e0f1a2b3c4d5e6f7a",
    status: "Active Verified Node",
    created: "2025-01-15",
    scopeEmissions: "4,850 MT CO₂e",
    trustGrade: "AAA (99.4/100)"
  };

  const teamMembers = [
    { name: "Rajesh Sharma", role: "Head of Procurement & Supply Chain", email: "rajesh.s@alpha.com", access: "Full Admin" },
    { name: "Ananya Iyer", role: "ESG & Compliance Director", email: "ananya.i@alpha.com", access: "Audit Admin" },
    { name: "Vikram Malhotra", role: "Plant Operations Manager", email: "vikram.m@alpha.com", access: "Read / Write" }
  ];

  const handleCopyKey = () => {
    navigator.clipboard.writeText(nodeInfo.publicPublicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C2418] flex flex-col lg:flex-row font-sans">
      <Sidebar currentRole="Manufacturer" orgName="Manufacturer Alpha" />

      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-x-hidden max-w-[1600px] mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E8E0D4]">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#2C2418] tracking-tight">
              Organization Node Profile & Security Vault
            </h1>
            <p className="text-base font-semibold text-[#5C5040] mt-1">
              Cryptographic keys, GSTIN tax registration verification, and authorized node delegates
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#EEF7F2] border border-[#2E7D5B]/30 rounded-xl text-xs font-mono font-bold text-[#2E7D5B]">
              <ShieldCheck size={16} />
              Node Authenticated
            </span>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E0D4] pb-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2C2418] text-white font-extrabold text-2xl shadow-md">
                MA
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-[#2C2418]">{nodeInfo.name}</h2>
                <p className="text-sm font-semibold text-[#6B5B3E]">{nodeInfo.roleLabel}</p>
                <p className="text-xs text-[#8A7E6E] font-medium mt-0.5">{nodeInfo.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-4 py-1.5 bg-[#EEF7F2] text-[#2E7D5B] border border-[#2E7D5B]/30 rounded-full font-mono text-xs font-bold">
                {nodeInfo.status}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-sans">
            <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E8E0D4] space-y-2">
              <span className="text-xs font-mono font-bold text-[#8A7E6E] uppercase">GSTIN / VAT Identification</span>
              <p className="font-mono text-base font-extrabold text-[#2C2418]">{nodeInfo.taxId}</p>
              <p className="text-xs text-[#2E7D5B] font-bold">✓ Tax Registry Active & Verified</p>
            </div>

            <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E8E0D4] space-y-2">
              <span className="text-xs font-mono font-bold text-[#8A7E6E] uppercase">Node Identifier</span>
              <p className="font-mono text-base font-extrabold text-[#6B5B3E]">{nodeInfo.nodeId}</p>
              <p className="text-xs text-[#8A7E6E]">Node Created: {nodeInfo.created}</p>
            </div>
          </div>

          {/* Cryptographic Public Key */}
          <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E8E0D4] space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono font-bold text-[#8A7E6E] uppercase">Public Assayer Key</span>
              <button
                onClick={handleCopyKey}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#6B5B3E] hover:underline"
              >
                <Copy size={14} />
                {copied ? "Copied Key!" : "Copy Hash Key"}
              </button>
            </div>
            <p className="font-mono text-xs text-[#2C2418] font-bold break-all">{nodeInfo.publicPublicKey}</p>
          </div>

          {/* Text Below Profile Card */}
          <div className="pt-2 text-xs text-[#8A7E6E] font-medium leading-relaxed border-t border-[#E8E0D4]">
            <strong>Profile Details:</strong> Your node profile is permanently anchored to the BizzNet provenance network. Any contract signed under this key carries automatic ISO 14064 compliance verification.
          </div>
        </div>

        {/* Team Delegates Table */}
        <div className="bg-white border border-[#E8E0D4] rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#E8E0D4] bg-[#FAF8F5]">
            <h2 className="text-2xl font-extrabold text-[#2C2418]">Authorized Team Delegates</h2>
            <p className="text-sm text-[#5C5040] font-semibold mt-0.5">Personnel authorized to initiate buyer offers and lock contract terms</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans">
              <thead className="bg-[#FAF8F5] border-b border-[#E8E0D4] font-mono text-xs text-[#8A7E6E] uppercase">
                <tr>
                  <th className="py-4 px-6 font-extrabold">Delegate Name</th>
                  <th className="py-4 px-6 font-extrabold">Role / Title</th>
                  <th className="py-4 px-6 font-extrabold">Email Address</th>
                  <th className="py-4 px-6 font-extrabold">Permission Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E0D4]">
                {teamMembers.map(tm => (
                  <tr key={tm.email} className="hover:bg-[#FAF8F5]">
                    <td className="py-4 px-6 font-extrabold text-[#2C2418]">{tm.name}</td>
                    <td className="py-4 px-6 font-semibold text-[#5C5040]">{tm.role}</td>
                    <td className="py-4 px-6 font-mono text-[#2C2418]">{tm.email}</td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 rounded-full bg-[#F5F0E8] text-[#6B5B3E] font-mono text-xs font-bold border border-[#6B5B3E]/20">
                        {tm.access}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Text Below Team Table */}
          <div className="p-4 bg-[#FAF8F5] border-t border-[#E8E0D4] text-xs text-[#8A7E6E] font-medium leading-relaxed">
            <strong>Table Details:</strong> Full Admin delegates hold authority to approve contract executions and modify audit parameters. Read/Write delegates can post offers into negotiation channels.
          </div>
        </div>
      </main>
    </div>
  );
}
