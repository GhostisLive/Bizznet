"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/lib/AuthProvider";
import { useCurrentOrg } from "@/lib/useCurrentOrg";
import { supabase } from "@/utils/supabaseClient";
import {
  Handshake,
  ShieldCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  DollarSign,
  Info,
  X,
  Calculator,
  Truck,
  Box,
  Layers,
  Package,
  MapPin,
  ChevronRight
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

interface Product {
  id: string;
  name: string;
  category: string;
  unit_price: number;
  unit: string;
  moq: number;
  stock: number;
  stock_location: string;
  status: string;
  is_listed_on_marketplace: boolean;
  description: string;
}

interface Negotiation {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  status: string;
  provenance_reviewed: boolean;
  listing?: { title: string; category: string; price: number; currency: string; moq: number; unit: string } | null;
  buyer_org?: { name: string } | null;
  seller_org?: { name: string } | null;
}

interface Facility {
  id: string;
  name: string;
  location: string;
  carbon_intensity_factor: number;
}

interface ProvenanceRecord {
  id: string;
  type: string;
  verifying_party: string;
  evidence_url: string;
  verified_at: string | null;
  payload: any;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-base font-mono text-[#5C5040]">Loading BizzNet Executive Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const { user, org, loading: authLoading } = useAuth();
  const currentOrg = useCurrentOrg();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrace, setSelectedTrace] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [provenanceRecords, setProvenanceRecords] = useState<ProvenanceRecord[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [purchaseQtyMT, setPurchaseQtyMT] = useState<number>(50);
  const [steelFactor, setSteelFactor] = useState<number>(2.1);
  const [salesQtyUnits, setSalesQtyUnits] = useState<number>(100);
  const [gearFactor, setGearFactor] = useState<number>(1.4);
  const [transportDistKm, setTransportDistKm] = useState<number>(450);
  const [transportTimeDays, setTransportTimeDays] = useState<number>(2);
  const [transportModeFactor, setTransportModeFactor] = useState<number>(0.105);

   useEffect(() => {
     if (!org?.id) return;

     async function loadData() {
       try {
          const token = await getAuthToken();
         if (!token) throw new Error("Not authenticated");

         // Use the new dashboard overview endpoint
         const overviewRes = await fetch(`${API_BASE}/dashboard/overview`, {
           headers: { Authorization: `Bearer ${token}` },
         });

         if (!overviewRes.ok) throw new Error("Failed to fetch dashboard overview");
         const overview = await overviewRes.json();

         // Get products for detailed views
         const productsRes = await fetch(`${API_BASE}/products`, {
           headers: { Authorization: `Bearer ${token}` },
         });
         const productsData = productsRes.ok ? await productsRes.json() : [];

         // Get negotiations for detailed views
         const negRes = await fetch(`${API_BASE}/negotiation/negotiations/enriched`, {
           headers: { Authorization: `Bearer ${token}` },
         });
         const negData = negRes.ok ? await negRes.json() : [];

         // Get facilities and provenance records directly (for now, until we add those endpoints)
         const [facilitiesRes, provenanceRes] = await Promise.all([
           supabase
             .from("facilities")
             .select("*")
             .eq("organization_id", org!.id),
           supabase
             .from("provenance_records")
             .select("*")
             .eq("organization_id", org!.id),
         ]);

         setProducts(productsData);
         setNegotiations(negData);
         setFacilities(facilitiesRes.data ?? []);
         setProvenanceRecords(provenanceRes.data ?? []);
         setDataLoaded(true);
       } catch (err) {
         console.error("Failed to load dashboard data:", err);
         setDataLoaded(true);
       }
     }

     loadData();
   }, [org?.id]);

  const purchaseEmissionsKg = purchaseQtyMT * 1000 * steelFactor;
  const salesEmissionsKg = salesQtyUnits * gearFactor;
  const transportEmissionsKg = purchaseQtyMT * transportDistKm * transportModeFactor * (1 + transportTimeDays / 10);
  const totalCarbonEmissionsKg = purchaseEmissionsKg + salesEmissionsKg + transportEmissionsKg;
  const totalCarbonEmissionsMT = totalCarbonEmissionsKg / 1000;

  const totalCarbonIntensity = facilities.reduce((sum, f) => sum + (f.carbon_intensity_factor ?? 0), 0);
  const pendingProvenance = provenanceRecords.filter((r) => !r.verified_at);
  const negotiationCount = negotiations.length;

  if (authLoading || currentOrg.loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <p className="text-[#5C5040] font-mono text-base">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C2418] flex flex-col lg:flex-row font-sans text-base">
      <Sidebar currentRole={currentOrg.roleLabel} orgName={currentOrg.orgName} nodeId={currentOrg.nodeId} />

      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-x-hidden max-w-[1600px] mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E8E0D4]">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#2C2418] tracking-tight">
              {currentOrg.orgName} &middot; {currentOrg.roleLabel} Dashboard
            </h1>
            <p className="text-base font-semibold text-[#5C5040] mt-1">
              BizzNet Supply Chain &amp; Carbon Intelligence Platform
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            onClick={() => setActivePopup("metric1")}
            className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8A7E6E]">Active Negotiations</span>
              <button className="p-1.5 rounded-lg text-[#8A7E6E] group-hover:text-[#2C2418]" title="Click for details">
                <Info size={18} />
              </button>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#2C2418] tracking-tight">
                {negotiationCount} {negotiationCount === 1 ? "Deal" : "Deals"}
              </h2>
              {negotiationCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#2E7D5B] bg-[#EEF7F2] px-3 py-1 rounded-full border border-[#2E7D5B]/20">
                  <Handshake size={14} /> Active
                </span>
              )}
            </div>
            <div className="mt-3 text-xs font-mono text-[#6B5B3E] font-bold">
              {negotiationCount === 0 ? "No negotiations yet" : "Click to view details \u2192"}
            </div>
          </div>

          <div
            onClick={() => setActivePopup("carbonCalc")}
            className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8A7E6E]">Carbon Footprint</span>
              <button className="p-1.5 rounded-lg text-[#2E7D5B] flex items-center gap-1 text-xs font-mono font-bold" title="View Carbon Calculator">
                <Calculator size={18} />
                <span>Calc</span>
              </button>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#2E7D5B] tracking-tight">
                {facilities.length > 0
                  ? `${totalCarbonIntensity.toFixed(2)} Factor`
                  : `${totalCarbonEmissionsMT.toFixed(2)} MT CO\u2082e`}
              </h2>
              {facilities.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#2E7D5B] bg-[#EEF7F2] px-3 py-1 rounded-full border border-[#2E7D5B]/20">
                  {facilities.length} {facilities.length === 1 ? "Facility" : "Facilities"}
                </span>
              )}
            </div>
            <div className="mt-3 text-xs font-mono text-[#2E7D5B] font-bold">
              Click to view formula &amp; interactive calculator &rarr;
            </div>
          </div>

          <div
            onClick={() => setActivePopup("metric3")}
            className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8A7E6E]">Pending Verifications</span>
              <button className="p-1.5 rounded-lg text-[#8A7E6E] group-hover:text-[#2C2418]" title="Click for details">
                <Info size={18} />
              </button>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#2C2418] tracking-tight">
                {pendingProvenance.length} {pendingProvenance.length === 1 ? "Request" : "Requests"}
              </h2>
              {pendingProvenance.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#C68A17] bg-[#FDF5E6] px-3 py-1 rounded-full border border-[#C68A17]/20">
                  Pending
                </span>
              )}
            </div>
            <div className="mt-3 text-xs font-mono text-[#6B5B3E] font-bold">
              {pendingProvenance.length === 0 ? "All verifications complete" : "Click to view details \u2192"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#E8E0D4] pb-4 mb-4">
                <div>
                  <h3 className="text-xl font-extrabold text-[#2C2418]">Your Products</h3>
                  <p className="text-sm text-[#5C5040] font-semibold mt-0.5">Click any product to inspect stock &amp; details</p>
                </div>
              </div>

              {products.length === 0 ? (
                <div className="py-12 text-center">
                  <Package size={40} className="mx-auto text-[#E8E0D4] mb-3" />
                  <p className="text-[#8A7E6E] font-semibold text-sm">No products yet</p>
                  <p className="text-[#A89B8A] text-xs mt-1">Add products from the Products page</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {products.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => setSelectedProductDetails(prod)}
                      className="p-4 bg-[#FAF8F5] hover:bg-[#F5F0E8] transition-colors rounded-xl border border-[#E8E0D4] flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2E7D5B] text-white">
                          <Box size={18} />
                        </div>
                        <div>
                          <span className="font-extrabold text-[#2C2418] text-base block">{prod.name}</span>
                          <span className="text-xs font-mono text-[#8A7E6E]">{prod.category} &bull; {prod.stock} {prod.unit}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full font-mono text-xs font-bold ${
                          prod.status === "active" ? "bg-[#EEF7F2] text-[#2E7D5B]" : "bg-[#F5F0E8] text-[#6B5B3E]"
                        }`}>
                          {prod.status}
                        </span>
                        <ChevronRight size={18} className="text-[#8A7E6E] group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#E8E0D4] pb-4 mb-4">
                <div>
                  <h3 className="text-xl font-extrabold text-[#2C2418]">Your Negotiations</h3>
                  <p className="text-sm text-[#5C5040] font-semibold mt-0.5">Deals where you are buyer or seller</p>
                </div>
              </div>

              {negotiations.length === 0 ? (
                <div className="py-12 text-center">
                  <Handshake size={40} className="mx-auto text-[#E8E0D4] mb-3" />
                  <p className="text-[#8A7E6E] font-semibold text-sm">No negotiations yet</p>
                  <p className="text-[#A89B8A] text-xs mt-1">Start negotiating from the Marketplace</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {negotiations.map((neg) => {
                    const isBuyer = neg.buyer_id === org?.id;
                    const counterpartName = isBuyer
                      ? (neg.seller_org as any)?.name ?? "Seller"
                      : (neg.buyer_org as any)?.name ?? "Buyer";
                    const listingTitle = (neg.listing as any)?.title ?? "Untitled Listing";

                    return (
                      <div
                        key={neg.id}
                        onClick={() => {
                          setSelectedTrace({
                            id: neg.id,
                            counterpart: counterpartName,
                            item: listingTitle,
                            status: neg.status,
                            role: isBuyer ? "Buyer" : "Seller",
                            provenance_reviewed: neg.provenance_reviewed,
                          });
                          setIsModalOpen(true);
                        }}
                        className="p-4 bg-[#FAF8F5] hover:bg-[#F5F0E8] transition-colors rounded-xl border border-[#E8E0D4] flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6B5B3E] text-white">
                            <Handshake size={18} />
                          </div>
                          <div>
                            <span className="font-extrabold text-[#2C2418] text-base block">{listingTitle}</span>
                            <span className="text-xs font-mono text-[#8A7E6E]">
                              {isBuyer ? "Buying from" : "Selling to"}: {counterpartName}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full font-mono text-xs font-bold ${
                            neg.status === "accepted" || neg.status === "agreed"
                              ? "bg-[#EEF7F2] text-[#2E7D5B]"
                              : neg.status === "countered"
                              ? "bg-[#FDF5E6] text-[#C68A17]"
                              : "bg-[#F5F0E8] text-[#6B5B3E]"
                          }`}>
                            {neg.status}
                          </span>
                          <ChevronRight size={18} className="text-[#8A7E6E] group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div
            onClick={() => setActivePopup("emissions")}
            className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between border-b border-[#E8E0D4] pb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-[#2C2418] group-hover:text-[#6B5B3E] transition-colors">
                    Emissions Area Chart
                  </h3>
                  <p className="text-xs text-[#8A7E6E] font-semibold mt-0.5">Scope 1, 2 &amp; 3 Carbon Footprint (MT CO&#x2082;e)</p>
                </div>
                <button className="p-1.5 rounded-lg text-[#8A7E6E] group-hover:text-[#2C2418]" title="Click for details">
                  <Info size={18} />
                </button>
              </div>

              <div className="my-5 relative h-44 w-full">
                {facilities.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-[#8A7E6E] text-sm font-semibold">No data yet</p>
                  </div>
                ) : (
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
                )}
                <div className="flex justify-between items-center text-xs font-mono text-[#8A7E6E] pt-2 border-t border-[#E8E0D4]">
                  <span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span>
                </div>
              </div>
            </div>
            <div className="text-center pt-2 border-t border-[#E8E0D4]">
              <span className="text-xs font-mono text-[#6B5B3E] font-bold">
                Click chart to view formula &amp; details &rarr;
              </span>
            </div>
          </div>

          <div
            onClick={() => setActivePopup("velocity")}
            className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between border-b border-[#E8E0D4] pb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-[#2C2418] group-hover:text-[#6B5B3E] transition-colors">
                    Deal Velocity Graph
                  </h3>
                  <p className="text-xs text-[#8A7E6E] font-semibold mt-0.5">Close Days vs Acceptance Rate (%)</p>
                </div>
                <button className="p-1.5 rounded-lg text-[#8A7E6E] group-hover:text-[#2C2418]" title="Click for details">
                  <Info size={18} />
                </button>
              </div>

              <div className="my-5 relative h-44 w-full">
                {negotiations.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-[#8A7E6E] text-sm font-semibold">No data yet</p>
                  </div>
                ) : (
                  <svg className="w-full h-full" viewBox="0 0 400 160" preserveAspectRatio="none">
                    <path d="M 0,140 L 80,120 L 160,95 L 240,75 L 320,60 L 400,40" fill="none" stroke="#6B5B3E" strokeWidth="3" strokeLinecap="round" />
                    <path d="M 0,80 L 80,65 L 160,50 L 240,40 L 320,30 L 400,20" fill="none" stroke="#2E7D5B" strokeWidth="3" strokeDasharray="5 3" strokeLinecap="round" />
                  </svg>
                )}
                <div className="flex justify-between items-center text-xs font-mono text-[#8A7E6E] pt-2 border-t border-[#E8E0D4]">
                  <span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span>
                </div>
              </div>
            </div>
            <div className="text-center pt-2 border-t border-[#E8E0D4]">
              <span className="text-xs font-mono text-[#6B5B3E] font-bold">
                Click chart to view deal metrics &rarr;
              </span>
            </div>
          </div>

          <div
            onClick={() => setActivePopup("trustDonut")}
            className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between border-b border-[#E8E0D4] pb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-[#2C2418] group-hover:text-[#6B5B3E] transition-colors">
                    Trust-Verification Donut
                  </h3>
                  <p className="text-xs text-[#8A7E6E] font-semibold mt-0.5">Supplier assurance breakdown</p>
                </div>
                <button className="p-1.5 rounded-lg text-[#8A7E6E] group-hover:text-[#2C2418]" title="Click for details">
                  <Info size={18} />
                </button>
              </div>

              <div className="my-4 flex items-center justify-center relative">
                {provenanceRecords.length === 0 ? (
                  <div className="h-36 flex items-center justify-center">
                    <p className="text-[#8A7E6E] text-sm font-semibold">No data yet</p>
                  </div>
                ) : (() => {
                  const verified = provenanceRecords.filter((r) => r.verified_at).length;
                  const total = provenanceRecords.length;
                  const pct = total > 0 ? Math.round((verified / total) * 100) : 0;
                  const pendingPct = total > 0 ? 100 - pct : 0;
                  return (
                    <>
                      <svg className="w-36 h-36 -rotate-90 transform" viewBox="0 0 36 36">
                        <path className="text-[#F0EBE3]" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="text-[#2E7D5B]" strokeDasharray={`${pct}, 100`} strokeWidth="4" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="text-[#C68A17]" strokeDasharray={`${pendingPct}, 100`} strokeDashoffset={`-${pct}`} strokeWidth="4" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-2xl font-extrabold text-[#2C2418] block font-sans">{pct}%</span>
                        <span className="text-[10px] font-mono text-[#2E7D5B] font-bold uppercase">Verified</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
            <div className="text-center pt-2 border-t border-[#E8E0D4]">
              <span className="text-xs font-mono text-[#6B5B3E] font-bold">
                Click chart to view breakdown &rarr;
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E8E0D4] rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#E8E0D4] bg-[#FAF8F5] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-[#2C2418]">Negotiations Panel</h2>
              <p className="text-base text-[#5C5040] font-semibold mt-0.5">
                Live negotiations from your organization
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search listing or counterpart..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 border border-[#E8E0D4] bg-white rounded-xl text-sm text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
              />
              <button
                onClick={() => setActivePopup("negPanel")}
                className="p-2 rounded-xl border border-[#E8E0D4] bg-white text-[#8A7E6E] hover:text-[#2C2418]"
                title="Click for details"
              >
                <Info size={18} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {negotiations.length === 0 ? (
              <div className="py-16 text-center">
                <Handshake size={40} className="mx-auto text-[#E8E0D4] mb-3" />
                <p className="text-[#8A7E6E] font-semibold text-sm">No negotiations yet</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm font-sans">
                <thead className="bg-[#FAF8F5] border-b border-[#E8E0D4] font-mono text-xs text-[#8A7E6E] uppercase">
                  <tr>
                    <th className="py-3.5 px-6 font-extrabold">Listing</th>
                    <th className="py-3.5 px-6 font-extrabold">Counterparty</th>
                    <th className="py-3.5 px-6 font-extrabold">Role</th>
                    <th className="py-3.5 px-6 font-extrabold">Price</th>
                    <th className="py-3.5 px-6 font-extrabold">Status</th>
                    <th className="py-3.5 px-6 font-extrabold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E0D4]">
                  {negotiations
                    .filter((n) => {
                      const listing = n.listing as any;
                      const buyerName = (n.buyer_org as any)?.name ?? "";
                      const sellerName = (n.seller_org as any)?.name ?? "";
                      const title = listing?.title ?? "";
                      const q = searchQuery.toLowerCase();
                      return title.toLowerCase().includes(q) || buyerName.toLowerCase().includes(q) || sellerName.toLowerCase().includes(q);
                    })
                    .map((neg) => {
                      const isBuyer = neg.buyer_id === org?.id;
                      const counterpartName = isBuyer
                        ? (neg.seller_org as any)?.name ?? "Seller"
                        : (neg.buyer_org as any)?.name ?? "Buyer";
                      const listing = neg.listing as any;

                      return (
                        <tr key={neg.id} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="py-4 px-6">
                            <span className="font-extrabold text-[#2C2418] text-base block">{listing?.title ?? "Untitled"}</span>
                            <span className="text-xs font-mono text-[#8A7E6E]">{listing?.category ?? ""}</span>
                          </td>
                          <td className="py-4 px-6 font-bold text-[#2C2418]">
                            {counterpartName}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2 py-1 rounded-full text-xs font-mono font-bold ${
                              isBuyer ? "bg-[#EEF7F2] text-[#2E7D5B]" : "bg-[#FDF5E6] text-[#C68A17]"
                            }`}>
                              {isBuyer ? "Buyer" : "Seller"}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-mono font-extrabold text-[#2C2418]">
                            {listing?.currency ?? ""}{listing?.price?.toLocaleString("en-IN") ?? "-"}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                              neg.status === "accepted" || neg.status === "agreed"
                                ? "bg-[#EEF7F2] text-[#2E7D5B] border-[#2E7D5B]/30"
                                : neg.status === "countered"
                                ? "bg-[#FDF5E6] text-[#C68A17] border-[#C68A17]/30"
                                : "bg-[#F5F0E8] text-[#6B5B3E] border-[#6B5B3E]/30"
                            }`}>
                              <span className="size-1.5 rounded-full bg-current" />
                              {neg.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => {
                                setSelectedTrace({
                                  id: neg.id,
                                  counterpart: counterpartName,
                                  item: listing?.title ?? "Untitled",
                                  status: neg.status,
                                  role: isBuyer ? "Buyer" : "Seller",
                                  provenance_reviewed: neg.provenance_reviewed,
                                });
                                setIsModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#F5F0E8] hover:bg-[#EDE7DC] text-[#6B5B3E] text-xs font-bold rounded-lg transition-colors"
                            >
                              Details
                              <ArrowUpRight size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {selectedProductDetails && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8E0D4] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#E8E0D4] pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2E7D5B] text-white">
                  <Box size={18} />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-[#2C2418]">{selectedProductDetails.name}</h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedProductDetails(null)}
                className="text-[#A89B8A] hover:text-[#2C2418] p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-sm font-sans">
              <div className="flex justify-between py-2 border-b border-[#F0EBE3]">
                <span className="text-[#8A7E6E] font-semibold">Category</span>
                <span className="font-bold text-[#2C2418]">{selectedProductDetails.category}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#F0EBE3]">
                <span className="text-[#8A7E6E] font-semibold">Current Stock</span>
                <span className="font-mono font-extrabold text-[#2E7D5B] bg-[#EEF7F2] px-2.5 py-0.5 rounded-full border border-[#2E7D5B]/30">
                  {selectedProductDetails.stock} {selectedProductDetails.unit}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#F0EBE3]">
                <span className="text-[#8A7E6E] font-semibold">Stock Location</span>
                <span className="font-bold text-[#2C2418]">{selectedProductDetails.stock_location || "—"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#F0EBE3]">
                <span className="text-[#8A7E6E] font-semibold">MOQ</span>
                <span className="font-mono font-bold text-[#6B5B3E]">{selectedProductDetails.moq} {selectedProductDetails.unit}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#F0EBE3]">
                <span className="text-[#8A7E6E] font-semibold">Unit Price</span>
                <span className="font-mono font-extrabold text-[#2C2418]">{selectedProductDetails.unit_price}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#F0EBE3]">
                <span className="text-[#8A7E6E] font-semibold">Status</span>
                <span className={`font-mono font-bold px-2.5 py-0.5 rounded-full ${
                  selectedProductDetails.status === "active" ? "text-[#2E7D5B] bg-[#EEF7F2]" : "text-[#6B5B3E] bg-[#F5F0E8]"
                }`}>{selectedProductDetails.status}</span>
              </div>
              {selectedProductDetails.description && (
                <div className="py-2 border-b border-[#F0EBE3]">
                  <span className="text-[#8A7E6E] font-semibold block mb-1">Description</span>
                  <span className="text-[#2C2418] text-sm">{selectedProductDetails.description}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedProductDetails(null)}
                className="px-6 py-2.5 bg-[#2C2418] hover:bg-[#4E4433] text-white font-bold text-xs rounded-xl shadow-sm"
              >
                Close Product Details
              </button>
            </div>
          </div>
        </div>
      )}

      {activePopup && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8E0D4] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#E8E0D4] pb-4">
              <div className="flex items-center gap-2">
                <Info size={20} className="text-[#6B5B3E]" />
                <h3 className="text-lg font-extrabold text-[#2C2418]">
                  {activePopup === "carbonCalc" && "Carbon Emissions Calculator & Formula"}
                  {activePopup === "emissions" && "Scope 1, 2 & 3 Carbon Footprint Details"}
                  {activePopup === "velocity" && "Deal Velocity & Turnaround Metrics"}
                  {activePopup === "trustDonut" && "Supplier Trust-Verification Breakdown"}
                  {activePopup === "metric1" && "Active Negotiations Summary"}
                  {activePopup === "metric3" && "Pending Auditor Verification Queue"}
                  {activePopup === "negPanel" && "Active Offer Channel Details"}
                </h3>
              </div>
              <button
                onClick={() => setActivePopup(null)}
                className="text-[#A89B8A] hover:text-[#2C2418] p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {activePopup === "carbonCalc" && (
              <div className="space-y-4 text-sm">
                <p className="text-[#5C5040] font-semibold leading-relaxed">
                  Real-time carbon emissions engine calculated directly from sales, purchases, material carbon intensity, and transport distance &amp; time:
                </p>

                <div className="p-4 bg-[#FAF8F5] border border-[#E8E0D4] rounded-xl font-mono text-xs text-[#2C2418] space-y-1.5">
                  <div className="font-bold text-[#6B5B3E]">Formula:</div>
                  <div>1. Purchase CO&#x2082; = Qty (MT) &times; 1000 &times; Material Factor</div>
                  <div>2. Sales CO&#x2082; = Sales Qty &times; Product Factor</div>
                  <div>3. Transport CO&#x2082; = Weight &times; Distance (km) &times; Mode Factor &times; (1 + Time/10)</div>
                </div>

                <div className="space-y-3 pt-2 border-t border-[#E8E0D4]">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[#5C5040]">Purchase Weight (MT):</span>
                    <input
                      type="number"
                      value={purchaseQtyMT}
                      onChange={(e) => setPurchaseQtyMT(Number(e.target.value))}
                      className="w-28 px-3 py-1.5 border border-[#E8E0D4] rounded-lg text-sm font-mono font-bold"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[#5C5040]">Sales Qty (Units):</span>
                    <input
                      type="number"
                      value={salesQtyUnits}
                      onChange={(e) => setSalesQtyUnits(Number(e.target.value))}
                      className="w-28 px-3 py-1.5 border border-[#E8E0D4] rounded-lg text-sm font-mono font-bold"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[#5C5040]">Transport Distance (km):</span>
                    <input
                      type="number"
                      value={transportDistKm}
                      onChange={(e) => setTransportDistKm(Number(e.target.value))}
                      className="w-28 px-3 py-1.5 border border-[#E8E0D4] rounded-lg text-sm font-mono font-bold"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[#5C5040]">Transport Time (Days):</span>
                    <input
                      type="number"
                      value={transportTimeDays}
                      onChange={(e) => setTransportTimeDays(Number(e.target.value))}
                      className="w-28 px-3 py-1.5 border border-[#E8E0D4] rounded-lg text-sm font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="p-4 bg-[#EEF7F2] border border-[#2E7D5B]/30 rounded-xl space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-[#2E7D5B] font-bold">
                    <span>Purchases Emission:</span>
                    <span>{(purchaseEmissionsKg / 1000).toFixed(2)} MT CO&#x2082;e</span>
                  </div>
                  <div className="flex justify-between text-[#2E7D5B] font-bold">
                    <span>Sales Emission:</span>
                    <span>{(salesEmissionsKg / 1000).toFixed(3)} MT CO&#x2082;e</span>
                  </div>
                  <div className="flex justify-between text-[#2E7D5B] font-bold">
                    <span>Transport Emission:</span>
                    <span>{(transportEmissionsKg / 1000).toFixed(3)} MT CO&#x2082;e</span>
                  </div>
                  <div className="flex justify-between text-[#2C2418] font-extrabold text-base pt-2 border-t border-[#2E7D5B]/30">
                    <span>Total Carbon Footprint:</span>
                    <span>{totalCarbonEmissionsMT.toFixed(2)} MT CO&#x2082;e</span>
                  </div>
                </div>
              </div>
            )}

            {activePopup === "emissions" && (
              <div className="space-y-4 text-sm text-[#5C5040]">
                <p className="leading-relaxed font-semibold">
                  <strong>Emissions Area Chart Details:</strong> Tracks total greenhouse gas emissions across Scope 1 (facility power), Scope 2 (heat), and Scope 3 (upstream logistics).
                </p>
                <div className="p-4 bg-[#FAF8F5] border border-[#E8E0D4] rounded-xl space-y-2 font-mono text-xs">
                  <div>Facilities Tracked: <strong className="text-[#2E7D5B]">{facilities.length}</strong></div>
                  <div>Total Carbon Intensity Factor: <strong className="text-[#2E7D5B]">{totalCarbonIntensity.toFixed(2)}</strong></div>
                  {facilities.map((f) => (
                    <div key={f.id}>
                      {f.name} ({f.location}): <strong className="text-[#2C2418]">{f.carbon_intensity_factor}</strong>
                    </div>
                  ))}
                  {facilities.length === 0 && <div className="text-[#8A7E6E]">No facilities registered yet</div>}
                </div>
              </div>
            )}

            {activePopup === "velocity" && (
              <div className="space-y-4 text-sm text-[#5C5040]">
                <p className="leading-relaxed font-semibold">
                  <strong>Deal Velocity Metrics:</strong> Measures turnaround duration to finalize procurement contract terms and seller offer win rate.
                </p>
                <div className="p-4 bg-[#FAF8F5] border border-[#E8E0D4] rounded-xl space-y-2 font-mono text-xs">
                  <div>Total Negotiations: <strong className="text-[#2C2418]">{negotiations.length}</strong></div>
                  <div>Accepted: <strong className="text-[#2E7D5B]">{negotiations.filter((n) => n.status === "accepted" || n.status === "agreed").length}</strong></div>
                  <div>Pending: <strong className="text-[#C68A17]">{negotiations.filter((n) => n.status !== "accepted" && n.status !== "agreed" && n.status !== "rejected").length}</strong></div>
                </div>
              </div>
            )}

            {activePopup === "trustDonut" && (
              <div className="space-y-4 text-sm text-[#5C5040]">
                <p className="leading-relaxed font-semibold">
                  <strong>Trust-Verification Breakdown:</strong> Provenance records for your organization.
                </p>
                <div className="p-4 bg-[#FAF8F5] border border-[#E8E0D4] rounded-xl space-y-2 font-mono text-xs">
                  {provenanceRecords.length === 0 ? (
                    <div className="text-[#8A7E6E]">No provenance records yet</div>
                  ) : (
                    <>
                      <div className="flex justify-between"><span>Verified:</span><strong className="text-[#2E7D5B]">{provenanceRecords.filter((r) => r.verified_at).length}</strong></div>
                      <div className="flex justify-between"><span>Pending:</span><strong className="text-[#C68A17]">{pendingProvenance.length}</strong></div>
                      <div className="flex justify-between"><span>Total Records:</span><strong className="text-[#2C2418]">{provenanceRecords.length}</strong></div>
                    </>
                  )}
                </div>
              </div>
            )}

            {activePopup === "metric1" && (
              <div className="space-y-4 text-sm text-[#5C5040]">
                <p className="leading-relaxed font-semibold">
                  <strong>Active Negotiations Summary:</strong> All negotiations where your organization is a buyer or seller.
                </p>
                <div className="p-4 bg-[#FAF8F5] border border-[#E8E0D4] rounded-xl space-y-2 font-mono text-xs">
                  <div>Total: <strong className="text-[#2C2418]">{negotiations.length}</strong></div>
                  <div>As Buyer: <strong className="text-[#2E7D5B]">{negotiations.filter((n) => n.buyer_id === org?.id).length}</strong></div>
                  <div>As Seller: <strong className="text-[#C68A17]">{negotiations.filter((n) => n.seller_id === org?.id).length}</strong></div>
                </div>
              </div>
            )}

            {activePopup === "metric3" && (
              <div className="space-y-4 text-sm text-[#5C5040]">
                <p className="leading-relaxed font-semibold">
                  <strong>Pending Verification Queue:</strong> Provenance records awaiting verification.
                </p>
                <div className="p-4 bg-[#FAF8F5] border border-[#E8E0D4] rounded-xl space-y-2 font-mono text-xs">
                  {pendingProvenance.length === 0 ? (
                    <div className="text-[#8A7E6E]">All verifications are complete</div>
                  ) : (
                    pendingProvenance.map((r) => (
                      <div key={r.id} className="flex justify-between py-1 border-b border-[#F0EBE3]">
                        <span>{r.type}</span>
                        <span className="text-[#C68A17] font-bold">Pending</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activePopup === "negPanel" && (
              <div className="space-y-4 text-sm text-[#5C5040]">
                <p className="leading-relaxed font-semibold">
                  <strong>Negotiations Panel:</strong> Live data from your organization&#39;s negotiations.
                </p>
                <div className="p-4 bg-[#FAF8F5] border border-[#E8E0D4] rounded-xl font-mono text-xs">
                  Status: <strong className="text-[#2E7D5B]">{negotiations.length > 0 ? "Active & Synced" : "No negotiations"}</strong>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActivePopup(null)}
                className="px-5 py-2.5 bg-[#2C2418] hover:bg-[#4E4433] text-white font-bold text-xs rounded-xl"
              >
                Close Card
              </button>
            </div>
          </div>
        </div>
      )}

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
                className="text-[#A89B8A] hover:text-[#2C2418] p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-sm font-sans">
              <div className="flex justify-between py-2 border-b border-[#F0EBE3]">
                <span className="text-[#8A7E6E] font-semibold">Counterparty</span>
                <span className="font-bold text-[#2C2418]">{selectedTrace.counterpart}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#F0EBE3]">
                <span className="text-[#8A7E6E] font-semibold">Your Role</span>
                <span className="font-bold text-[#2C2418]">{selectedTrace.role}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#F0EBE3]">
                <span className="text-[#8A7E6E] font-semibold">Status</span>
                <span className={`font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  selectedTrace.status === "accepted" || selectedTrace.status === "agreed"
                    ? "text-[#2E7D5B] bg-[#EEF7F2] border-[#2E7D5B]/30"
                    : selectedTrace.status === "countered"
                    ? "text-[#C68A17] bg-[#FDF5E6] border-[#C68A17]/30"
                    : "text-[#6B5B3E] bg-[#F5F0E8] border-[#6B5B3E]/30"
                }`}>
                  {selectedTrace.status}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#F0EBE3]">
                <span className="text-[#8A7E6E] font-semibold">Provenance Reviewed</span>
                <span className="font-mono font-bold text-[#2E7D5B]">{selectedTrace.provenance_reviewed ? "Yes" : "No"}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 bg-[#2C2418] hover:bg-[#4E4433] text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
