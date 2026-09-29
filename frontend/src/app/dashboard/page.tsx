"use client";

import { useState, Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import {
  Handshake,
  ShieldCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
  Plus,
  RefreshCw,
  ArrowUpRight,
  DollarSign
} from "lucide-react";

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-base font-mono text-[#5C5040]">Loading BizzNet Executive Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrace, setSelectedTrace] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Active Negotiations Panel Data
  const [negotiations, setNegotiations] = useState([
    {
      id: "NEG-9081",
      counterpart: "Tata Steel Ltd.",
      item: "Cold-Rolled Steel CR4",
      volume: "50 MT",
      sellerAsk: 49500,
      buyerBid: 48200,
      status: "Agreed" as "Agreed" | "Countered" | "In Review",
      labourAudit: "3rd-Party Inspected" as const,
      companyTrust: "3rd-Party Audited" as const,
      carbonAudit: "3rd-Party Verified" as const,
      hash: "0x8f9a2b7c4d1e"
    },
    {
      id: "NEG-9084",
      counterpart: "Greenfield Polymers Ltd.",
      item: "Recycled HDPE Pellets",
      volume: "25 MT",
      sellerAsk: 74000,
      buyerBid: 72500,
      status: "Countered" as "Agreed" | "Countered" | "In Review",
      labourAudit: "Worker Voluntary" as const,
      companyTrust: "Voluntary" as const,
      carbonAudit: "3rd-Party Verified" as const,
      hash: "0x4e2d7f1c9a8b"
    },
    {
      id: "NEG-9089",
      counterpart: "Vardhman Textiles",
      item: "Organic Cotton Yarn 30Ne",
      volume: "500 kg",
      sellerAsk: 920,
      buyerBid: 890,
      status: "In Review" as "Agreed" | "Countered" | "In Review",
      labourAudit: "3rd-Party Inspected" as const,
      companyTrust: "3rd-Party Audited" as const,
      carbonAudit: "Voluntary Self-Report" as const,
      hash: "0x1b3c5d7e9f2a"
    },
    {
      id: "NEG-9092",
      counterpart: "Hindalco Industries",
      item: "Virgin Aluminum Ingots AL-99",
      volume: "15 MT",
      sellerAsk: 215000,
      buyerBid: 210000,
      status: "Countered" as "Agreed" | "Countered" | "In Review",
      labourAudit: "Worker Voluntary" as const,
      companyTrust: "Voluntary" as const,
      carbonAudit: "Voluntary Self-Report" as const,
      hash: "0x9c8b7a6f5e4d"
    },
    {
      id: "NEG-9097",
      counterpart: "Dalmia Polypro",
      item: "Recycled PET Flakes Green",
      volume: "40 MT",
      sellerAsk: 65000,
      buyerBid: 64000,
      status: "Agreed" as "Agreed" | "Countered" | "In Review",
      labourAudit: "3rd-Party Inspected" as const,
      companyTrust: "3rd-Party Audited" as const,
      carbonAudit: "3rd-Party Verified" as const,
      hash: "0x3a5b7c9d1e2f"
    }
  ]);

  // Active Order & Delivery Status Data
  const orderDeliveries = [
    { id: "ORD-7801", item: "Cold-Rolled Steel CR4 (50 MT)", counterpart: "Tata Steel Ltd.", status: "In Transit", stage: 3, totalStages: 5, eta: "2 Days", carrier: "BlueDart Logistics" },
    { id: "ORD-7804", item: "Recycled HDPE Pellets (25 MT)", counterpart: "Greenfield Polymers", status: "In Production", stage: 2, totalStages: 5, eta: "4 Days", carrier: "VRL Freight" },
    { id: "ORD-7809", item: "Organic Cotton Yarn 30Ne (500 kg)", counterpart: "Vardhman Textiles", status: "Customs Cleared", stage: 4, totalStages: 5, eta: "1 Day", carrier: "GATI Express" },
    { id: "ORD-7812", item: "Virgin Aluminum Ingots (15 MT)", counterpart: "Hindalco Ltd.", status: "Delivered", stage: 5, totalStages: 5, eta: "Delivered", carrier: "Mahindra Logistics" }
  ];

  // Production Phases & Status Data
  const productionPhases = [
    { phase: "Phase 1: Raw Material Sourcing & QC", activeBatch: "Batch #CR4-902", status: "Completed", progress: 100, auditorNote: "ISO-14064 Verified Sourcing" },
    { phase: "Phase 2: Precision Machining & Assembly", activeBatch: "Batch #GB-440", status: "In Progress", progress: 68, auditorNote: "Under Calibration Control" },
    { phase: "Phase 3: ESG & Audit Trail Verification", activeBatch: "Batch #LA-210", status: "In Progress", progress: 45, auditorNote: "SA8000 Labour Compliance Queue" },
    { phase: "Phase 4: Final Quality Check & Dispatch", activeBatch: "Batch #PK-880", status: "Queued", progress: 10, auditorNote: "Awaiting Phase 3 Signoff" }
  ];

  // Transaction History
  const transactionHistory = [
    { id: "TX-4091", timestamp: "2026-03-22 14:30", counterpart: "Tata Steel Ltd.", type: "Purchase", amount: "₹24,10,000", status: "Delivered" },
    { id: "TX-4088", timestamp: "2026-03-21 11:15", counterpart: "Metro Distribution", type: "Sale", amount: "₹43,50,000", status: "In Transit" },
    { id: "TX-4082", timestamp: "2026-03-20 09:45", counterpart: "Greenfield Polymers", type: "Purchase", amount: "₹18,12,500", status: "Customs Cleared" },
    { id: "TX-4075", timestamp: "2026-03-18 16:20", counterpart: "Nordic Lifestyle", type: "Sale", amount: "₹12,40,000", status: "Delivered" }
  ];

  const handleBidChange = (index: number, newBid: number) => {
    setNegotiations(prev => {
      const copy = [...prev];
      copy[index].buyerBid = newBid;
      copy[index].status = "Countered";
      return copy;
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C2418] flex flex-col lg:flex-row font-sans">
      
      {/* Sleek Dark-Slate Vertical Sidebar */}
      <Sidebar currentRole="Manufacturer" orgName="Manufacturer Alpha" />

      {/* Main Workspace Content */}
      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-x-hidden max-w-[1600px] mx-auto w-full">
        
        {/* Prominent Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E8E0D4]">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#2C2418] tracking-tight">
              Manufacturer Executive Dashboard
            </h1>
            <p className="text-base font-semibold text-[#5C5040] mt-1">
              BizzNet Supply Chain & Trust Verification Intelligence Platform
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E8E0D4] shadow-sm text-xs font-mono font-bold text-[#2C2418]">
              <span className="size-2.5 rounded-full bg-[#2E7D5B]" />
              ISO-14064 Verified
            </span>
            <button
              onClick={() => alert("Synchronizing full supply chain ledger...")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2C2418] hover:bg-[#4E4433] text-white rounded-xl text-xs font-bold shadow-md transition-colors"
            >
              <RefreshCw size={16} className="text-[#7D6B4D]" />
              Sync Ledger
            </button>
          </div>
        </div>

        {/* 1. Top Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8A7E6E]">Active Negotiations</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F0E8] text-[#6B5B3E]">
                <Handshake size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <h2 className="text-4xl font-extrabold text-[#2C2418] tracking-tight">14 Deals</h2>
              <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#2E7D5B] bg-[#EEF7F2] px-3 py-1 rounded-full border border-[#2E7D5B]/20">
                <TrendingUp size={14} /> +3 this week
              </span>
            </div>
            <p className="text-xs text-[#8A7E6E] font-semibold mt-3">₹1.42 Cr active bid volume across 6 tier-1 suppliers</p>
          </div>

          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8A7E6E]">Monthly Volume</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF7F2] text-[#2E7D5B]">
                <DollarSign size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <h2 className="text-4xl font-extrabold text-[#2C2418] tracking-tight">₹4.82 Cr</h2>
              <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#2E7D5B] bg-[#EEF7F2] px-3 py-1 rounded-full border border-[#2E7D5B]/20">
                +14.2% MoM
              </span>
            </div>
            <p className="text-xs text-[#8A7E6E] font-semibold mt-3">320 MT high-grade materials procured & delivered</p>
          </div>

          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8A7E6E]">Pending Verifications</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FDF5E6] text-[#C68A17]">
                <Clock size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <h2 className="text-4xl font-extrabold text-[#2C2418] tracking-tight">5 Requests</h2>
              <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#C68A17] bg-[#FDF5E6] px-3 py-1 rounded-full border border-[#C68A17]/20">
                Auditor Queued
              </span>
            </div>
            <p className="text-xs text-[#8A7E6E] font-semibold mt-3">2 Labour audits & 3 Scope 3 emissions pending</p>
          </div>
        </div>

        {/* 2. Order & Delivery Status + Production Phases Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order & Delivery Status */}
          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#E8E0D4] pb-4 mb-5">
                <div>
                  <h3 className="text-xl font-extrabold text-[#2C2418]">Order & Delivery Status</h3>
                  <p className="text-sm text-[#5C5040] font-semibold mt-0.5">Real-time consignment tracking across transit stages</p>
                </div>
                <span className="font-mono text-xs font-bold text-[#6B5B3E] bg-[#F5F0E8] px-3 py-1 rounded-full border border-[#6B5B3E]/20">
                  Active Logistics
                </span>
              </div>

              <div className="space-y-4">
                {orderDeliveries.map((order) => {
                  const percent = Math.round((order.stage / order.totalStages) * 100);
                  return (
                    <div key={order.id} className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E8E0D4] space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#6B5B3E]">{order.id}</span>
                          <span className="font-bold text-[#2C2418]">{order.item}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-bold ${
                          order.status === "Delivered"
                            ? "bg-[#EEF7F2] text-[#2E7D5B] border border-[#2E7D5B]/30"
                            : order.status === "In Transit"
                            ? "bg-[#F5F0E8] text-[#6B5B3E] border border-[#6B5B3E]/30"
                            : "bg-[#FDF5E6] text-[#C68A17] border border-[#C68A17]/30"
                        }`}>
                          {order.status}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs text-[#8A7E6E] font-semibold">
                        <span>Counterparty: <strong className="text-[#2C2418]">{order.counterpart}</strong></span>
                        <span>ETA: <strong className="text-[#2C2418] font-mono">{order.eta}</strong> ({order.carrier})</span>
                      </div>

                      {/* 5-Stage Logistics Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-[#8A7E6E] font-bold">
                          <span>Stage {order.stage}/5</span>
                          <span>{percent}% Progress</span>
                        </div>
                        <div className="h-2.5 w-full bg-[#E8E0D4] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              order.status === "Delivered" ? "bg-[#2E7D5B]" : "bg-[#6B5B3E]"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Details Directly Below Card */}
            <div className="mt-6 pt-4 border-t border-[#E8E0D4] space-y-2">
              <div className="flex justify-between items-center text-sm font-mono text-[#8A7E6E]">
                <span>On-Time Delivery Rate: <strong className="text-[#2E7D5B] font-extrabold">98.4%</strong></span>
                <button onClick={() => alert("Opening live GPS consignment tracking...")} className="font-bold text-[#6B5B3E] hover:underline">
                  View Live GPS Map
                </button>
              </div>
              <p className="text-xs text-[#8A7E6E] leading-relaxed pt-1">
                <strong>Logistics Summary:</strong> 4 active shipments in transit. ORD-7812 is fully delivered with smart bill of lading notarization completed.
              </p>
            </div>
          </div>

          {/* Production Phases & Status */}
          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#E8E0D4] pb-4 mb-5">
                <div>
                  <h3 className="text-xl font-extrabold text-[#2C2418]">Production Phases & Status</h3>
                  <p className="text-sm text-[#5C5040] font-semibold mt-0.5">Sequential manufacturing workflow & audit checkpoints</p>
                </div>
                <span className="font-mono text-xs font-bold text-[#2E7D5B] bg-[#EEF7F2] px-3 py-1 rounded-full border border-[#2E7D5B]/20">
                  Shopfloor Workflow
                </span>
              </div>

              <div className="space-y-4">
                {productionPhases.map((phase) => (
                  <div key={phase.phase} className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E8E0D4] space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-[#2C2418]">{phase.phase}</span>
                      <span className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-bold ${
                        phase.status === "Completed"
                          ? "bg-[#EEF7F2] text-[#2E7D5B]"
                          : phase.status === "In Progress"
                          ? "bg-[#FDF5E6] text-[#C68A17]"
                          : "bg-[#F0EBE3] text-[#8A7E6E]"
                      }`}>
                        {phase.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs font-mono text-[#8A7E6E]">
                      <span>Active: <strong className="text-[#6B5B3E]">{phase.activeBatch}</strong></span>
                      <span className="text-[#2E7D5B] font-bold">{phase.auditorNote}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono text-[#8A7E6E]">
                        <span>Completion</span>
                        <span className="font-bold text-[#2C2418]">{phase.progress}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-[#E8E0D4] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            phase.progress === 100 ? "bg-[#2E7D5B]" : phase.progress > 50 ? "bg-[#6B5B3E]" : "bg-[#C68A17]"
                          }`}
                          style={{ width: `${phase.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Details Directly Below Card */}
            <div className="mt-6 pt-4 border-t border-[#E8E0D4] space-y-2">
              <div className="flex justify-between items-center text-sm font-mono text-[#8A7E6E]">
                <span>Overall Shopfloor OEE: <strong className="text-[#2C2418] font-extrabold">91.8%</strong></span>
                <button onClick={() => alert("Initiating batch audit inspection...")} className="font-bold text-[#6B5B3E] hover:underline">
                  + Request Auditor Check
                </button>
              </div>
              <p className="text-xs text-[#8A7E6E] leading-relaxed pt-1">
                <strong>Phase Analysis:</strong> Phase 1 is 100% complete and verified. Phase 2 (Batch #GB-440) is currently operating at 68% completion with zero quality defects recorded.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Interactive Data Visualizations with Details Below */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visual 1: Emissions Area Chart */}
          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#E8E0D4] pb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-[#2C2418]">Emissions Area Chart</h3>
                  <p className="text-xs text-[#8A7E6E] font-semibold mt-0.5">Scope 1, 2 & 3 Carbon Footprint (MT CO2e)</p>
                </div>
                <span className="font-mono text-xs font-bold text-[#2E7D5B] bg-[#EEF7F2] px-2.5 py-1 rounded-full border border-[#2E7D5B]/20">
                  -8.4% YTD
                </span>
              </div>

              <div className="my-6 relative h-48 w-full">
                <svg className="w-full h-full" viewBox="0 0 400 160" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="emissions-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2E7D5B" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#2E7D5B" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d="M 0,130 L 80,110 L 160,90 L 240,70 L 320,50 L 400,30 L 400,160 L 0,160 Z" fill="url(#emissions-gradient)" />
                  <path d="M 0,130 L 80,110 L 160,90 L 240,70 L 320,50 L 400,30" fill="none" stroke="#2E7D5B" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <div className="flex justify-between items-center text-xs font-mono text-[#8A7E6E] pt-2 border-t border-[#E8E0D4]">
                  <span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span>
                </div>
              </div>
            </div>

            {/* Explanatory Text Below Graph */}
            <div className="pt-4 border-t border-[#E8E0D4] space-y-1">
              <div className="flex justify-between items-center text-xs font-mono text-[#8A7E6E]">
                <span>Current Intensity: <strong className="text-[#2C2418] font-bold">2.1 kg CO2e/kg</strong></span>
                <span className="text-[#2E7D5B] font-bold">Grade A Certified</span>
              </div>
              <p className="text-xs text-[#8A7E6E] leading-relaxed pt-1">
                <strong>Chart Details:</strong> Tracks total greenhouse gas emissions across facility power (Scope 1 & 2) and upstream supplier transportation (Scope 3). The 8.4% drop reflects recycled polymer adoption.
              </p>
            </div>
          </div>

          {/* Visual 2: Dual-Line Graph Tracking Deal Velocity */}
          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#E8E0D4] pb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-[#2C2418]">Deal Velocity Graph</h3>
                  <p className="text-xs text-[#8A7E6E] font-semibold mt-0.5">Close Days vs Acceptance Rate (%)</p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex items-center gap-1 font-bold text-[#6B5B3E]"><span className="size-2 rounded-full bg-[#6B5B3E]" /> Days</span>
                  <span className="flex items-center gap-1 font-bold text-[#2E7D5B]"><span className="size-2 rounded-full bg-[#2E7D5B]" /> Rate</span>
                </div>
              </div>

              <div className="my-6 relative h-48 w-full">
                <svg className="w-full h-full" viewBox="0 0 400 160" preserveAspectRatio="none">
                  <path d="M 0,140 L 80,120 L 160,95 L 240,75 L 320,60 L 400,40" fill="none" stroke="#6B5B3E" strokeWidth="3" strokeLinecap="round" />
                  <path d="M 0,80 L 80,65 L 160,50 L 240,40 L 320,30 L 400,20" fill="none" stroke="#2E7D5B" strokeWidth="3" strokeDasharray="5 3" strokeLinecap="round" />
                </svg>
                <div className="flex justify-between items-center text-xs font-mono text-[#8A7E6E] pt-2 border-t border-[#E8E0D4]">
                  <span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span>
                </div>
              </div>
            </div>

            {/* Explanatory Text Below Graph */}
            <div className="pt-4 border-t border-[#E8E0D4] space-y-1">
              <div className="flex justify-between items-center text-xs font-mono text-[#8A7E6E]">
                <span>Avg Negotiation Cycle: <strong className="text-[#2C2418] font-bold">3.2 Days</strong></span>
                <span className="text-[#6B5B3E] font-bold">+28% Efficiency</span>
              </div>
              <p className="text-xs text-[#8A7E6E] leading-relaxed pt-1">
                <strong>Chart Details:</strong> Blue line measures average turnaround time to finalize terms. Green dashed line measures contract win rate. Automated audit proofing has cut negotiation duration by 28%.
              </p>
            </div>
          </div>

          {/* Visual 3: Trust-Verification Donut Charts */}
          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#E8E0D4] pb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-[#2C2418]">Trust-Verification Donut</h3>
                  <p className="text-xs text-[#8A7E6E] font-semibold mt-0.5">Assurance level breakdown across active suppliers</p>
                </div>
              </div>

              <div className="my-4 flex items-center justify-center relative">
                <svg className="w-40 h-40 -rotate-90 transform" viewBox="0 0 36 36">
                  <path className="text-[#F0EBE3]" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-[#2E7D5B]" strokeDasharray="68, 100" strokeWidth="4" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-[#C68A17]" strokeDasharray="22, 100" strokeDashoffset="-68" strokeWidth="4" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-[#8A7E6E]" strokeDasharray="10, 100" strokeDashoffset="-90" strokeWidth="4" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-extrabold text-[#2C2418] block font-sans">68%</span>
                  <span className="text-[10px] font-mono text-[#2E7D5B] font-bold uppercase">3rd-Party Verified</span>
                </div>
              </div>
            </div>

            {/* Explanatory Text Below Donut */}
            <div className="pt-4 border-t border-[#E8E0D4] space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono text-[#8A7E6E]">
                <span className="flex items-center gap-1.5 text-[#2C2418] font-bold"><span className="size-2.5 rounded-full bg-[#2E7D5B]" /> 3rd-Party Verified</span>
                <strong className="text-[#2C2418]">68%</strong>
              </div>
              <div className="flex justify-between items-center text-xs font-mono text-[#8A7E6E]">
                <span className="flex items-center gap-1.5 text-[#2C2418] font-bold"><span className="size-2.5 rounded-full bg-[#C68A17]" /> Voluntary / Audited</span>
                <strong className="text-[#2C2418]">22%</strong>
              </div>
              <div className="flex justify-between items-center text-xs font-mono text-[#8A7E6E]">
                <span className="flex items-center gap-1.5 text-[#2C2418] font-bold"><span className="size-2.5 rounded-full bg-[#8A7E6E]" /> Worker Voluntary</span>
                <strong className="text-[#2C2418]">10%</strong>
              </div>
              <p className="text-xs text-[#8A7E6E] leading-relaxed pt-1">
                <strong>Chart Details:</strong> Categorizes the trustworthiness of material origins. 68% of volume carries third-party accredited certificates, 22% has facility audit records, and 10% is supplier-declared.
              </p>
            </div>
          </div>
        </div>

        {/* 4. Active Negotiations Panel */}
        <div className="bg-white border border-[#E8E0D4] rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#E8E0D4] bg-[#FAF8F5] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-[#2C2418]">Active Negotiations Panel</h2>
              <p className="text-sm text-[#5C5040] font-semibold mt-0.5">Live offer/counter-offer channels with multi-tiered audit status badges</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search counterpart or item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 border border-[#E8E0D4] bg-white rounded-xl text-xs text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans">
              <thead className="bg-[#FAF8F5] border-b border-[#E8E0D4] font-mono text-xs text-[#8A7E6E] uppercase">
                <tr>
                  <th className="py-4 px-6 font-extrabold">Deal ID & Item</th>
                  <th className="py-4 px-6 font-extrabold">Counterparty</th>
                  <th className="py-4 px-6 font-extrabold">Seller Ask</th>
                  <th className="py-4 px-6 font-extrabold">Buyer Bid (Interactive)</th>
                  <th className="py-4 px-6 font-extrabold">Status Chip</th>
                  <th className="py-4 px-6 font-extrabold">Multi-Tiered Audit Badges</th>
                  <th className="py-4 px-6 font-extrabold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E0D4]">
                {negotiations
                  .filter(n => n.counterpart.toLowerCase().includes(searchQuery.toLowerCase()) || n.item.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((neg, idx) => (
                    <tr key={neg.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-4 px-6">
                        <span className="font-mono font-bold text-[#6B5B3E] block">{neg.id}</span>
                        <span className="font-extrabold text-[#2C2418]">{neg.item}</span>
                        <span className="text-xs font-mono text-[#8A7E6E] block">{neg.volume}</span>
                      </td>
                      <td className="py-4 px-6 font-bold text-[#2C2418]">
                        {neg.counterpart}
                      </td>
                      <td className="py-4 px-6 font-mono font-extrabold text-[#2C2418]">
                        ₹{neg.sellerAsk.toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[#8A7E6E]">₹</span>
                          <input
                            type="number"
                            value={neg.buyerBid}
                            onChange={(e) => handleBidChange(idx, Number(e.target.value))}
                            className="w-32 px-3 py-1.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-lg text-xs font-mono font-bold text-[#2C2418] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
                          />
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                          neg.status === "Agreed"
                            ? "bg-[#EEF7F2] text-[#2E7D5B] border-[#2E7D5B]/30"
                            : neg.status === "Countered"
                            ? "bg-[#FDF5E6] text-[#C68A17] border-[#C68A17]/30"
                            : "bg-[#F5F0E8] text-[#6B5B3E] border-[#6B5B3E]/30"
                        }`}>
                          <span className="size-1.5 rounded-full bg-current" />
                          {neg.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                            neg.labourAudit === "3rd-Party Inspected" ? "bg-[#EEF7F2] text-[#2E7D5B] border-[#2E7D5B]/30" : "bg-[#FDF5E6] text-[#C68A17] border-[#C68A17]/30"
                          }`}>
                            Labour: {neg.labourAudit}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                            neg.companyTrust === "3rd-Party Audited" ? "bg-[#EEF7F2] text-[#2E7D5B] border-[#2E7D5B]/30" : "bg-[#FDF5E6] text-[#C68A17] border-[#C68A17]/30"
                          }`}>
                            Company: {neg.companyTrust}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                            neg.carbonAudit === "3rd-Party Verified" ? "bg-[#EEF7F2] text-[#2E7D5B] border-[#2E7D5B]/30" : "bg-[#FDF5E6] text-[#C68A17] border-[#C68A17]/30"
                          }`}>
                            Carbon: {neg.carbonAudit}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => {
                            setSelectedTrace(neg);
                            setIsModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#F5F0E8] hover:bg-[#EDE7DC] text-[#6B5B3E] text-xs font-bold rounded-lg transition-colors"
                        >
                          View Provenance
                          <ArrowUpRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Details Directly Below Table */}
          <div className="p-4 bg-[#FAF8F5] border-t border-[#E8E0D4] text-xs text-[#8A7E6E] font-medium leading-relaxed">
            <strong>Table Details:</strong> Displays active pricing channels. Adjusting the <em>Buyer Bid</em> field updates the channel state to <em>'Countered'</em> in real-time. Click <em>View Provenance</em> to inspect the tamper-proof cryptographic audit trail.
          </div>
        </div>

        {/* 5. Transaction History Log */}
        <div className="bg-white border border-[#E8E0D4] rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#E8E0D4] bg-[#FAF8F5] flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-[#2C2418]">Transaction History Log</h2>
              <p className="text-sm text-[#5C5040] font-semibold mt-0.5">Completed purchases and sales with timestamps & delivery statuses</p>
            </div>
            <span className="font-mono text-xs font-bold text-[#8A7E6E] bg-white border border-[#E8E0D4] px-3 py-1 rounded-lg shadow-xs">
              Audit Hash Verified
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans">
              <thead className="bg-[#FAF8F5] border-b border-[#E8E0D4] font-mono text-xs text-[#8A7E6E] uppercase">
                <tr>
                  <th className="py-3.5 px-6 font-extrabold">TX ID</th>
                  <th className="py-3.5 px-6 font-extrabold">Timestamp</th>
                  <th className="py-3.5 px-6 font-extrabold">Counterparty</th>
                  <th className="py-3.5 px-6 font-extrabold">Type</th>
                  <th className="py-3.5 px-6 font-extrabold">Order Value</th>
                  <th className="py-3.5 px-6 font-extrabold text-right">Delivery Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E0D4]">
                {transactionHistory.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-[#6B5B3E]">
                      {tx.id}
                    </td>
                    <td className="py-4 px-6 font-mono text-[#8A7E6E] font-bold">
                      {tx.timestamp}
                    </td>
                    <td className="py-4 px-6 font-bold text-[#2C2418]">
                      {tx.counterpart}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full font-mono text-xs font-bold ${
                        tx.type === "Purchase" ? "bg-[#F5F0E8] text-[#6B5B3E]" : "bg-[#EEF7F2] text-[#2E7D5B]"
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono font-extrabold text-[#2C2418]">
                      {tx.amount}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF7F2] text-[#2E7D5B] font-mono font-bold border border-[#2E7D5B]/20">
                        <CheckCircle2 size={14} /> {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Details Directly Below Table */}
          <div className="p-4 bg-[#FAF8F5] border-t border-[#E8E0D4] text-xs text-[#8A7E6E] font-medium leading-relaxed">
            <strong>Table Details:</strong> Historical ledger of finalized contracts. Every entry is immutably timestamped and linked to smart bill of lading documentation.
          </div>
        </div>

      </main>

      {/* Modal for View Provenance */}
      {isModalOpen && selectedTrace && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8E0D4] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#E8E0D4] pb-4">
              <div>
                <span className="font-mono text-xs text-[#6B5B3E] font-bold">{selectedTrace.id}</span>
                <h3 className="text-xl font-extrabold text-[#2C2418]">{selectedTrace.item}</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#A89B8A] hover:text-[#2C2418] text-base font-mono font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm font-sans">
              <div className="flex justify-between py-2 border-b border-[#F0EBE3]">
                <span className="text-[#8A7E6E] font-semibold">Counterparty</span>
                <span className="font-bold text-[#2C2418]">{selectedTrace.counterpart}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#F0EBE3]">
                <span className="text-[#8A7E6E] font-semibold">Volume</span>
                <span className="font-bold text-[#2C2418]">{selectedTrace.volume}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#F0EBE3]">
                <span className="text-[#8A7E6E] font-semibold">Labour Audit Status</span>
                <span className="font-mono font-bold text-[#2E7D5B]">{selectedTrace.labourAudit}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#F0EBE3]">
                <span className="text-[#8A7E6E] font-semibold">Company Trust Audit</span>
                <span className="font-mono font-bold text-[#2E7D5B]">{selectedTrace.companyTrust}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#F0EBE3]">
                <span className="text-[#8A7E6E] font-semibold">Carbon Audit Status</span>
                <span className="font-mono font-bold text-[#2E7D5B]">{selectedTrace.carbonAudit}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#F0EBE3]">
                <span className="text-[#8A7E6E] font-semibold">Provenance Hash</span>
                <span className="font-mono text-xs text-[#6B5B3E] font-bold">
                  {selectedTrace.hash}89ef01a2b3c
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 bg-[#2C2418] hover:bg-[#4E4433] text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
              >
                Close Trace Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
