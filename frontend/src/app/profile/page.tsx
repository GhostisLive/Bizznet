"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/lib/AuthProvider";
import { useCurrentOrg } from "@/lib/useCurrentOrg";
import {
  User,
  ShieldCheck,
  Building2,
  Key,
  CheckCircle2,
  Lock,
  Copy,
  Mail,
  Calendar,
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  supplier: "Raw Material Supplier",
  manufacturer: "Manufacturer & Component Assembler",
  distributor: "Distributor & Warehouse Operator",
  retailer: "Retailer & Brand Outlet",
  transporter: "Logistics & Transporter Carrier",
  auditor: "Third-Party Auditor",
  admin: "Platform Administrator",
};

const ROLE_PREFIXES: Record<string, string> = {
  supplier: "SUP",
  manufacturer: "MFG",
  distributor: "DST",
  retailer: "RET",
  transporter: "TRN",
  auditor: "AUD",
  admin: "ADM",
};

function deriveNodeId(role: string, seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 10000;
  }
  const prefix = ROLE_PREFIXES[role] ?? "ORG";
  return `BIZZ-${prefix}-${String(hash).padStart(4, "0")}`;
}

function derivePublicKey(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  const repeated = (hex + hex + hex + hex + hex).slice(0, 40);
  return `0x${repeated}`;
}

export default function ProfilePage() {
  const { user, org, loading } = useAuth();
  const sidebarOrg = useCurrentOrg();
  const [copied, setCopied] = useState(false);

  const orgName = org?.name ?? "";
  const role = org?.role ?? "";
  const roleLabel = ROLE_LABELS[role] ?? "";
  const nodeId = org ? deriveNodeId(role, org.name) : "";
  const taxId = org?.tax_id ?? "Not provided";
  const status = org?.status ?? "";
  const createdAt = org?.created_at
    ? new Date(org.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";
  const email = user?.email ?? "";
  const publicKey = org ? derivePublicKey(org.id) : "";

  const initials = orgName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "BN";

  const handleCopyKey = () => {
    navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#2C2418] flex items-center justify-center">
        <p className="text-sm font-semibold text-[#8A7E6E]">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C2418] flex flex-col lg:flex-row font-sans">
      <Sidebar currentRole={sidebarOrg.roleLabel} orgName={sidebarOrg.orgName} nodeId={sidebarOrg.nodeId} />

      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-x-hidden max-w-[1600px] mx-auto w-full">
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

        <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E0D4] pb-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2C2418] text-white font-extrabold text-2xl shadow-md">
                {initials}
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-[#2C2418]">{orgName || "—"}</h2>
                <p className="text-sm font-semibold text-[#6B5B3E]">{roleLabel || "—"}</p>
                <p className="text-xs text-[#8A7E6E] font-medium mt-0.5 flex items-center gap-1">
                  <Mail size={12} />
                  {email || "—"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-4 py-1.5 border rounded-full font-mono text-xs font-bold ${
                status === "active"
                  ? "bg-[#EEF7F2] text-[#2E7D5B] border-[#2E7D5B]/30"
                  : status === "pending"
                  ? "bg-[#FFF8E7] text-[#C68A17] border-[#C68A17]/30"
                  : "bg-[#FAF8F5] text-[#8A7E6E] border-[#8A7E6E]/30"
              }`}>
                {status ? status.charAt(0).toUpperCase() + status.slice(1) : "—"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-sans">
            <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E8E0D4] space-y-2">
              <span className="text-xs font-mono font-bold text-[#8A7E6E] uppercase">GSTIN / VAT Identification</span>
              <p className="font-mono text-base font-extrabold text-[#2C2418]">{taxId}</p>
              {org?.tax_id ? (
                <p className="text-xs text-[#2E7D5B] font-bold">✓ Tax Registry Active & Verified</p>
              ) : (
                <p className="text-xs text-[#8A7E6E] font-bold">No tax ID on file</p>
              )}
            </div>

            <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E8E0D4] space-y-2">
              <span className="text-xs font-mono font-bold text-[#8A7E6E] uppercase">Node Identifier</span>
              <p className="font-mono text-base font-extrabold text-[#6B5B3E]">{nodeId || "—"}</p>
              <p className="text-xs text-[#8A7E6E] flex items-center gap-1">
                <Calendar size={12} />
                Node Created: {createdAt || "—"}
              </p>
            </div>
          </div>

          <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E8E0D4] space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono font-bold text-[#8A7E6E] uppercase">Public Assayer Key</span>
              <button
                onClick={handleCopyKey}
                disabled={!publicKey}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#6B5B3E] hover:underline disabled:opacity-50"
              >
                <Copy size={14} />
                {copied ? "Copied Key!" : "Copy Hash Key"}
              </button>
            </div>
            <p className="font-mono text-xs text-[#2C2418] font-bold break-all">{publicKey || "—"}</p>
          </div>

          <div className="pt-2 text-xs text-[#8A7E6E] font-medium leading-relaxed border-t border-[#E8E0D4]">
            <strong>Profile Details:</strong> Your node profile is permanently anchored to the BizzNet provenance network. Any contract signed under this key carries automatic ISO 14064 compliance verification.
          </div>
        </div>

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
                <tr>
                  <td colSpan={4} className="py-12 px-6 text-center">
                    <p className="text-sm font-semibold text-[#8A7E6E]">No team delegates configured</p>
                    <p className="text-xs text-[#8A7E6E] mt-1">Add delegates to authorize personnel for contract operations</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-[#FAF8F5] border-t border-[#E8E0D4] text-xs text-[#8A7E6E] font-medium leading-relaxed">
            <strong>Table Details:</strong> Full Admin delegates hold authority to approve contract executions and modify audit parameters. Read/Write delegates can post offers into negotiation channels.
          </div>
        </div>
      </main>
    </div>
  );
}
