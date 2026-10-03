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
  X,
  Loader2,
  BadgeCheck,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Plus,
  Filter,
} from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";
import { useCurrentOrg } from "@/lib/useCurrentOrg";
import { supabase } from "@/utils/supabaseClient";

interface DbListing {
  id: string;
  organization_id: string;
  facility_id: string | null;
  title: string;
  description: string | null;
  category: string;
  price: number;
  currency: string;
  moq: number;
  unit: string;
  status: string;
  created_at: string;
  organizations: { name: string; role: string } | null;
  facility: { name: string; location: any; carbon_intensity_factor: number } | null;
  provenance_snapshot: {
    confidence_score: number;
    provenance_grade: string;
    active_provenance_records: any[];
  } | null;
  provenance_records: any[];
}

interface EnrichedListing {
  id: string;
  title: string;
  description: string | null;
  category: string;
  price: number;
  currency: string;
  moq: number;
  unit: string;
  status: string;
  created_at: string;
  supplier: string;
  sellerRole: string;
  provenance: "Verified" | "Audited" | "Self-Reported";
  provenanceScore: number;
  co2: string;
  labour: string;
  companyTrust: string;
  location: string;
  sellerAddress: string;
  stock: string;
  transitTime: string;
  transitCost: string;
  transitBearer: string;
  imageColor: string;
  itemTypeIcon: string;
  formattedPrice: string;
  formattedMoq: string;
  provenanceRecordCount: number;
}

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

const PROVENANCE_LABELS: Record<string, "Verified" | "Audited" | "Self-Reported"> = {
  verified: "Verified",
  audited: "Audited",
  self_reported: "Self-Reported",
};

function getRecommendationConfig(role: string): {
  label: string;
  description: string;
  match: (l: EnrichedListing) => boolean;
} {
  switch (role) {
    case "manufacturer":
      return {
        label: "Raw Materials for Manufacturing",
        description: "Sourced from verified suppliers for your production lines",
        match: (l) => l.sellerRole === "supplier",
      };
    case "retailer":
      return {
        label: "Products to Stock",
        description: "Finished goods from distributors and manufacturers",
        match: (l) => l.sellerRole === "distributor" || l.sellerRole === "manufacturer",
      };
    case "distributor":
      return {
        label: "Products to Distribute",
        description: "Bulk finished goods ready for onward sale",
        match: (l) => l.sellerRole === "manufacturer",
      };
    case "supplier":
      return {
        label: "Buyers & Downstream Partners",
        description: "Organizations sourcing raw materials",
        match: () => true,
      };
    case "transporter":
      return {
        label: "All Shipments Needing Transport",
        description: "Every active listing requiring logistics",
        match: () => true,
      };
    case "auditor":
      return {
        label: "Listings Needing Verification",
        description: "Products awaiting your audit expertise",
        match: (l) => l.provenance === "Self-Reported",
      };
    default:
      return {
        label: "Recommended for You",
        description: "Top picks based on your business profile",
        match: () => true,
      };
  }
}

const STORAGE_KEY_FILTERS = "bizznet:marketplace-filters";

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-base font-mono text-[#5C5040]">Loading marketplace...</div>}>
      <MarketplaceContent />
    </Suspense>
  );
}

function MarketplaceContent() {
  const { user, org: authOrg } = useAuth();
  const currentOrg = useCurrentOrg();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<EnrichedListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [listings, setListings] = useState<EnrichedListing[]>([]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [provenanceFilter, setProvenanceFilter] = useState("all");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_FILTERS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.searchQuery !== undefined) setSearchQuery(parsed.searchQuery);
        if (parsed.category !== undefined) setSelectedCategory(parsed.category);
        if (parsed.provenance !== undefined) setProvenanceFilter(parsed.provenance);
        if (parsed.priceMin !== undefined) setPriceMin(parsed.priceMin);
        if (parsed.priceMax !== undefined) setPriceMax(parsed.priceMax);
      } catch {}
    }
  }, []);

  useEffect(() => {
    const v = { searchQuery, category: selectedCategory, provenance: provenanceFilter, priceMin, priceMax };
    localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(v));
  }, [searchQuery, selectedCategory, provenanceFilter, priceMin, priceMax]);

  const userRole = authOrg?.role || currentOrg.role || "manufacturer";
  const recConfig = getRecommendationConfig(userRole);

  function enrichListing(listing: DbListing): EnrichedListing {
    const sellerName = listing.organizations?.name || "Unknown Seller";
    const sellerRole = listing.organizations?.role || "supplier";

    const snapshot = listing.provenance_snapshot;
    let provGrade: "Verified" | "Audited" | "Self-Reported" = "Self-Reported";
    if (snapshot?.provenance_grade) {
      provGrade = PROVENANCE_LABELS[snapshot.provenance_grade] || "Self-Reported";
    } else if (listing.provenance_records && listing.provenance_records.length > 0) {
      provGrade = PROVENANCE_LABELS[listing.provenance_records[0].type] || "Self-Reported";
    }

    const confidence = snapshot?.confidence_score ?? 50;

    const facility = listing.facility;
    const intensity = facility?.carbon_intensity_factor ?? 2.1;
    const co2str = `${Number(intensity).toFixed(1)} kg CO₂e/kg`;

    const location = facility?.location
      ? (typeof facility.location === "string"
          ? facility.location
          : (facility.location as any)?.city
          ? `${(facility.location as any).city}, ${(facility.location as any).state || ""}`
          : "Facility location not specified")
      : "Location not specified";

    const provCount = listing.provenance_records?.length ?? snapshot?.active_provenance_records?.length ?? 0;

    const IMAGE_COLORS: Record<string, { gradient: string; icon: string }> = {
      steel: { gradient: "from-[#6B5B3E] to-[#4E4433]", icon: "Steel Sheets CR4" },
      textiles: { gradient: "from-[#C68A17] to-[#8A7E6E]", icon: "Textile Rolls" },
      plastics: { gradient: "from-[#2E7D5B] to-[#5C5040]", icon: "Polymer Pellets" },
      aluminum: { gradient: "from-[#4E4433] to-[#2C2418]", icon: "Aluminum Ingots" },
      hardware: { gradient: "from-[#6B5B3E] to-[#2C2418]", icon: "Fasteners & Bolts" },
      chemicals: { gradient: "from-[#2E7D5B] to-[#4E4433]", icon: "Chemical Drums" },
      electronics: { gradient: "from-[#4E4433] to-[#6B5B3E]", icon: "Electronic Components" },
      food: { gradient: "from-[#C68A17] to-[#2E7D5B]", icon: "Agri-Commodity" },
    };

    const ic = IMAGE_COLORS[listing.category] || IMAGE_COLORS.steel;

    const formatPrice = (p: number) =>
      new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p);

    return {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      category: listing.category,
      price: listing.price,
      currency: listing.currency,
      moq: listing.moq,
      unit: listing.unit,
      status: listing.status,
      created_at: listing.created_at,
      supplier: sellerName,
      sellerRole,
      provenance: provGrade,
      provenanceScore: confidence,
      co2: co2str,
      labour: provGrade === "Verified" || provGrade === "Audited" ? "3rd-Party Inspected" : "Worker Voluntary",
      companyTrust: provGrade === "Verified" || provGrade === "Audited" ? "3rd-Party Audited" : "Voluntary",
      location,
      sellerAddress: facility?.location
        ? typeof facility.location === "string"
          ? facility.location
          : (facility.location as any)?.address || (facility.location as any)?.street || "Address not specified"
        : "Address not specified",
      stock: `${listing.moq} ${listing.unit} minimum`,
      transitTime: "2-3 Business Days",
      transitCost: "Quoted on RFQ",
      transitBearer: "Seller Paid (FOB Destination)",
      imageColor: ic.gradient,
      itemTypeIcon: ic.icon,
      formattedPrice: `${formatPrice(listing.price)}/${listing.unit}`,
      formattedMoq: `${listing.moq} ${listing.unit}`,
      provenanceRecordCount: provCount,
    };
  }

  async function fetchListings() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          *,
          organizations ( id, name, role ),
          facility:facilities ( name, location, carbon_intensity_factor ),
          provenance_snapshot:listing_provenance_snapshots ( confidence_score, provenance_grade, active_provenance_records )
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rawListings: any[] = data || [];

      const provMap = new Map<string, any[]>();
      const provIds = rawListings
        .filter((l) => l.organization_id)
        .map((l) => l.organization_id);
      const { data: provData } = await supabase
        .from("provenance_records")
        .select("*")
        .in("organization_id", provIds.length ? provIds : [""]);

      for (const rec of provData || []) {
        if (!provMap.has(rec.organization_id)) provMap.set(rec.organization_id, []);
        provMap.get(rec.organization_id)!.push(rec);
      }

      const enriched = rawListings.map((l) =>
        enrichListing({
          ...l,
          provenance_records: provMap.get(l.organization_id) || [],
        } as DbListing)
      );

      setListings(enriched);
    } catch (error) {
      console.error("Failed to fetch listings:", error);
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchListings();

    const channel = supabase
      .channel("marketplace-listings-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "listings" }, () => fetchListings())
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchListings())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredItems = useMemo(() => {
    return listings.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.slice(0, 8).toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === "all" || item.category === selectedCategory;

      const matchesProv =
        provenanceFilter === "all" ||
        (provenanceFilter === "verified" && item.provenance === "Verified") ||
        (provenanceFilter === "audited" && (item.provenance === "Audited" || item.provenance === "Verified")) ||
        (provenanceFilter === "self-reported" && item.provenance === "Self-Reported");

      const matchesPrice = (() => {
        if (!priceMin && !priceMax) return true;
        const min = priceMin ? Number(priceMin) : 0;
        const max = priceMax ? Number(priceMax) : Infinity;
        return item.price >= min && item.price <= max;
      })();

      return matchesSearch && matchesCat && matchesProv && matchesPrice;
    });
  }, [listings, searchQuery, selectedCategory, provenanceFilter, priceMin, priceMax]);

  const recommendedItems = useMemo(
    () => filteredItems.filter((item) => recConfig.match(item)),
    [filteredItems, recConfig]
  );

  function provenanceBadge(grade: string, score?: number) {
    const badge =
      grade === "Verified" ? (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold bg-[#EEF7F2] text-[#2E7D5B] border border-[#2E7D5B]/20">
          <ShieldCheck size={11} /> Verified{score !== undefined && score !== 100 ? ` ${score}%` : ""}
        </span>
      ) : grade === "Audited" ? (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold bg-[#FDF5E6] text-[#C68A17] border border-[#C68A17]/20">
          <ClipboardCheck size={11} /> Audited
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold bg-[#F0EBE3] text-[#8A7E6E] border border-[#8A7E6E]/20">
          <Layers size={11} /> Self-Reported
        </span>
      );
    return badge;
  }

  function renderCard(item: EnrichedListing) {
    return (
      <div
        key={item.id}
        className="bg-white border border-[#E8E0D4] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-[#C68A17]/30 transition-all flex flex-col justify-between group"
      >
        <div>
          <div
            className={`h-36 bg-gradient-to-br ${item.imageColor} p-4 flex flex-col justify-between relative overflow-hidden`}
          >
            <div className="flex justify-between items-start z-10">
              <span className="font-mono text-[10px] font-bold text-white/80 bg-black/25 backdrop-blur-sm px-2 py-0.5 rounded-md">
                {item.id.slice(0, 8)}
              </span>
              {provenanceBadge(item.provenance, item.provenanceScore)}
            </div>
            <div className="z-10">
              <h4 className="text-white font-extrabold text-base tracking-tight drop-shadow-sm">
                {item.itemTypeIcon}
              </h4>
              <p className="text-white/70 font-mono text-[10px] mt-0.5 flex items-center gap-1">
                <BadgeCheck size={11} /> {item.supplier}
              </p>
            </div>
            <div className="absolute right-[-15px] bottom-[-15px] opacity-10 text-white pointer-events-none">
              <Package size={96} />
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div>
              <h3 className="text-base font-extrabold text-[#2C2418] line-clamp-1">{item.title}</h3>
              <p className="text-[10px] font-semibold text-[#8A7E6E] flex items-center gap-1 mt-0.5">
                <MapPin size={11} className="text-[#6B5B3E]" /> {item.location}
              </p>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold text-[#2C2418]">{item.formattedPrice}</span>
            </div>

            <div className="flex items-center gap-3 text-[10px] font-mono text-[#5C5040]">
              <span className="flex items-center gap-1">
                <Package size={11} className="text-[#6B5B3E]" />
                MOQ: {item.formattedMoq}
              </span>
              <span className="flex items-center gap-1">
                <Leaf size={11} className="text-[#2E7D5B]" />
                {item.co2}
              </span>
            </div>

            <div className="flex flex-wrap gap-1">
              <span className="px-1.5 py-0.5 bg-[#EEF7F2] text-[#2E7D5B] rounded text-[9px] font-mono font-bold">
                {item.labour}
              </span>
              <span className="px-1.5 py-0.5 bg-[#F5F0E8] text-[#6B5B3E] rounded text-[9px] font-mono font-bold">
                {item.companyTrust}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 pt-0 flex gap-2">
          <button
            onClick={() => {
              setActiveItem(item);
              setIsDetailModalOpen(true);
            }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#2C2418] hover:bg-[#4E4433] text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
          >
            <ShoppingCart size={13} />
            Add to Inquiry
          </button>
          <button
            onClick={() => {
              setActiveItem(item);
              setIsDetailModalOpen(true);
            }}
            className="inline-flex items-center justify-center px-3 py-2.5 border border-[#E8E0D4] hover:bg-[#FAF8F5] text-[#5C5040] text-xs font-bold rounded-xl transition-colors"
            title="Request a quote"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.72 19.72 0 0 1-8.63-3.07 19.11 19.11 0 0 1-6-6 19.91 19.91 0 0 1-3-5.65 2 2 0 0 1 2-2.17h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 1.3 4.5 12.52 12.52 0 0 0 2.58 4.51 12.52 12.52 0 0 0 4.51 2.58 7 7 0 0 0 4.47.64 2 2 0 0 0 1.72-2.18h1a2 2 0 0 0 2-2v-2.18z"></path></svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C2418] flex flex-col lg:flex-row font-sans">
      <Sidebar currentRole={currentOrg.roleLabel} orgName={currentOrg.orgName} nodeId={currentOrg.nodeId} />

      <main className="flex-1 p-4 md:p-8 space-y-6 overflow-x-hidden max-w-[1600px] mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#2C2418] tracking-tight flex items-center gap-2">
              <Store size={28} className="text-[#C68A17]" />
              Marketplace
            </h1>
            <p className="text-sm text-[#5C5040] mt-0.5">
              Discover verified materials & products from across the supply chain
            </p>
          </div>
          {user && (
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C68A17] hover:bg-[#a87314] text-white rounded-xl text-xs font-bold shadow-md transition-colors"
            >
              <Plus size={15} />
              List Your Product
            </Link>
          )}
        </div>

        <div className="bg-white border border-[#E8E0D4] rounded-2xl p-4 shadow-sm space-y-3">
          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A89B8A]" />
            <input
              type="text"
              placeholder="Search materials, products, sellers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-semibold text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-2 focus:ring-[#C68A17]/40"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <SlidersHorizontal size={14} className="text-[#8A7E6E] shrink-0" />
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${
                  selectedCategory === cat.key
                    ? "bg-[#2C2418] text-white border-[#2C2418]"
                    : "bg-[#FAF8F5] text-[#5C5040] border-[#E8E0D4] hover:bg-[#F0EBE3]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <Filter size={13} className="text-[#8A7E6E]" />
              <span className="font-mono font-bold text-[#8A7E6E]">Provenance:</span>
              <select
                value={provenanceFilter}
                onChange={(e) => setProvenanceFilter(e.target.value)}
                className="px-2 py-1 border border-[#E8E0D4] bg-[#FAF8F5] rounded-lg text-xs font-bold text-[#2C2418] focus:outline-none focus:ring-1 focus:ring-[#C68A17]"
              >
                <option value="all">All Grades</option>
                <option value="verified">Verified</option>
                <option value="audited">Audited or Verified</option>
                <option value="self-reported">Self-Reported</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#8A7E6E]">Price (INR):</span>
              <input
                type="number"
                placeholder="Min"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                className="w-16 px-2 py-1 border border-[#E8E0D4] bg-[#FAF8F5] rounded-lg text-xs font-mono text-[#2C2418] focus:outline-none focus:ring-1 focus:ring-[#C68A17]"
              />
              <span className="text-[#8A7E6E]">—</span>
              <input
                type="number"
                placeholder="Max"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="w-16 px-2 py-1 border border-[#E8E0D4] bg-[#FAF8F5] rounded-lg text-xs font-mono text-[#2C2418] focus:outline-none focus:ring-1 focus:ring-[#C68A17]"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-[#C68A17]" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <Package size={56} className="mx-auto text-[#E8E0D4]" />
            <p className="text-lg font-bold text-[#5C5040]">The marketplace is empty</p>
            <p className="text-sm text-[#8A7E6E]">No products have been listed by suppliers yet.</p>
            {user && (
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2C2418] hover:bg-[#4E4433] text-white rounded-xl text-xs font-bold transition-colors"
              >
                <Plus size={15} />
                Be the First to List
              </Link>
            )}
          </div>
        ) : (
          <>
            {!user && (
              <div className="bg-[#F5F0E8] border border-[#E8E0D4] rounded-xl p-4 text-sm text-[#5C5040]">
                <strong>Tip:</strong> Sign in to see personalized recommendations and save your filter preferences.
              </div>
            )}

            {user && recommendedItems.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-[#C68A17]" />
                  <div>
                    <h2 className="text-lg font-extrabold text-[#2C2418]">{recConfig.label}</h2>
                    <p className="text-[11px] text-[#8A7E6E]">{recConfig.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {recommendedItems.slice(0, 8).map(renderCard)}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-[#2C2418]">All Listings</h2>
                <span className="text-xs font-mono font-bold text-[#8A7E6E] bg-[#F0EBE3] px-2.5 py-1 rounded-full">
                  {filteredItems.length} {filteredItems.length === 1 ? "result" : "results"}
                </span>
              </div>

              {filteredItems.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Search size={40} className="mx-auto text-[#E8E0D4]" />
                  <p className="text-sm font-semibold text-[#5C5040]">No listings match your current filters</p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                      setProvenanceFilter("all");
                      setPriceMin("");
                      setPriceMax("");
                    }}
                    className="text-xs font-bold text-[#C68A17] hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredItems.map(renderCard)}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {isDetailModalOpen && activeItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8E0D4] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#E8E0D4] pb-4">
              <div className="flex gap-4 items-center">
                <div
                  className={`size-14 rounded-xl bg-gradient-to-br ${activeItem.imageColor} flex items-center justify-center text-white shrink-0 shadow-md`}
                >
                  <Package size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[#6B5B3E] font-bold">{activeItem.id.slice(0, 8)}</span>
                    {provenanceBadge(activeItem.provenance, activeItem.provenanceScore)}
                  </div>
                  <h3 className="text-xl font-extrabold text-[#2C2418] mt-0.5">{activeItem.title}</h3>
                  <p className="text-xs text-[#8A7E6E] font-semibold flex items-center gap-1">
                    <BadgeCheck size={12} className="text-[#2E7D5B]" />
                    {activeItem.supplier} &bull; {activeItem.category?.toUpperCase() || "N/A"} &bull; {activeItem.sellerRole}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 text-[#A89B8A] hover:text-[#2C2418] hover:bg-[#F0EBE3] rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E8E0D4] space-y-2 text-xs font-mono">
                <h4 className="font-extrabold text-sm text-[#2C2418] font-sans pb-1 border-b border-[#E8E0D4]">Pricing & Specs</h4>
                <div className="flex justify-between"><span className="text-[#8A7E6E]">Price:</span><strong className="text-[#2C2418] font-extrabold text-sm">{activeItem.formattedPrice}</strong></div>
                <div className="flex justify-between"><span className="text-[#8A7E6E]">MOQ:</span><span className="text-[#2C2418] font-bold">{activeItem.formattedMoq}</span></div>
                <div className="flex justify-between"><span className="text-[#8A7E6E]">Available:</span><span className="text-[#2E7D5B] font-bold">{activeItem.stock}</span></div>
                <div className="flex justify-between"><span className="text-[#8A7E6E]">Carbon Intensity:</span><span className="text-[#2E7D5B] font-bold">{activeItem.co2}</span></div>
              </div>
              <div className="p-4 bg-[#F5F0E8] rounded-xl border border-[#E8E0D4] space-y-2 text-xs font-mono">
                <h4 className="font-extrabold text-sm text-[#2C2418] font-sans pb-1 border-b border-[#E8E0D4]">Transport & Freight</h4>
                <div className="flex justify-between"><span className="text-[#8A7E6E]">Transit Time:</span><strong className="text-[#2C2418] font-bold">{activeItem.transitTime}</strong></div>
                <div className="flex justify-between"><span className="text-[#8A7E6E]">Transport Cost:</span><strong className="text-[#6B5B3E] font-bold">{activeItem.transitCost}</strong></div>
                <div className="flex justify-between"><span className="text-[#8A7E6E]">Freight Bearer:</span><strong className="text-[#2E7D5B] font-bold">{activeItem.transitBearer}</strong></div>
              </div>
            </div>

            {activeItem.description && (
              <div className="p-4 bg-white rounded-xl border border-[#E8E0D4]">
                <h4 className="text-xs font-mono uppercase font-bold text-[#8A7E6E] mb-2">Description</h4>
                <p className="text-sm text-[#2C2418] leading-relaxed">{activeItem.description}</p>
              </div>
            )}

            <div className="p-4 bg-white rounded-xl border border-[#E8E0D4] space-y-1.5">
              <h4 className="text-[10px] font-mono uppercase font-bold text-[#8A7E6E] flex items-center gap-1.5">
                <MapPin size={13} className="text-[#6B5B3E]" /> Seller Facility & Address
              </h4>
              <p className="text-sm font-bold text-[#2C2418]">{activeItem.supplier}</p>
              <p className="text-xs text-[#5C5040] leading-relaxed font-mono">{activeItem.sellerAddress}</p>
            </div>

            <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E8E0D4] space-y-3 text-xs">
              <h4 className="font-extrabold text-sm text-[#2C2418]">Supply Chain Audit & Provenance</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-white rounded-lg border border-[#E8E0D4]">
                  <span className="text-[#8A7E6E] font-mono block text-[10px]">Provenance Grade</span>
                  <strong className={`font-bold block mt-0.5 ${
                    activeItem.provenance === "Verified"
                      ? "text-[#2E7D5B]"
                      : activeItem.provenance === "Audited"
                      ? "text-[#C68A17]"
                      : "text-[#8A7E6E]"
                  }`}>{activeItem.provenance}</strong>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#E8E0D4]">
                  <span className="text-[#8A7E6E] font-mono block text-[10px]">Confidence Score</span>
                  <strong className="text-[#2C2418] font-bold block mt-0.5">{activeItem.provenanceScore}%</strong>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#E8E0D4]">
                  <span className="text-[#8A7E6E] font-mono block text-[10px]">Audit Records</span>
                  <strong className="text-[#6B5B3E] font-bold block mt-0.5">{activeItem.provenanceRecordCount}</strong>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row justify-end gap-3 border-t border-[#E8E0D4]">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2.5 border border-[#E8E0D4] hover:bg-[#FAF8F5] text-[#5C5040] font-bold text-xs rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert(`Inquiry submitted for ${activeItem.title}! Opening negotiation channel.`);
                  setIsDetailModalOpen(false);
                }}
                className="px-6 py-2.5 bg-[#C68A17] hover:bg-[#a87314] text-white font-bold text-xs rounded-xl transition-colors shadow-sm inline-flex items-center gap-2"
              >
                <ShoppingCart size={14} />
                Add to Inquiry
              </button>
              <button
                onClick={() => {
                  alert(`Quote request sent to ${activeItem.supplier} for ${activeItem.title}.`);
                  setIsDetailModalOpen(false);
                }}
                className="px-6 py-2.5 bg-[#2C2418] hover:bg-[#4E4433] text-white font-bold text-xs rounded-xl transition-colors shadow-sm inline-flex items-center justify-center gap-2"
              >
                Request Quote
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
