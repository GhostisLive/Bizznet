"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import {
  Store,
  Search,
  ShieldCheck,
  ClipboardCheck,
  Layers,
  ArrowRight,
  MapPin,
  Leaf,
  Package,
  PackageSearch,
  X,
  Loader2,
  BadgeCheck,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Plus,
  Filter,
  Handshake,
  DollarSign,
  Truck,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";
import { useCurrentOrg } from "@/lib/useCurrentOrg";
import { api } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface DbRFQ {
  id: string;
  buyer_id: string;
  title: string;
  description: string | null;
  category: string;
  quantity_required: number;
  unit: string;
  budget_min: number | null;
  budget_max: number | null;
  currency: string;
  delivery_deadline: string | null;
  delivery_location: any | null;
  provenance_requirement: string | null;
  additional_requirements: any | null;
  status: string;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  buyer_org: { name: string; role: string } | null;
}

interface DbRFQBid {
  id: string;
  rfq_id: string;
  supplier_id: string;
  price_per_unit: number;
  total_price: number;
  currency: string;
  quantity_offered: number;
  unit: string;
  lead_time_days: number | null;
  delivery_terms: string | null;
  provenance_grade: string | null;
  technical_proposal: string | null;
  validity_days: number;
  status: string;
  created_at: string;
  updated_at: string;
  supplier_org: { name: string; role: string } | null;
}

const PROVENANCE_LABELS: Record<string, "Verified" | "Audited" | "Self-Reported" | "Not Specified"> = {
  verified: "Verified",
  audited: "Audited",
  self_reported: "Self-Reported",
  null: "Not Specified",
  undefined: "Not Specified",
};

function getProvenanceBadge(grade: string | null, score?: number) {
  const label = PROVENANCE_LABELS[grade || ""] || "Not Specified";
  
  const badge =
    grade === "verified" ? (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold bg-[#EEF7F2] text-[#2E7D5B] border border-[#2E7D5B]/20">
        <ShieldCheck size={11} /> Verified{score !== undefined && score !== 100 ? ` ${score}%` : ""}
      </span>
    ) : grade === "audited" ? (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold bg#[FDF5E6] text-[#C68A17] border border-[#C68A17]/20">
        <ClipboardCheck size={11} /> Audited
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold bg-[#F0EBE3] text-[#8A7E6E] border border-[#8A7E6E]/20">
        <Layers size={11} /> Self-Reported
      </span>
    );

  return badge;
}

const STORAGE_KEY_RFQ_FILTERS = "bizznet:rfq-filters";

export default function RFQPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-base font-mono text-[#5C5040]">Loading RFQs...</div>}>
      <RFQContent />
    </Suspense>
  );
}

function RFQContent() {
  const { user, org: authOrg } = useAuth();
  const currentOrg = useCurrentOrg();

  const [rfqs, setRFQs] = useState<DbRFQ[]>([]);
  const [myBids, setMyBids] = useState<DbRFQBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [provenanceFilter, setProvenanceFilter] = useState("all");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [activeRFQ, setActiveRFQ] = useState<DbRFQ | null>(null);
  const [activeBids, setActiveBids] = useState<DbRFQBid[]>([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [editingRFQ, setEditingRFQ] = useState<DbRFQ | null>(null);
  const [biddingRFQ, setBiddingRFQ] = useState<DbRFQ | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("steel");
  const [formQuantity, setFormQuantity] = useState("");
  const [formUnit, setFormUnit] = useState("Tonne (MT)");
  const [formBudgetMin, setFormBudgetMin] = useState("");
  const [formBudgetMax, setFormBudgetMax] = useState("");
  const [formProvenanceReq, setFormProvenanceReq] = useState("");
  const [formAdditionalReq, setFormAdditionalReq] = useState("");
  const [formExpiresAt, setFormExpiresAt] = useState("");

  // Bid form states
  const [bidPrice, setBidPrice] = useState("");
  const [bidQuantity, setBidQuantity] = useState("");
  const [bidUnit, setBidUnit] = useState("Tonne (MT)");
  const [bidLeadTime, setBidLeadTime] = useState("");
  const [bidDeliveryTerms, setBidDeliveryTerms] = useState("");
  const [bidProvenanceGrade, setBidProvenanceGrade] = useState("");
  const [bidTechnicalProposal, setBidTechnicalProposal] = useState("");
  const [bidValidityDays, setBidValidityDays] = useState("30");

  const CATEGORIES = [
    { key: "all", label: "All Categories" },
    { key: "steel", label: "Steel" },
    { key: "plastics", label: "Plastics" },
    { key: "textiles", label: "Textiles" },
    { key: "aluminum", label: "Aluminum" },
    { key: "hardware", label: "Hardware" },
    { key: "chemicals", label: "Chemicals" },
    { key: "electronics", label: "Electronics" },
    { key: "food", label: "Food & Agriculture" },
  ];

  const PROVENANCE_FILTERS = [
    { key: "all", label: "All Grades" },
    { key: "verified", label: "Verified" },
    { key: "audited", label: "Audited or Verified" },
    { key: "self-reported", label: "Self-Reported" },
  ];

  const UNIT_GROUPS: { label: string; units: string[] }[] = [
    { label: "Pieces & Counts", units: ["Pieces (pcs)", "Units", "Each", "Pair", "Set", "Dozen", "Gross", "Bundle of 10", "Bundle of 100"] },
    { label: "Weight", units: ["Kilogram (kg)", "Gram (g)", "Milligram (mg)", "Tonne (MT)", "Metric Tonne (t)", "Quintal (q)", "Pound (lb)", "Ounce (oz)"] },
    { label: "Volume", units: ["Litre (L)", "Millilitre (mL)", "Cubic Metre (m³)", "Gallon (gal)", "Quart (qt)", "Pint (pt)"] },
    { label: "Length & Area", units: ["Metre (m)", "Centimetre (cm)", "Millimetre (mm)", "Kilometre (km)", "Foot (ft)", "Inch (in)", "Square Metre (m²)", "Square Foot (ft²)"] },
    { label: "Packaging & Containers", units: ["Box", "Carton", "Bag", "Sack", "Pallet", "Bundle", "Bale", "Roll", "Reel", "Drum", "Barrel", "Bucket", "Bottle", "Crate", "Tray", "Tube"] },
    { label: "Material Forms & Other", units: ["Sheet", "Coil", "Ingot", "Billet", "Slab", "Bar", "Rod", "Wire", "Kilowatt-hour (kWh)", "Hour (hr)", "Lot", "Batch", "Custom"] },
  ];

  const ALL_UNITS: string[] = UNIT_GROUPS.flatMap((g) => g.units);

  const userRole = authOrg?.role || currentOrg.role || "manufacturer";

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_RFQ_FILTERS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.searchQuery !== undefined) setSearchQuery(parsed.searchQuery);
        if (parsed.category !== undefined) setSelectedCategory(parsed.category);
        if (parsed.provenance !== undefined) setProvenanceFilter(parsed.provenance);
        if (parsed.budgetMin !== undefined) setBudgetMin(parsed.budgetMin);
        if (parsed.budgetMax !== undefined) setBudgetMax(parsed.budgetMax);
      } catch {}
    }
  }, []);

  useEffect(() => {
    const v = { searchQuery, category: selectedCategory, provenance: provenanceFilter, budgetMin, budgetMax };
    localStorage.setItem(STORAGE_KEY_RFQ_FILTERS, JSON.stringify(v));
  }, [searchQuery, selectedCategory, provenanceFilter, budgetMin, budgetMax]);

  useEffect(() => {
    if (authOrg?.id) {
      fetchRFQs();
      fetchMyBids();
    }
  }, [authOrg?.id, userRole]);

async function fetchRFQs() {
     if (!authOrg?.id) return;
     setLoading(true);
     try {
         // Build query params based on role
         const params = new URLSearchParams();
         if (userRole === "raw_material_supplier" || userRole === "manufacturer") {
             params.append("supplier_id", authOrg.id);
         } else if (userRole === "distributor" || userRole === "retailer") {
             params.append("buyer_id", authOrg.id);
         }

         const data = await api.request(`/rfq/rfqs?${params.toString()}`);
         setRFQs(data || []);
     } catch (error) {
         console.error("Failed to fetch RFQs:", error);
         setRFQs([]);
     } finally {
         setLoading(false);
     }
 }

async function fetchMyBids() {
     if (!authOrg?.id) return;
     try {
         const data = await api.request(`/rfq/my-bids`);
         setMyBids(data || []);
     } catch (error) {
         console.error("Failed to fetch my bids:", error);
         setMyBids([]);
     }
 }

async function fetchRFQDetail(rfqId: string) {
     try {
         const [rfqData, bidsData] = await Promise.all([
             api.request(`/rfq/rfqs/${rfqId}`),
             api.request(`/rfq/rfqs/${rfqId}/bids`),
         ]);

         setActiveRFQ(rfqData);
         setActiveBids(bidsData || []);
     } catch (error) {
         console.error("Failed to fetch RFQ detail:", error);
         setActiveRFQ(null);
         setActiveBids([]);
     }
 }

async function handleCreateRFQ() {
     if (!authOrg?.id || !formTitle.trim()) return;

     const rfqData = {
         title: formTitle.trim(),
         description: formDescription.trim() || null,
         category: formCategory,
         quantity_required: Number(formQuantity) || 0,
         unit: formUnit,
         budget_min: formBudgetMin ? Number(formBudgetMin) : null,
         budget_max: formBudgetMax ? Number(formBudgetMax) : null,
         currency: "INR",
         delivery_deadline: null,
         delivery_location: null,
         provenance_requirement: formProvenanceReq.trim() || null,
         additional_requirements: formAdditionalReq.trim() ? JSON.parse(formAdditionalReq) : null,
         expires_at: formExpiresAt || null,
     };

     try {
         await api.request(`/rfq/rfqs`, {
             method: "POST",
             body: JSON.stringify(rfqData),
         });

         setIsCreateModalOpen(false);
         resetRFQForm();
         await fetchRFQs();
         showToast("RFQ created successfully");
     } catch (err: any) {
         console.error("Create RFQ failed:", err);
         showToast("Error: " + (err.message || "Create failed"));
     }
 }

  async function handleSubmitBid() {
    if (!biddingRFQ || !authOrg?.id || !bidPrice.trim()) return;

    if (biddingRFQ.status !== "open") {
      showToast("Cannot bid on closed RFQ");
      return;
    }

    const bidData = {
      price_per_unit: Number(bidPrice) || 0,
      quantity_offered: Number(bidQuantity) || 0,
      unit: bidUnit,
      lead_time_days: bidLeadTime ? Number(bidLeadTime) : null,
      delivery_terms: bidDeliveryTerms.trim() || null,
      provenance_grade: bidProvenanceGrade.trim() || null,
      technical_proposal: bidTechnicalProposal.trim() || null,
      validity_days: bidValidityDays ? Number(bidValidityDays) : 30,
    };

    try {
      await api.request(`/rfq/rfqs/${biddingRFQ.id}/bids`, {
        method: "POST",
        body: JSON.stringify(bidData),
      });

      setIsBidModalOpen(false);
      resetBidForm();
      await fetchMyBids();
      await fetchRFQs();
      showToast("Bid submitted successfully");
    } catch (err: any) {
      console.error("Submit bid failed:", err);
      showToast("Error: " + (err.message || "Submit failed"));
    }
  }

  function resetRFQForm() {
    setFormTitle("");
    setFormDescription("");
    setFormCategory("steel");
    setFormQuantity("");
    setFormUnit("Tonne (MT)");
    setFormBudgetMin("");
    setFormBudgetMax("");
    setFormProvenanceReq("");
    setFormAdditionalReq("");
    setFormExpiresAt("");
  }

  function resetBidForm() {
    setBidPrice("");
    setBidQuantity("");
    setBidLeadTime("");
    setBidDeliveryTerms("");
    setBidProvenanceGrade("");
    setBidTechnicalProposal("");
    setBidValidityDays("30");
  }

  function showToast(msg: string) {
    // Simple toast implementation
    alert(msg);
  }

  const filteredRFQs = useMemo(() => {
    return rfqs.filter((rfq) => {
      const matchesSearch =
        searchQuery === "" ||
        rfq.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rfq.description ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        rfq.id.slice(0, 8).toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === "all" || rfq.category === selectedCategory;

      const matchesProv =
        provenanceFilter === "all" ||
        (provenanceFilter === "verified" && rfq.provenance_requirement === "verified") ||
        (provenanceFilter === "audited" && (rfq.provenance_requirement === "audited" || rfq.provenance_requirement === "verified")) ||
        (provenanceFilter === "self-reported" && rfq.provenance_requirement === "self_reported");

      const matchesBudgetMin = !budgetMin || (rfq.budget_min !== null && rfq.budget_min >= Number(budgetMin));
      const matchesBudgetMax = !budgetMax || (rfq.budget_max === null || rfq.budget_max <= Number(budgetMax));

      return matchesSearch && matchesCat && matchesProv && matchesBudgetMin && matchesBudgetMax;
    });
  }, [rfqs, searchQuery, selectedCategory, provenanceFilter, budgetMin, budgetMax]);

  const myBidStats = useMemo(() => {
    const submitted = myBids.filter(b => b.status === "submitted").length;
    const shortlisted = myBids.filter(b => b.status === "shortlisted").length;
    const awarded = myBids.filter(b => b.status === "awarded").length;
    const rejected = myBids.filter(b => b.status === "rejected").length;

    return {
      submitted,
      shortlisted,
      awarded,
      rejected,
      total: myBids.length,
    };
  }, [myBids]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#2C2418] flex flex-col lg:flex-row font-sans">
        <Sidebar currentRole={currentOrg.roleLabel} orgName={currentOrg.orgName} nodeId={currentOrg.nodeId} />
        <main className="flex-1 p-6 md:p-10 flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={32} className="mx-auto animate-spin text-[#6B5B3E]" />
            <p className="mt-4 text-sm text-[#5C5040]">Loading RFQs...</p>
          </div>
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
              <DollarSign size={24} /> Request for Quote (RFQ)
            </h1>
            <p className="text-base font-semibold text-[#5C5040] mt-1">
              Buyers post requirements • Suppliers bid competitively
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!user || userRole === "raw_material_supplier" || userRole === "manufacturer" ? (
              <Link
                href="/rfq"
                className="px-4 py-2 border border-[#E8E0D4] hover:bg-[#FAF8F5] text-sm font-semibold text-[#5C5040] rounded-xl transition-colors"
              >
                My Bids ({myBidStats.total})
              </Link>
            ) : (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2C2418] hover:bg-[#4E4433] text-white rounded-xl text-xs font-bold shadow-md transition-colors"
              >
                <Plus size={16} />
                New RFQ
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-[#8A7E6E]">Total RFQs</span>
              <div className="p-2.5 bg-[#F5F0E8] rounded-xl text-[#6B5B3E]"><Store size={20} /></div>
            </div>
            <h2 className="text-4xl font-extrabold text-[#2C2418] mt-3">{rfqs.length}</h2>
            <p className="text-xs text-[#8A7E6E] font-semibold mt-2">All visible RFQs</p>
          </div>
          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-[#8A7E6E]">My Bids</span>
              <div className="p-2.5 bg-[#EEF7F2] rounded-xl text-[#2E7D5B]"><Handshake size={20} /></div>
            </div>
            <h2 className="text-4xl font-extrabold text-[#2E7D5B] mt-3">{myBidStats.total}</h2>
            <p className="text-xs text-[#8A7E6E] font-semibold mt-2">Submitted bids</p>
          </div>
          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-[#8A7E6E]">Active Bids</span>
              <div className="p-2.5 bg-[#F5F0E8] rounded-xl text-[#6B5B3E]"><CheckCircle2 size={20} /></div>
            </div>
            <h2 className="text-4xl font-extrabold text-[#2C2418] mt-3">{myBidStats.awarded + myBidStats.shortlisted}</h2>
            <p className="text-xs text-[#8A7E6E] font-semibold mt-2">Shortlisted/Awarded</p>
          </div>
        </div>

        <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A89B8A]" />
            <input
              type="text"
              placeholder="Search RFQs by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-semibold text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-xs font-bold text-[#2C2418] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
          >
            {CATEGORIES.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
          <select
            value={provenanceFilter}
            onChange={(e) => setProvenanceFilter(e.target.value)}
            className="px-3 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-xs font-bold text-[#2C2418] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
          >
            {PROVENANCE_FILTERS.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
          <div className="flex items-center gap-3">
            <input
              type="number"
              placeholder="Min Budget (₹)"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              className="w-20 px-3 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-xs font-mono text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
            />
            <span className="text-xs font-mono">—</span>
            <input
              type="number"
              placeholder="Max Budget (₹)"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              className="w-20 px-3 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-xs font-mono text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
            />
          </div>
        </div>

        {filteredRFQs.length === 0 ? (
          <div className="bg-white border border-dashed border-[#E8E0D4] rounded-2xl py-16 px-6 text-center">
            <PackageSearch size={48} className="mx-auto text-[#A89B8A] mb-4" />
            <h3 className="text-lg font-extrabold text-[#2C2418]">
              {rfqs.length === 0 ? "No RFQs available yet" : "No RFQs match the current filters"}
            </h3>
            <p className="text-sm text-[#8A7E6E] mt-1 max-w-md mx-auto">
              {rfqs.length === 0
                ? (userRole === "raw_material_supplier" || userRole === "manufacturer"
                  ? "Wait for buyers to post requirements"
                  : "Use the New RFQ button to post your requirements")
                : "Try clearing the search or filters."}
            </p>
            {rfqs.length === 0 && (
              <div className="flex justify-center mt-6">
                {(userRole === "distributor" || userRole === "retailer") && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#2C2418] hover:bg-[#4E4433] text-white rounded-xl text-sm font-bold transition-colors"
                  >
                    <Plus size={16} />
                    Post Your First RFQ
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {!user || userRole === "raw_material_supplier" || userRole === "manufacturer" ? (
              <>
                <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
                  <div className="p-6 border-b border-[#E8E0D4] bg-[#FAF8F5] flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-extrabold text-[#2C2418]">Available RFQs</h2>
                      <p className="text-sm text-[#5C5040] font-semibold mt-0.5">
                        {filteredRFQs.length} RFQ{filteredRFQs.length !== 1 ? "s" : ""} open for bidding
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {filteredRFQs.map((rfq) => (
                      <div key={rfq.id} className="bg-white border border-[#E8E0D4] rounded-xl p-4 shadow-sm hover:shadow-lg transition-all">
                        <div className="flex items-start justify-between">
                          <div className="flex space-x-3">
                            <div className="p-2 bg-[#EEF7F2] rounded-lg text-[#2E7D5B]">
                              <ShieldCheck size={14} />
                            </div>
                            <div>
                              <h3 className="text-lg font-extrabold text-[#2C2418]">{rfq.title}</h3>
                              <p className="text-sm text-[#8A7E6E]">{rfq.description || "No description provided"}</p>
                            </div>
                          </div>
                          <div className="text-xs font-mono font-bold text-white bg-[#2C2418] px-2 py-1 rounded-md">
                            {rfq.id.slice(0, 8)}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4 text-sm font-mono">
                          <div>
                            <span className="font-bold text-[#2C2418]">Quantity:</span>
                            <span>{rfq.quantity_required} {rfq.unit}</span>
                          </div>
                          <div>
                            <span className="font-bold text-[#2C2418]">Budget:</span>
                            <span>
                              {rfq.budget_min !== null && rfq.budget_max !== null
                                ? `₹{rfq.budget_min.toLocaleString()} - ₹{rfq.budget_max.toLocaleString()}/${rfq.unit}`
                                : rfq.budget_min !== null
                                ? `₹{rfq.budget_min.toLocaleString()}+/${rfq.unit}`
                                : rfq.budget_max !== null
                                ? `Up to ₹{rfq.budget_max.toLocaleString()}/${rfq.unit}`
                                : "Not specified"}
                            </span>
                          </div>
                          <div>
                            <span className="font-bold text-[#2C2418]">Provenance:</span>
                            {getProvenanceBadge(rfq.provenance_requirement)}
                          </div>
                          <div>
                            <span className="font-bold text-[#2C2418]">Category:</span>
                            <span className="px-2 py-0.5 rounded-full bg-[#F5F0E8] text-[#6B5B3E] font-mono font-bold capitalize">
                              {rfq.category}
                            </span>
                          </div>
                          <div>
                            <span className="font-bold text-[#2C2418]">Bids Received:</span>
                            <span className="font-bold text-[#2E7D5B]">
                              {activeRFQ?.id === rfq.id ? activeBids.length : 0}
                            </span>
                          </div>
                          <div>
                            <span className="font-bold text-[#2C2418]">Expires:</span>
                            <span>
                              {rfq.expires_at ? new Date(rfq.expires_at).toLocaleDateString() : "No expiry"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => {
                              setBiddingRFQ(rfq);
                              resetBidForm();
                              setIsBidModalOpen(true);
                            }}
                            className="px-4 py-2 border border-[#E8E0D4] hover:bg-[#FAF8F5] text-sm font-semibold text-[#2C2418] rounded-xl transition-colors"
                          >
                            Place Bid
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {activeRFQ && (
                  <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm mt-6">
                    <div className="p-6 border-b border-[#E8E0D4] bg-[#FAF8F5] flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-extrabold text-[#2C2418]">RFQ Detail & Bids</h2>
                        <p className="text-sm text-[#5C5040] font-semibold mt-0.5">
                          {activeBids.length} bid{activeBids.length !== 1 ? "s" : ""} received
                        </p>
                      </div>
                      <button onClick={() => { setActiveRFQ(null); setActiveBids([]); }} className="p-1.5 rounded-lg text-[#A89B8A] hover:text-[#2C2418]">
                        <X size={20} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-white border border-[#E8E0D4] rounded-xl p-4">
                        <h3 className="text-lg font-extrabold text-[#2C2418]">Requirements</h3>
                        <p className="text-sm text-[#2C2418]"><strong>Title:</strong> {activeRFQ.title}</p>
                        {activeRFQ.description && (
                          <p className="text-sm text-[#2C2418] mt-1"><strong>Description:</strong> {activeRFQ.description}</p>
                        )}
                        <p className="text-sm text-[#2C2418]"><strong>Quantity:</strong> {activeRFQ.quantity_required} {activeRFQ.unit}</p>
                        <p className="text-sm text-[#2C2418]"><strong>Budget:</strong> 
                          {activeRFQ.budget_min !== null && activeRFQ.budget_max !== null
                            ? `₹{activeRFQ.budget_min.toLocaleString()} - ₹{activeRFQ.budget_max.toLocaleString()}/${activeRFQ.unit}`
                            : activeRFQ.budget_min !== null
                            ? `₹{activeRFQ.budget_min.toLocaleString()}+/${activeRFQ.unit}`
                            : activeRFQ.budget_max !== null
                            ? `Up to ₹{activeRFQ.budget_max.toLocaleString()}/${activeRFQ.unit}`
                            : "Not specified"}
                        </p>
                        <p className="text-sm text-[#2C2418]"><strong>Provenance Required:</strong> {getProvenanceBadge(activeRFQ.provenance_requirement)}</p>
                        <p className="text-sm text-[#2C2418]"><strong>Category:</strong> 
                          <span className="px-2 py-0.5 rounded-full bg-[#F5F0E8] text-[#6B5B3E] font-mono font-bold capitalize">
                            {activeRFQ.category}
                          </span>
                        </p>
                        <p className="text-sm text-[#2C2418]"><strong>Posted By:</strong> {activeRFQ.buyer_org?.name || "Unknown"}</p>
                        <p className="text-sm text-[#2C2418]"><strong>Posted On:</strong> {new Date(activeRFQ.created_at).toLocaleString()}</p>
                      </div>

                      {activeBids.length > 0 && (
                        <>
                          <div className="bg-white border border-[#E8E0D4] rounded-xl p-4">
                            <h3 className="text-lg font-extrabold text-[#2C2418]">Received Bids</h3>
                          </div>

                          <div className="space-y-3">
                            {activeBids.map((bid) => (
                              <div key={bid.id} className="bg-white border border-[#E8E0D4] rounded-xl p-4 shadow-sm">
                                <div className="flex items-start justify-between">
                                  <div className="flex space-x-3">
                                    <div className="p-2 bg-[#F5F0E8] rounded-xl text-[#6B5B3E]">
                                      <Package size={14} />
                                    </div>
                                    <div>
                                      <h4 className="font-extrabold text-[#2C2418]">Supplier Bid</h4>
                                      <p className="text-sm text-[#8A7E6E]">{bid.supplier_org?.name || "Unknown Supplier"}</p>
                                    </div>
                                  </div>
                                  <div className="text-xs font-mono font-bold text-white bg-[#2E7D5B] px-2 py-1 rounded-md">
                                    {bid.id.slice(0, 8)}
                                  </div>
                                </div>

                                <div className="mt-3 space-y-2">
                                  <div className="text-sm font-mono">
                                    <span className="font-bold">Price:</span> ₹{bid.price_per_unit.toLocaleString()}/{bid.unit} (Total: ₹{bid.total_price.toLocaleString()})
                                  </div>
                                  <div className="text-sm font-mono">
                                    <span className="font-bold">Quantity:</span> {bid.quantity_offered} {bid.unit}
                                  </div>
                                  {bid.lead_time_days !== null && (
                                    <div className="text-sm font-mono">
                                      <span className="font-bold">Lead Time:</span> {bid.lead_time_days} days
                                    </div>
                                  )}
                                  {bid.delivery_terms && (
                                    <div className="text-sm font-mono">
                                      <span className="font-bold">Delivery Terms:</span> {bid.delivery_terms}
                                    </div>
                                  )}
                                  {bid.provenance_grade && (
                                    <div className="text-sm font-mono">
                                      <span className="font-bold">Provenance:</span> {getProvenanceBadge(bid.provenance_grade)}
                                    </div>
                                  )}
                                  {bid.technical_proposal && (
                                    <div className="text-sm font-mono mt-1">
                                      <span className="font-bold">Technical Proposal:</span>
                                      <p className="text-sm text-[10px] leading-none">{bid.technical_proposal}</p>
                                    </div>
                                  )}
                                  <div className="text-sm font-mono">
                                    <span className="font-bold">Validity:</span> {bid.validity_days} days
                                  </div>
                                  <div className="text-sm font-mono">
                                    <span className="font-bold">Status:</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                                      bid.status === "submitted" ? "bg-[#F0EBE3] text-[#8A7E6E]"
                                        : bid.status === "shortlisted" ? "bg-[#EEF7F2] text-[#2E7D5B]"
                                        : bid.status === "awarded" ? "bg#[2E7D5B] text-[#EEF7F2]"
                                        : bid.status === "rejected" ? "bg-[#F0EBE3] text-[#8A7E6E]"
                                        : "bg-[#F0EBE3] text-[#8A7E6E]"
                                    }`}>
                                      {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                                    </span>
                                  </div>
                                </div>

                                {bid.supplier_id === authOrg?.id && (
                                  <div className="mt-3 flex justify-end">
                                    <button
                                      onClick={() => {
                                        // In a real app, this would update bid status
                                        showToast("Bid status update would go here");
                                      }}
                                      className="px-3 py-1 border border-[#E8E0D4] hover:bg-[#FAF8F5] text-xs font-semibold text-[#2C2418] rounded-xl transition-colors"
                                    >
                                      Update Bid
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm">
                <div className="p-6 border-b border-[#E8E0D4] bg-[#FAF8F5] flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#2C2418]">My RFQs</h2>
                    <p className="text-sm text-[#5C5040] font-semibold mt-0.5">
                      Manage your posted requirements
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {rfqs.map((rfq) => (
                    <div key={rfq.id} className="bg-white border border-[#E8E0D4] rounded-xl p-4 shadow-sm hover:shadow-lg transition-all">
                      <div className="flex items-start justify-between pb-3">
                        <div className="flex space-x-3">
                          <div className="p-2 bg-[#EEF7F2] rounded-lg text-[#2E7D5B]">
                            <ShieldCheck size={14} />
                          </div>
                          <div>
                            <h3 className="text-lg font-extrabold text-[#2C2418]">{rfq.title}</h3>
                            <p className="text-sm text-[#8A7E6E]">{rfq.description || "No description provided"}</p>
                          </div>
                        </div>
                        <div className="text-xs font-mono font-bold text-white bg-[#2C2418] px-2 py-1 rounded-md">
                          {rfq.id.slice(0, 8)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-2 text-sm font-mono">
                        <div>
                          <span className="font-bold text-[#2C2418]">Status:</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                            rfq.status === "open" ? "bg-[#EEF7F2] text-[#2E7D5B]"
                            : rfq.status === "evaluating" ? "bg#[FDF5E6] text-[#C68A17]"
                            : rfq.status === "awarded" ? "bg-[#2E7D5B] text-[#EEF7F2]"
                            : rfq.status === "closed" ? "bg-[#F0EBE3] text-[#8A7E6E]"
                            : rfq.status === "cancelled" ? "bg-[#F0EBE3] text-[#8A7E6E]"
                            : "bg-[#F0EBE3] text-[#8A7E6E]"
                          }`}>
                            {rfq.status.charAt(0).toUpperCase() + rfq.status.slice(1)}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-[#2C2418]">Bids Received:</span>
                          <span className="font-bold text-[#2E7D5B]">0</span>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingRFQ(rfq);
                            setFormTitle(rfq.title);
                            setFormDescription(rfq.description || "");
                            setFormCategory(rfq.category);
                            setFormQuantity(String(rfq.quantity_required));
                            setFormUnit(rfq.unit);
                            setFormBudgetMin(rfq.budget_min !== null ? String(rfq.budget_min) : "");
                            setFormBudgetMax(rfq.budget_max !== null ? String(rfq.budget_max) : "");
                            setFormProvenanceReq(rfq.provenance_requirement || "");
                            setFormAdditionalReq(rfq.additional_requirements ? JSON.stringify(rfq.additional_requirements) : "");
                            setFormExpiresAt(rfq.expires_at || "");
                            setIsCreateModalOpen(true);
                          }}
                          className="px-3 py-1 border border-[#E8E0D4] hover:bg-[#FAF8F5] text-xs font-semibold text-[#2C2418] rounded-xl transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            // Change status logic would go here
                            showToast("Status change functionality would go here");
                          }}
                          className="px-3 py-1 border border-[#E8E0D4] hover:bg-[#FAF8F5] text-xs font-semibold text-[#2C2418] rounded-xl transition-colors"
                        >
                          Change Status
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bid Modal */}
        {isBidModalOpen && biddingRFQ && (
              <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white border border-[#E8E0D4] rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-start justify-between border-b border-[#E8E0D4] pb-4">
                    <div className="flex gap-4 items-center">
                      <div className="p-2 bg-[#EEF7F2] rounded-lg text-[#2E7D5B]">
                        <Package size={18} />
                      </div>
                      <div>
                        <h3 className="text-xl font-extrabold text-[#2C2418]">Place Bid on RFQ</h3>
                        <p className="text-sm text-[#8A7E6E]">{biddingRFQ.title}</p>
                      </div>
                    </div>
                    <button onClick={() => { setIsBidModalOpen(false); resetBidForm(); }} className="p-1.5 rounded-lg text-[#A89B8A] hover:text-[#2C2418]">
                      <X size={20} />
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => { e.preventDefault(); handleSubmitBid(); }}
                    className="space-y-5"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">Price per Unit (INR) *</label>
                        <input
                          type="number"
                          value={bidPrice}
                          onChange={(e) => setBidPrice(e.target.value)}
                          required
                          min="0"
                          step="0.01"
                          placeholder="48200"
                          className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-semibold text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">Quantity *</label>
                        <input
                          type="number"
                          value={bidQuantity}
                          onChange={(e) => setBidQuantity(e.target.value)}
                          required
                          min="0"
                          step="0.01"
                          placeholder="50"
                          className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-semibold text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-2 focus-ring-[#6B5B3E]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">Unit *</label>
                        <select
                          value={bidUnit}
                          onChange={(e) => setBidUnit(e.target.value)}
                          required
                          className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-bold text-[#2C2418] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
                        >
                          {UNIT_GROUPS.map((g) => (
                            <optgroup key={g.label} label={g.label}>
                              {g.units.map((u) => (
                                <option key={u} value={u}>{u}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">Lead Time (days)</label>
                        <input
                          type="number"
                          value={bidLeadTime}
                          onChange={(e) => setBidLeadTime(e.target.value)}
                          min="0"
                          placeholder="10"
                          className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-semibold text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">Validity (days)</label>
                        <input
                          type="number"
                          value={bidValidityDays}
                          onChange={(e) => setBidValidityDays(e.target.value)}
                          min="1"
                          max="365"
                          placeholder="30"
                          className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-semibold text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">Delivery Terms</label>
                        <input
                          type="text"
                          value={bidDeliveryTerms}
                          onChange={(e) => setBidDeliveryTerms(e.target.value)}
                          placeholder="FOB Destination"
                          className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-semibold text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">Provenance Grade</label>
                        <select
                          value={bidProvenanceGrade}
                          onChange={(e) => setBidProvenanceGrade(e.target.value)}
                          className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-bold text-[#2C2418] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
                        >
                          <option value="">Not Specified</option>
                          <option value="verified">Verified</option>
                          <option value="audited">Audited</option>
                          <option value="self_reported">Self-Reported</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">Technical Proposal</label>
                        <textarea
                          value={bidTechnicalProposal}
                          onChange={(e) => setBidTechnicalProposal(e.target.value)}
                          rows={3}
                          placeholder="Describe your capability, quality standards, delivery approach..."
                          className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-semibold text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E] resize-y"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => { setIsBidModalOpen(false); resetBidForm(); }}
                        className="px-5 py-2.5 border border-[#E8E0D4] hover:bg-[#FAF8F5] text-[#5C5040] font-bold text-xs rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-[#2C2418] hover:bg-[#4E4433] text-white font-bold text-xs rounded-xl transition-colors shadow-sm inline-flex items-center gap-2"
                      >
                        Submit Bid
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

        {/* Create/Edit RFQ Modal */}
        {isCreateModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white border border-[#E8E0D4] rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-start justify-between border-b border-[#E8E0D4] pb-4">
                    <div className="flex gap-4 items-center">
                      <div className="p-2 bg-[#EEF7F2] rounded-lg text-[#2E7D5B]">
                        <DollarSign size={18} />
                      </div>
                      <div>
                        <h3 className="text-xl font-extrabold text-[#2C2418]">
                          {editingRFQ ? "Edit RFQ" : "New RFQ"}
                        </h3>
                        <p className="text-sm text-[#8A7E6E]">
                          {editingRFQ ? "Update your requirements" : "Post your buying requirements"}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => { setIsCreateModalOpen(false); resetRFQForm(); }} className="p-1.5 rounded-lg text-[#A89B8A] hover:text-[#2C2418]">
                      <X size={20} />
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => { e.preventDefault(); handleCreateRFQ(); }}
                    className="space-y-5"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">RFQ Title *</label>
                        <input
                          type="text"
                          value={formTitle}
                          onChange={(e) => setFormTitle(e.target.value)}
                          required
                          placeholder="e.g. Hot Rolled Steel Coils - Grade Fe410"
                          className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-semibold text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">Description</label>
                        <textarea
                          value={formDescription}
                          onChange={(e) => setFormDescription(e.target.value)}
                          rows={3}
                          placeholder="Describe specifications, grade, dimensions, tolerances..."
                          className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-semibold text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E] resize-y"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">Quantity Required *</label>
                        <input
                          type="number"
                          value={formQuantity}
                          onChange={(e) => setFormQuantity(e.target.value)}
                          required
                          min="0"
                          step="0.01"
                          placeholder="100"
                          className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-semibold text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">Unit *</label>
                        <select
                          value={formUnit}
                          onChange={(e) => setFormUnit(e.target.value)}
                          required
                          className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-bold text-[#2C2418] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
                        >
                          {UNIT_GROUPS.map((g) => (
                            <optgroup key={g.label} label={g.label}>
                              {g.units.map((u) => (
                                <option key={u} value={u}>{u}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">Budget Min (INR/unit)</label>
                        <input
                          type="number"
                          value={formBudgetMin}
                          onChange={(e) => setFormBudgetMin(e.target.value)}
                          min="0"
                          step="0.01"
                          placeholder="45000"
                          className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-semibold text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">Budget Max (INR/unit)</label>
                        <input
                          type="number"
                          value={formBudgetMax}
                          onChange={(e) => setFormBudgetMax(e.target.value)}
                          min="0"
                          step="0.01"
                          placeholder="52000"
                          className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-semibold text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">Provenance Requirement</label>
                        <select
                          value={formProvenanceReq}
                          onChange={(e) => setFormProvenanceReq(e.target.value)}
                          className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-bold text-[#2C2418] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
                        >
                          <option value="">Not Specified</option>
                          <option value="verified">Verified</option>
                          <option value="audited">Audited</option>
                          <option value="self_reported">Self-Reported</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">Additional Requirements (JSON)</label>
                        <textarea
                          value={formAdditionalReq}
                          onChange={(e) => setFormAdditionalReq(e.target.value)}
                          rows={3}
                          placeholder='{"certifications": ["ISO 9001"], "packaging": "standard coils"}'
                          className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-semibold text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E] resize-y"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono font-bold text-[#8A7E6E] uppercase mb-1.5">Expires At (optional)</label>
                        <input
                          type="datetime-local"
                          value={formExpiresAt}
                          onChange={(e) => setFormExpiresAt(e.target.value)}
                          className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-semibold text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => { setIsCreateModalOpen(false); resetRFQForm(); }}
                        className="px-5 py-2.5 border border-[#E8E0D4] hover:bg-[#FAF8F5] text-[#5C5040] font-bold text-xs rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-[#2C2418] hover:bg-[#4E4433] text-white font-bold text-xs rounded-xl transition-colors shadow-sm inline-flex items-center gap-2"
                      >
                        {editingRFQ ? "Update RFQ" : "Post RFQ"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
      </main>
      <div className="hidden">
        {/* Placeholder for sidebar closing */}
      </div>
    </div>
  );
}