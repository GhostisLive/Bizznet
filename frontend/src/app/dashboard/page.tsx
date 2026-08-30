"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  ClipboardCheck,
  FileText,
  ArrowRight,
  Plus,
  Search,
  Filter,
  Upload,
  CheckCircle2,
  Activity,
  Layers,
  Download,
  ExternalLink,
  Briefcase,
  RotateCcw,
  RefreshCw,
  TrendingDown
} from "lucide-react";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

type Role =
  | "supplier"
  | "manufacturer"
  | "distributor"
  | "retailer"
  | "transporter"
  | "auditor"
  | "admin";

interface TraceTarget {
  id?: string;
  title?: string;
  listing?: string;
  category?: string;
  price?: string;
  qty?: string;
  quantity?: string;
  provenance?: string;
  co2?: string;
  carbon?: string;
  supplier?: string;
  partner?: string;
  type?: string;
  status?: string;
}

interface OrganizationInfo {
  name: string;
  roleLabel: string;
  location: string;
  scopeEmissions: string;
  provenanceScore: string;
}

const roleConfigs: Record<Role, OrganizationInfo> = {
  supplier: {
    name: "Greenfield Polymers Ltd.",
    roleLabel: "Raw Material Supplier",
    location: "Dahej, Gujarat",
    scopeEmissions: "1,240 MT CO2e (YTD)",
    provenanceScore: "94/100 Grade A",
  },
  manufacturer: {
    name: "Apex Auto Component Assembly",
    roleLabel: "Manufacturer",
    location: "Chennai, Tamil Nadu",
    scopeEmissions: "4,850 MT CO2e (YTD)",
    provenanceScore: "88/100 Grade B",
  },
  distributor: {
    name: "Metro Logistics & Warehousing",
    roleLabel: "Distributor",
    location: "Bhiwandi, Maharashtra",
    scopeEmissions: "850 MT CO2e (YTD)",
    provenanceScore: "82/100 Grade B",
  },
  retailer: {
    name: "Nordic Lifestyle Brand",
    roleLabel: "Retailer",
    location: "Bangalore, Karnataka",
    scopeEmissions: "320 MT CO2e (YTD)",
    provenanceScore: "96/100 Grade A",
  },
  transporter: {
    name: "Swift Carrier Solutions",
    roleLabel: "Transporter",
    location: "National Permit Operator",
    scopeEmissions: "12,400 MT CO2e (YTD)",
    provenanceScore: "91/100 Grade A",
  },
  auditor: {
    name: "Veritas Certification Services",
    roleLabel: "Third-Party Auditor",
    location: "Mumbai HQ",
    scopeEmissions: "N/A",
    provenanceScore: "N/A",
  },
  admin: {
    name: "BizzNet Operations",
    roleLabel: "Platform Administrator",
    location: "Remote Control Command",
    scopeEmissions: "N/A",
    provenanceScore: "N/A",
  },
};

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-mono">Loading BizzNet Audit Session...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role") as Role;
  const isSandbox = searchParams.get("sandbox") === "true";

  // Simulate active session role resolved from auth token (defaults to manufacturer if query param or storage is absent)
  const [activeRole, setActiveRole] = useState<Role>(
    roleParam && roleConfigs[roleParam] ? roleParam : "manufacturer"
  );

  // In production, context is parsed from Supabase JWT claims:
  // const { user } = useAuth();
  // const activeRole = user?.user_metadata?.role as Role;

  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [isTraceModalOpen, setIsTraceModalOpen] = useState(false);
  const [selectedListingTrace, setSelectedListingTrace] = useState<TraceTarget | null>(null);
  const [negotiations, setNegotiations] = useState([
    {
      id: "NEG-4091",
      listing: "Grade A Recycled HDPE Pellets",
      partner: "Greenfield Polymers Ltd.",
      type: "buy",
      price: "₹72,500/MT",
      quantity: "25 MT",
      status: "In Review",
      provenance: "Verified",
      carbon: "1.8 kg CO2e/kg",
      history: [
        { sender: "Greenfield", text: "Offer set to ₹74,000/MT for 25 MT MOQ.", time: '10:14 AM' },
        { sender: "You", text: "Bid submitted: ₹72,500/MT based on certified low carbon rating.", time: '11:30 AM' }
      ]
    },
    {
      id: "NEG-4095",
      listing: "Pre-Assembled Gearboxes (300 Units)",
      partner: "Metro Logistics & Warehousing",
      type: "sell",
      price: "₹1,45,000/Unit",
      quantity: "300 Units",
      status: "Proposed",
      provenance: "Audited",
      carbon: "18.4 kg CO2e/unit",
      history: [
        { sender: "Metro", text: "Requested verification certificate for steel components source.", time: 'Yesterday' }
      ]
    }
  ]);
  const [listings, setListings] = useState([
    {
      id: "LIST-981",
      title: "Cold-Rolled Steel Sheets CR4",
      category: "steel",
      price: "₹48,200/MT",
      qty: "50 MT",
      provenance: "Verified",
      co2: "2.1 kg CO2e/kg",
      supplier: "Tata Steel Ltd.",
    },
    {
      id: "LIST-982",
      title: "Organic Cotton Fibre combed",
      category: "textiles",
      price: "₹740/kg",
      qty: "1,200 kg",
      provenance: "Verified",
      co2: "3.7 kg CO2e/kg",
      supplier: "Vardhman Textiles",
    },
    {
      id: "LIST-983",
      title: "Virgin Aluminum Ingots AL-99",
      category: "aluminum",
      price: "₹2,10,000/MT",
      qty: "15 MT",
      provenance: "Audited",
      co2: "8.4 kg CO2e/kg",
      supplier: "Hindalco Industries",
    },
    {
      id: "LIST-984",
      title: "Recycled PET Flakes Green",
      category: "plastics",
      price: "₹64,000/MT",
      qty: "40 MT",
      provenance: "Self-Reported",
      co2: "1.2 kg CO2e/kg",
      supplier: "Dalmia Polypro",
    }
  ]);

  const [activeTab, setActiveTab] = useState(() => {
    const role = roleParam && roleConfigs[roleParam] ? roleParam : "manufacturer";
    return role === "auditor" || role === "admin" ? "adminPanel" : "overview";
  });
  const [activeNegotiationId, setActiveNegotiationId] = useState<string>("NEG-4091");
  const [chatInput, setChatInput] = useState("");
  const activeNeg = negotiations.find(n => n.id === activeNegotiationId) || negotiations[0];
  const [restStatus, setRestStatus] = useState<"offline" | "connected">("offline");

  const handleSyncREST = useCallback(async () => {
    try {
      const resHealth = await fetch("http://localhost:8000/health", { method: "GET" });
      if (resHealth.ok) {
        setRestStatus("connected");
      } else {
        setRestStatus("offline");
      }
    } catch {
      setRestStatus("offline");
    }

    try {
      const resListings = await fetch("http://localhost:8000/api/v1/marketplace/listings");
      if (resListings.ok) {
        const data = await resListings.json();
        if (data && data.length > 0) {
          const mapped = data.map((l: { id?: string; title: string; category?: string; price?: number; moq?: number; supplier_name?: string }) => ({
            id: l.id || `LIST-${Math.floor(100 + Math.random() * 900)}`,
            title: l.title,
            category: l.category || "custom",
            price: l.price ? `₹${l.price.toLocaleString()}/MT` : "₹0/MT",
            qty: `${l.moq || 25} MT`,
            provenance: "Self-Reported",
            co2: "2.4 kg CO2e/kg",
            supplier: l.supplier_name || "Enterprise Supplier"
          }));
          setListings(mapped);
        }
      }
    } catch {
      console.warn("REST sync failed for listings.");
    }

    try {
      const resNegs = await fetch("http://localhost:8000/api/v1/negotiation/negotiations");
      if (resNegs.ok) {
        const data = await resNegs.json();
        if (data && data.length > 0) {
          const mapped = data.map((n: { id?: string; listing_title?: string; partner_name?: string; buyer_id?: string; final_price?: number; final_quantity?: number; status?: string }) => ({
            id: n.id || `NEG-${Math.floor(4000 + Math.random() * 100)}`,
            listing: n.listing_title || "HDPE Pellets",
            partner: n.partner_name || "Greenfield Polymers Ltd.",
            type: n.buyer_id === "You" ? "buy" : "sell",
            price: `₹${(n.final_price || 72500).toLocaleString()}/MT`,
            quantity: `${n.final_quantity || 25} MT`,
            status: n.status === "agreed" ? "Proposed" : "In Review",
            provenance: "Verified",
            carbon: "1.8 kg CO2e/kg",
            history: [
              { sender: "System", text: `Backend synced negotiation status: ${n.status}`, time: "Just Now" }
            ]
          }));
          setNegotiations(mapped);
        }
      }
    } catch {
      console.warn("REST sync failed for negotiations.");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    handleSyncREST();
  }, [activeRole, handleSyncREST]);

  const handleResetSandbox = () => {
    setListings([
      {
        id: "LIST-981",
        title: "Cold-Rolled Steel Sheets CR4",
        category: "steel",
        price: "₹48,200/MT",
        qty: "50 MT",
        provenance: "Verified",
        co2: "2.1 kg CO2e/kg",
        supplier: "Tata Steel Ltd.",
      },
      {
        id: "LIST-982",
        title: "Organic Cotton Fibre combed",
        category: "textiles",
        price: "₹740/kg",
        qty: "1,200 kg",
        provenance: "Verified",
        co2: "3.7 kg CO2e/kg",
        supplier: "Vardhman Textiles",
      },
      {
        id: "LIST-983",
        title: "Virgin Aluminum Ingots AL-99",
        category: "aluminum",
        price: "₹2,10,000/MT",
        qty: "15 MT",
        provenance: "Audited",
        co2: "8.4 kg CO2e/kg",
        supplier: "Hindalco Industries",
      },
      {
        id: "LIST-984",
        title: "Recycled PET Flakes Green",
        category: "plastics",
        price: "₹64,000/MT",
        qty: "40 MT",
        provenance: "Self-Reported",
        co2: "1.2 kg CO2e/kg",
        supplier: "Dalmia Polypro",
      }
    ]);

    setNegotiations([
      {
        id: "NEG-4091",
        listing: "Grade A Recycled HDPE Pellets",
        partner: "Greenfield Polymers Ltd.",
        type: "buy",
        price: "₹72,500/MT",
        quantity: "25 MT",
        status: "In Review",
        provenance: "Verified",
        carbon: "1.8 kg CO2e/kg",
        history: [
          { sender: "Greenfield", text: "Offer set to ₹74,000/MT for 25 MT MOQ.", time: '10:14 AM' },
          { sender: "You", text: "Bid submitted: ₹72,500/MT based on certified low carbon rating.", time: '11:30 AM' }
        ]
      },
      {
        id: "NEG-4095",
        listing: "Pre-Assembled Gearboxes (300 Units)",
        partner: "Metro Logistics & Warehousing",
        type: "sell",
        price: "₹1,45,000/Unit",
        quantity: "300 Units",
        status: "Proposed",
        provenance: "Audited",
        carbon: "18.4 kg CO2e/unit",
        history: [
          { sender: "Metro", text: "Requested verification certificate for steel components source.", time: 'Yesterday' }
        ]
      }
    ]);

    setActiveTab(activeRole === "auditor" || activeRole === "admin" ? "adminPanel" : "overview");
    alert("Sandbox state fully reset to default.");
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setNegotiations(prev => prev.map(n => {
      if (n.id === activeNeg.id) {
        return {
          ...n,
          history: [...n.history, { sender: "You", text: chatInput, time: "Just Now" }]
        };
      }
      return n;
    }));
    setChatInput("");
  };

  const handleCreateListing = async () => {
    const title = prompt("Enter listing title / spec:");
    if (!title) return;
    const priceStr = prompt("Enter unit price (e.g. 75000):") || "0";
    const qtyStr = prompt("Enter available volume (e.g. 50):") || "0";
    const gradeInput = prompt("Enter provenance grade (Verified / Audited / Self-Reported):") || "Self-Reported";
    
    let verifiedInput = "Self-Reported";
    if (gradeInput.toLowerCase().includes("verify") || gradeInput.toLowerCase().includes("verif")) {
      verifiedInput = "Verified";
    } else if (gradeInput.toLowerCase().includes("audit")) {
      verifiedInput = "Audited";
    }

    const numericPrice = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
    const numericQty = parseFloat(qtyStr.replace(/[^0-9.]/g, '')) || 0;

    try {
      await fetch("http://localhost:8000/api/v1/marketplace/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          price: numericPrice,
          unit: "MT",
          quantity: numericQty,
          moq: numericQty,
          description: `Custom listing under BizzNet role ${activeRole}`
        })
      });
      console.log("Listing successfully pushed to remote SQL DB.");
    } catch {
      console.warn("Backend REST API offline during POST listing. Storing locally.");
    }

    const newListing = {
      id: `LIST-${Math.floor(100 + Math.random() * 900)}`,
      title,
      category: "custom",
      price: `₹${numericPrice.toLocaleString()}/MT`,
      qty: `${numericQty} MT`,
      provenance: verifiedInput,
      co2: "2.4 kg CO2e/kg",
      supplier: roleConfigs[activeRole].name
    };

    setListings([newListing, ...listings]);
  };

  const handleReviewTrace = (listing: TraceTarget) => {
    setSelectedListingTrace(listing);
    setIsTraceModalOpen(true);
  };

  // Reusable Awwwards-Tier Double Bezel Container Wrapper
  const DoubleBezelCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`p-1 bg-text-primary/[0.02] ring-1 ring-text-primary/[0.03] rounded-[2rem] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-accent/15 hover:bg-accent/[0.01] hover:scale-[1.008] ${className}`}>
      <div className="bg-surface-elevated shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)] border border-border-subtle/50 rounded-[calc(2rem-0.25rem)] p-6 flex flex-col justify-between h-full">
        {children}
      </div>
    </div>
  );

  const currentOrg = roleConfigs[activeRole];

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col font-sans relative overflow-x-hidden">
      {/* Decorative vertical grid guides for structure/tension */}
      <div className="fixed top-0 bottom-0 left-4 right-4 md:left-12 md:right-12 border-x border-[#1a1a18]/[0.02] pointer-events-none z-0" />
      <div className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-[#1a1a18]/[0.02] pointer-events-none z-0" />

      {/* Subtle organic paper-dot texturing overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015] z-50 bg-[radial-gradient(#1a1a18_1px,transparent_0)] bg-[size:16px_16px]" />

      {/* Top Banner: Role Mode Indicator */}
      {isSandbox ? (
        <div className="bg-cta-bg text-cta-text border-b border-border-subtle py-2 px-6 flex flex-wrap items-center justify-between gap-4 text-xs font-mono relative z-50">
          <div className="flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-accent animate-ping" />
            <span className="tracking-wider">ROLE SELECTOR SIMULATOR (SANDBOX MODE)</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(Object.keys(roleConfigs) as Role[]).map((role) => (
              <button
                key={role}
                onClick={() => {
                  setActiveRole(role);
                  setActiveTab(role === "auditor" || role === "admin" ? "adminPanel" : "overview");
                }}
                className={`px-3 py-1 rounded-full text-[11px] font-mono transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96] ${
                  activeRole === role
                    ? "bg-accent text-white shadow-sm"
                    : "bg-surface/10 hover:bg-surface/20 text-cta-text/80 hover:text-cta-text"
                }`}
              >
                {roleConfigs[role].roleLabel}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-surface/40 text-text-secondary border-b border-border-subtle py-2 px-6 flex items-center justify-between text-[11px] font-mono relative z-50">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-verified animate-pulse" />
            <span>AUTHENTICATED SECURE SESSION: <strong className="text-text-primary uppercase tracking-widest">{currentOrg.roleLabel}</strong></span>
          </div>
          <div>
            <span>ORGANIZATION ID: <strong className="text-text-primary font-bold">BIZZ-{activeRole.toUpperCase().substring(0, 3)}–{(currentOrg.location.replace(/[^a-zA-Z]/g, '') || 'REMOTE').toUpperCase().substring(0, 3)}</strong></span>
          </div>
        </div>
      )}

      {/* Main Dashboard Nav (Pill navigation style) */}
      <header className="mx-auto w-[calc(100%-2rem)] max-w-7xl mt-6 rounded-[2rem] border border-border-subtle bg-surface-elevated/80 backdrop-blur-md px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between sticky top-6 z-40 shadow-xs/60 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
        <div className="flex items-center gap-3">
          <span className="block size-2.5 rounded-full bg-accent animate-pulse" />
          <div>
            <h1 className="text-base md:text-lg font-bold tracking-tight text-text-primary">{currentOrg.name}</h1>
            <p className="text-[10px] md:text-xs font-mono text-text-tertiary flex items-center gap-1.5 mt-0.5">
              <span>{currentOrg.roleLabel}</span>
              <span className="inline-block size-1 bg-border rounded-full" />
              <span>{currentOrg.location}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-3 md:mt-0 w-full md:w-auto justify-between md:justify-end">
          <div className="hidden lg:flex items-center gap-6 text-[11px] font-mono text-text-secondary mr-2">
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-text-tertiary uppercase tracking-wider">Scope Emissions YTD</span>
              <span className="text-text-primary font-bold">{currentOrg.scopeEmissions}</span>
            </div>
            <div className="w-px h-6 bg-border-subtle" />
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-text-tertiary uppercase tracking-wider">Independent Score</span>
              <span className="text-verified font-bold">{currentOrg.provenanceScore}</span>
            </div>
          </div>

          <nav className="p-1 bg-text-primary/[0.03] ring-1 ring-text-primary/[0.03] rounded-full flex items-center gap-1">
            {activeRole !== "admin" && activeRole !== "auditor" && (
              <>
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-4 py-1.5 text-xs font-mono font-medium rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96] ${
                    activeTab === "overview"
                      ? "bg-cta-bg text-cta-text shadow-[0_2px_10px_rgba(26,26,24,0.15)] font-semibold"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("workspace")}
                  className={`px-4 py-1.5 text-xs font-mono font-medium rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96] ${
                    activeTab === "workspace"
                      ? "bg-cta-bg text-cta-text shadow-[0_2px_10px_rgba(26,26,24,0.15)] font-semibold"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Workspace
                </button>
                <button
                  onClick={() => setActiveTab("marketplace")}
                  className={`px-4 py-1.5 text-xs font-mono font-medium rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96] ${
                    activeTab === "marketplace"
                      ? "bg-cta-bg text-cta-text shadow-[0_2px_10px_rgba(26,26,24,0.15)] font-semibold"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Marketplace
                </button>
              </>
            )}
            {(activeRole === "admin" || activeRole === "auditor") && (
              <button
                onClick={() => setActiveTab("adminPanel")}
                className={`px-4 py-1.5 text-xs font-mono font-semibold rounded-full bg-cta-bg text-cta-text shadow-[0_2px_10px_rgba(26,26,24,0.15)]`}
              >
                Control Board
              </button>
            )}
            <button
              onClick={() => setActiveTab("vault")}
              className={`px-4 py-1.5 text-xs font-mono font-medium rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96] ${
                activeTab === "vault"
                  ? "bg-cta-bg text-cta-text shadow-[0_2px_10px_rgba(26,26,24,0.15)] font-semibold"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Vault
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 flex flex-col gap-6 relative z-10">

        {/* Overview Tab View */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6">
            {/* Top Stats Overview (Asymmetrical Bento) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Carbon footprint (col-span-2) */}
              <DoubleBezelCard className="md:col-span-2">
                <span className="text-[10px] font-mono font-medium text-text-tertiary uppercase tracking-[0.2em]">Environmental Quotient</span>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-text-primary font-sans">{currentOrg.scopeEmissions.split(" ")[0]}</h2>
                    <p className="text-xs font-mono text-text-secondary mt-1">MT CO2e (Year to Date Target)</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-mono bg-verified-light text-verified px-3 py-1 rounded-full border border-verified/10">
                    <TrendingDown className="size-3.5" strokeWidth={1.5} />
                    <span>-8.4% vs 2025 baseline</span>
                  </div>
                </div>
                <div className="mt-6 border-t border-border-subtle/40 pt-4 text-[11px] text-text-tertiary flex justify-between">
                  <span>Carbon intensity certified under ISO-14064 registry</span>
                  <span className="text-verified font-medium">99.2% confidence</span>
                </div>
              </DoubleBezelCard>

              {/* Card 2: Asset Trust Score (col-span-1) */}
              <DoubleBezelCard>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono font-medium text-text-tertiary uppercase tracking-[0.2em]">Trust Grade</span>
                  <span className="bg-verified-light border border-verified/10 size-6 rounded-full flex items-center justify-center">
                    <ShieldCheck className="size-3.5 text-verified" strokeWidth={1.5} />
                  </span>
                </div>
                <div className="mt-4">
                  <h2 className="text-2xl font-bold tracking-tight text-verified font-sans">{currentOrg.provenanceScore}</h2>
                  <p className="text-xs font-mono text-text-secondary mt-1">Independent Chain Verification</p>
                </div>
                <div className="mt-6 border-t border-[#1a7a4c]/5 pt-4 text-[11px] text-text-tertiary">
                  <span>Cryptographic signature audited</span>
                </div>
              </DoubleBezelCard>

              {/* Card 3: Active Deals (col-span-1) */}
              <DoubleBezelCard>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono font-medium text-text-tertiary uppercase tracking-[0.2em]">Active Channels</span>
                  <span className="bg-text-primary/5 size-6 rounded-full flex items-center justify-center">
                    <Activity className="size-3.5 text-accent animate-pulse" strokeWidth={1.5} />
                  </span>
                </div>
                <div className="mt-4">
                  <h2 className="text-2xl font-bold tracking-tight text-text-primary font-sans">{negotiations.length} Channels</h2>
                  <p className="text-xs font-mono text-text-secondary mt-1">{negotiations.filter(n => n.status === "In Review").length} locked bids</p>
                </div>
                <div className="mt-6 border-t border-border-subtle/40 pt-4 text-[11px] text-text-tertiary">
                  <span>Real-time negotiation pipelines</span>
                </div>
              </DoubleBezelCard>
            </div>

            {/* Mid Section: Bento Grid Segment 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Card 4 (ESG assurance ratio & Circ Recirculation) */}
              <DoubleBezelCard className="lg:col-span-1">
                <div>
                  <span className="text-[9px] font-mono font-semibold px-2 py-0.5 bg-verified-light text-verified rounded-full uppercase tracking-wider">Independent Audit</span>
                  <h3 className="text-base font-bold tracking-tight text-text-primary mt-2 font-sans">Verification & Assurance Indicators</h3>
                  <p className="text-xs text-text-tertiary mt-1">Material assurance levels & raw carbon allocation segments.</p>
                </div>

                {/* Audit Coverage Progress Bar */}
                <div className="flex flex-col gap-2 mt-6">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-text-secondary">Provenance Assurance Ratio</span>
                    <span className="font-bold text-verified">94% Target-Aligned</span>
                  </div>
                  
                  {/* Real Segmented Bar with premium styling */}
                  <div className="h-6 w-full rounded-lg overflow-hidden flex text-[10px] font-mono text-white text-center font-bold">
                    <div style={{ width: "55%" }} className="bg-verified flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]" title="Verified (Checked against independent chain of custody certs)">
                      55% VER
                    </div>
                    <div style={{ width: "30%" }} className="bg-[#b38864] flex items-center justify-center text-text-primary" title="Audited (Supplier documented with local inspections)">
                      30% AUD
                    </div>
                    <div style={{ width: "15%" }} className="bg-surface/50 border-l border-border-subtle flex items-center justify-center text-text-secondary" title="Self-Reported (Unverified supplier emissions statement)">
                      15% SR
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-[11px] font-mono text-text-secondary">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-verified" />
                      <span>Verified: Custody Certs</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-1">
                      <span className="size-2 rounded-full bg-[#b38864]" />
                      <span>Audited: Inspections</span>
                    </div>
                  </div>
                </div>

                {/* Waste diversion metric & graph */}
                <div className="border-t border-border-subtle/50 pt-6 mt-6 flex flex-col gap-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono text-text-secondary font-bold">Circular Recirculation Factor</span>
                    <span className="font-mono font-bold text-text-primary">74.2% Diverted</span>
                  </div>
                  <div className="h-2 w-full bg-surface rounded-full overflow-hidden p-0.5 border border-border-subtle/30">
                    <div className="h-full bg-verified rounded-full" style={{ width: "74.2%" }} />
                  </div>
                  <p className="text-[11px] text-text-tertiary leading-relaxed mt-1">
                    Recovers scrap iron filings and polymers dynamically mapped back through the BizzNet catalog exchange.
                  </p>
                </div>
              </DoubleBezelCard>

              {/* BizzNet Spot Rates & Carbon Premium Indexes */}
              <DoubleBezelCard className="lg:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-mono font-semibold px-2 py-0.5 bg-text-primary/5 text-text-secondary rounded-full uppercase tracking-wider">Indexed Spot Rates</span>
                    <h3 className="text-base font-bold tracking-tight text-text-primary mt-2 font-sans">BizzNet Spot Rates & Carbon Premium Indexes</h3>
                    <p className="text-xs text-text-tertiary mt-1">Real-time low-carbon material price premium tracking.</p>
                  </div>
                  <span className="text-[10px] font-mono bg-surface border border-border-subtle/50 rounded-full px-3 py-1 text-text-secondary uppercase select-none">
                    Live Indexed
                  </span>
                </div>

                {/* 4 Sparkline charts grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {/* Steel */}
                  <div className="border border-border-subtle/50 bg-background/40 hover:bg-background/80 rounded-2xl p-4 flex flex-col gap-3 transition-colors duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-text-primary uppercase">Steel CR4 Sheets</span>
                      <span className="text-[10px] font-mono bg-verified-light text-verified px-2 py-0.5 rounded-full">-2.4% CO2</span>
                    </div>
                    <div className="h-10 relative w-full flex items-end">
                      <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                        <path d="M 0 18 L 20 16 L 40 18 L 60 12 L 80 8 L 100 5" fill="none" stroke="var(--verified)" strokeWidth="1.5" />
                        <path d="M 0 18 L 20 16 L 40 18 L 60 12 L 80 8 L 100 5 L 100 20 L 0 20 Z" fill="url(#grad-green)" opacity="0.08" />
                        <defs>
                          <linearGradient id="grad-green" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="var(--verified)" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="var(--verified)" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-text-tertiary">
                      <span>₹48,200/MT (Base)</span>
                      <span className="text-verified font-medium">Carbon Premium: Nil</span>
                    </div>
                  </div>

                  {/* Polymers */}
                  <div className="border border-border-subtle/50 bg-background/40 hover:bg-background/80 rounded-2xl p-4 flex flex-col gap-3 transition-colors duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-text-primary uppercase">Recycled HDPE Pellets</span>
                      <span className="text-[10px] font-mono bg-verified-light text-verified px-2 py-0.5 rounded-full">+5.2% Premium</span>
                    </div>
                    <div className="h-10 relative w-full flex items-end">
                      <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                        <path d="M 0 15 L 20 14 L 40 12 L 60 8 L 80 6 L 100 4" fill="none" stroke="var(--verified)" strokeWidth="1.5" />
                        <path d="M 0 15 L 20 14 L 40 12 L 60 8 L 80 6 L 100 4 L 100 20 L 0 20 Z" fill="url(#grad-green)" opacity="0.08" />
                      </svg>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-text-tertiary">
                      <span>₹72,500/MT</span>
                      <span className="font-semibold text-verified">Premium: +₹4,500/MT</span>
                    </div>
                  </div>

                  {/* Organic Cotton */}
                  <div className="border border-border-subtle/50 bg-background/40 hover:bg-background/80 rounded-2xl p-4 flex flex-col gap-3 transition-colors duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-text-primary uppercase">Cotton Fibres Combed</span>
                      <span className="text-[10px] font-mono bg-surface text-text-secondary px-2 py-0.5 rounded-full">+1.8% Market</span>
                    </div>
                    <div className="h-10 relative w-full flex items-end">
                      <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                        <path d="M 0 12 L 20 14 L 40 11 L 60 10 L 80 7 L 100 3" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" />
                      </svg>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-text-tertiary">
                      <span>₹740/kg</span>
                      <span className="font-semibold text-verified">Premium: +₹80/kg</span>
                    </div>
                  </div>

                  {/* Aluminum */}
                  <div className="border border-border-subtle/50 bg-background/40 hover:bg-background/80 rounded-2xl p-4 flex flex-col gap-3 transition-colors duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-text-primary uppercase">Virgin AL-99 Ingots</span>
                      <span className="text-[10px] font-mono bg-[#b38864]/10 text-[#b38864] px-2 py-0.5 rounded-full">High Intensity</span>
                    </div>
                    <div className="h-10 relative w-full flex items-end">
                      <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                        <path d="M 0 5 L 20 6 L 40 5 L 60 7 L 80 8 L 100 9" fill="none" stroke="#b38864" strokeWidth="1.5" />
                        <path d="M 0 5 L 20 6 L 40 5 L 60 7 L 80 8 L 100 9 L 100 20 L 0 20 Z" fill="url(#grad-amber)" opacity="0.08" />
                        <defs>
                          <linearGradient id="grad-amber" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#b38864" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#b38864" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-text-tertiary">
                      <span>₹2,10,000/MT</span>
                      <span className="text-[#b38864] font-bold">CO2 Intensity: 8.4</span>
                    </div>
                  </div>
                </div>
              </DoubleBezelCard>
            </div>

            {/* Bottom Row: Supply Trace flow & Sandbox REST Gateway Control Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Materials Flow Map */}
              <DoubleBezelCard className="lg:col-span-2">
                <div>
                  <span className="text-[9px] font-mono font-semibold px-2 py-0.5 bg-verified-light text-verified rounded-full uppercase tracking-wider">Trace Ledger Map</span>
                  <h3 className="text-base font-bold tracking-tight text-text-primary mt-2 font-sans">Upstream Custody & Logistics Channels</h3>
                  <p className="text-xs text-text-tertiary mt-1 font-sans">Active custody paths tracing physical carbon footprint allocations in transit.</p>
                </div>

                <div className="flex flex-col gap-3 mt-6">
                  {/* Channel 1 */}
                  <div className="flex items-center justify-between border border-border-subtle bg-background/50 hover:bg-background rounded-xl p-4 text-xs font-mono transition-colors duration-500">
                    <div className="flex items-center gap-3">
                      <div className="font-bold text-verified uppercase tracking-wider">Tata Steel</div>
                      <ArrowRight className="size-3 text-text-tertiary" strokeWidth={1.5} />
                      <div className="font-bold text-text-primary uppercase tracking-wider">{currentOrg.name}</div>
                      <ArrowRight className="size-3 text-text-tertiary" strokeWidth={1.5} />
                      <div className="font-bold text-text-secondary uppercase tracking-wider">Metro Logistics</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-verified animate-ping" />
                      <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wide">In Transit &bull; Locked</span>
                    </div>
                  </div>

                  {/* Channel 2 */}
                  <div className="flex items-center justify-between border border-border-subtle bg-background/50 hover:bg-background rounded-xl p-4 text-xs font-mono transition-colors duration-500">
                    <div className="flex items-center gap-3">
                      <div className="font-bold text-text-secondary uppercase tracking-wider">Greenfield Polymers</div>
                      <ArrowRight className="size-3 text-text-tertiary" strokeWidth={1.5} />
                      <div className="font-bold text-text-primary uppercase tracking-wider">{currentOrg.name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-[#b38864] animate-pulse" />
                      <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wide">Negotiating</span>
                    </div>
                  </div>
                </div>

                {/* Legend explanation */}
                <p className="text-[11px] text-text-tertiary leading-relaxed mt-6 border-t border-border-subtle/30 pt-4 font-sans">
                  Custody ledger maps trace upstream carbon equivalents. Once contracts sign, physical provenance snapshots freeze to prevent subsequent audit modifications.
                </p>
              </DoubleBezelCard>

              {/* Developer Sandbox Portal & REST status widget */}
              <DoubleBezelCard className="lg:col-span-1">
                <div>
                  <span className="text-[9px] font-mono font-semibold px-2 py-0.5 bg-cta-bg text-cta-text rounded-full uppercase tracking-wider">Dev Gateway</span>
                  <h3 className="text-base font-bold tracking-tight text-text-primary mt-2 font-sans">REST Core Ledger State</h3>
                  <p className="text-xs text-text-tertiary mt-1 font-sans">Configure local simulations or force-execute API query sweeps.</p>
                </div>

                {/* Connection Status Card */}
                <div className="rounded-2xl border border-border-subtle bg-background/40 p-4 flex flex-col gap-3 mt-6">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-text-secondary uppercase tracking-wider">Ledger Endpoint</span>
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${restStatus === "connected" ? "bg-verified animate-pulse" : "bg-[#b38864]"}`} />
                      <span className={`font-bold tracking-wider ${restStatus === "connected" ? "text-verified" : "text-[#b38864]"}`}>
                        {restStatus === "connected" ? "CONNECTED (LIVE)" : "OFFLINE (MOCK)"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-[10px] font-mono text-text-tertiary break-all border-t border-border-subtle/30 pt-2">
                    http://localhost:8000/api/v1
                  </div>
                </div>

                {/* Reset & Sync buttons */}
                <div className="flex flex-col gap-3 mt-6">
                  <button
                    onClick={handleSyncREST}
                    className="group w-full pl-6 pr-2 py-2.5 bg-cta-bg hover:bg-text-secondary text-cta-text font-semibold text-xs rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] flex items-center justify-between gap-1.5 active:scale-[0.98] cursor-pointer"
                  >
                    <span className="tracking-wide">Sync Marketplace REST API</span>
                    <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105 group-hover:rotate-180">
                      <RefreshCw className="size-3.5" strokeWidth={1.2} />
                    </span>
                  </button>

                  <button
                    onClick={handleResetSandbox}
                    className="group w-full pl-6 pr-2 py-2.5 border border-border-subtle bg-surface/50 hover:bg-surface text-text-primary font-semibold text-xs rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] flex items-center justify-between gap-1.5 active:scale-[0.98] cursor-pointer"
                  >
                    <span className="tracking-wide text-text-secondary group-hover:text-text-primary">Reset Simulation State</span>
                    <span className="w-8 h-8 rounded-full bg-text-primary/5 flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-95">
                      <RotateCcw className="size-3.5 text-text-secondary" strokeWidth={1.2} />
                    </span>
                  </button>
                </div>
              </DoubleBezelCard>
            </div>
          </div>
        )}

        {/* Workspace Tab View */}
        {activeTab === "workspace" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left: Active Negotiations / Contracts Stack */}
            <div className="lg:col-span-1 border border-border-subtle rounded-lg bg-surface-elevated overflow-hidden shadow-xs">
              <div className="border-b border-border-subtle px-4 py-3 flex items-center justify-between bg-surface/30">
                <h3 className="font-sans font-semibold text-sm text-text-primary">Structured Negotiations</h3>
                <span className="font-mono text-xs text-text-tertiary">{negotiations.length} active</span>
              </div>
              <div className="divide-y divide-border-subtle max-h-[500px] overflow-y-auto">
                {negotiations.map((neg) => (
                  <button
                    key={neg.id}
                    onClick={() => setActiveNegotiationId(neg.id)}
                    className={`w-full text-left p-4 transition-colors flex flex-col gap-2 hover:bg-surface/30 ${
                      activeNegotiationId === neg.id ? "bg-surface/50 border-l-2 border-accent" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-text-tertiary">{neg.id}</span>
                      <span
                        className={`font-mono text-[10px] px-2 py-0.5 rounded-full capitalize ${
                          neg.status === "In Review" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {neg.status}
                      </span>
                    </div>
                    <p className="font-sans font-semibold text-sm text-text-primary line-clamp-1">{neg.listing}</p>
                    <div className="flex items-center justify-between text-xs text-text-secondary mt-1">
                      <span>{neg.partner}</span>
                      <span className="font-mono font-medium text-text-primary">{neg.price}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-text-tertiary">
                      <span>CO2e: {neg.carbon}</span>
                      <span className={`inline-flex items-center gap-1 ${neg.provenance === "Verified" ? "text-verified font-medium" : "text-audited"}`}>
                        {neg.provenance}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Selected Negotiation Workspace */}
            <div className="lg:col-span-2 border border-border-subtle rounded-lg bg-surface-elevated shadow-xs overflow-hidden flex flex-col min-h-[500px]">
              
              {/* Workspace Header */}
              <div className="border-b border-border-subtle p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface/20">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-text-tertiary">{activeNeg.id}</span>
                    <span className="text-text-tertiary font-mono">&bull;</span>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-accent">{activeNeg.type === "buy" ? "Outgoing Procurement" : "Incoming Sale"}</span>
                  </div>
                  <h2 className="text-base font-bold text-text-primary mt-1">{activeNeg.listing}</h2>
                  <p className="text-xs text-text-secondary">Trading Partner: <span className="font-semibold">{activeNeg.partner}</span></p>
                </div>
                
                <div className="flex items-center gap-2 align-middle">
                  <button
                    onClick={() => handleReviewTrace(activeNeg)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-border-subtle transition-colors"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-verified" />
                    Review Trace
                  </button>
                  <button 
                    onClick={() => alert("Contract locked. State finalized.")}
                    className="inline-flex items-center rounded-md bg-cta-bg text-cta-text px-4 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    Lock Terms
                  </button>
                </div>
              </div>

              {/* Chat / Offer Timeline */}
              <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[300px]">
                <div className="flex items-center justify-center py-2">
                  <span className="font-mono text-[10px] text-text-tertiary border border-border-subtle bg-surface px-2.5 py-0.5 rounded-full uppercase">
                    Audit Trail Opened &bull; Decrypted Session
                  </span>
                </div>

                {activeNeg.history.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.sender === "You" ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary font-mono">
                      <span>{msg.sender}</span>
                      <span>&bull;</span>
                      <span>{msg.time}</span>
                    </div>
                    <div className={`mt-1.5 max-w-md rounded-lg px-4 py-2.5 text-sm ${
                      msg.sender === "You" ? "bg-accent text-white" : "border border-border bg-surface text-text-primary"
                    }`}>
                      <p>{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input / Action Controls */}
              <div className="border-t border-border-subtle p-4 bg-surface/10 flex flex-col gap-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Provide comments, requests, or adjust pricing bid..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendMessage();
                    }}
                    className="flex-1 px-4 py-2.5 border border-border bg-surface-elevated rounded-md text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-cta-bg hover:opacity-90 text-cta-text rounded-md px-5 py-2.5 text-sm font-semibold transition-opacity"
                  >
                    Post Message
                  </button>
                </div>
                <div className="flex justify-between items-center text-xs font-mono text-text-tertiary">
                  <span>Carbon intensity factor (Lifecycle): <strong className="text-text-primary">{activeNeg.carbon}</strong></span>
                  <span>Minimum acceptable grade: <strong className="text-verified">{activeNeg.provenance}</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Marketplace Tab View */}
        {activeTab === "marketplace" && (
          <div className="flex flex-col gap-6">
            
            {/* Header + Search Tools */}
            <div className="border border-border-subtle rounded-lg bg-surface-elevated p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search size={16} className="absolute left-3.5 top-3.5 text-text-tertiary" />
                  <input
                    type="text"
                    placeholder="Search material listings (e.g. CR4 Steel)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-border bg-background rounded-md text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter size={14} className="text-text-tertiary" />
                  <span className="font-mono text-xs text-text-secondary uppercase">Provenance filter:</span>
                  <select
                    value={gradeFilter}
                    onChange={(e) => setGradeFilter(e.target.value)}
                    className="bg-surface border border-border rounded px-2.5 py-1 text-xs text-text-primary focus:outline-none"
                  >
                    <option value="all">All Grades</option>
                    <option value="Verified">Verified Only</option>
                    <option value="Audited">Audited & Verified</option>
                    <option value="Self-Reported">Self-Reported Only</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeRole === "supplier" || activeRole === "manufacturer" ? (
                  <button
                    onClick={handleCreateListing}
                    className="inline-flex items-center gap-1.5 rounded-md bg-accent text-white px-4 py-2 text-xs font-semibold hover:bg-accent-hover transition-colors"
                  >
                    <Plus size={14} />
                    New Listing
                  </button>
                ) : null}
              </div>
            </div>

            {/* Product Listing Catalog */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings
                .filter((item) => {
                  const queryMatches = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.supplier.toLowerCase().includes(searchQuery.toLowerCase());
                  if (gradeFilter === "Verified") return queryMatches && item.provenance === "Verified";
                  if (gradeFilter === "Audited") return queryMatches && (item.provenance === "Audited" || item.provenance === "Verified");
                  if (gradeFilter === "Self-Reported") return queryMatches && item.provenance === "Self-Reported";
                  return queryMatches;
                })
                .map((item) => {
                  return (
                    <div
                      key={item.id}
                      className="border border-border-subtle rounded-lg bg-surface-elevated p-5 flex flex-col justify-between shadow-xs hover:border-border transition-colors group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-mono text-[10px] text-text-tertiary">{item.id}</span>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-medium border ${
                              item.provenance === "Verified"
                                ? "bg-verified-light text-verified border-verified/20"
                                : item.provenance === "Audited"
                                ? "bg-audited-light text-audited border-audited/20"
                                : "bg-self-reported-light text-self-reported border-self-reported/20"
                            }`}
                          >
                            {item.provenance === "Verified" && <ShieldCheck className="h-3 w-3" />}
                            {item.provenance}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-text-primary mt-3 group-hover:text-accent transition-colors">
                          {item.title}
                        </h4>
                        <p className="font-mono text-xs text-text-tertiary mt-1">Supplier: {item.supplier}</p>
                      </div>

                      <div className="mt-6 border-t border-border-subtle pt-4">
                        <div className="flex items-center justify-between font-mono text-xs text-text-secondary">
                          <span>Carbon Emission:</span>
                          <span className="font-medium text-text-primary">{item.co2}</span>
                        </div>
                        <div className="flex items-center justify-between font-mono text-xs text-text-secondary mt-1">
                          <span>Volume Available:</span>
                          <span className="font-medium text-text-primary">{item.qty}</span>
                        </div>
                        <div className="flex items-center justify-between font-mono text-sm mt-3 pt-3 border-t border-dashed border-border-subtle">
                          <span className="text-text-secondary font-medium">Standard Price:</span>
                          <span className="font-bold text-text-primary text-base">{item.price}</span>
                        </div>
                        
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => {
                              const proceed = confirm(`Initiate formal negotiation on ${item.title}?`);
                              if (proceed) {
                                const newId = `NEG-${Math.floor(4000 + Math.random() * 100)}`;
                                const newNeg = {
                                  id: newId,
                                  listing: item.title,
                                  partner: item.supplier,
                                  type: "buy",
                                  price: item.price,
                                  quantity: item.qty,
                                  status: "In Review",
                                  provenance: item.provenance,
                                  carbon: item.co2,
                                  history: [
                                    { sender: "You", text: `Opened negotiation for ${item.title}. Minimum acceptable provenance grade matched.`, time: "Just Now" }
                                  ]
                                };
                                setNegotiations([newNeg, ...negotiations]);
                                setActiveNegotiationId(newId);
                                setActiveTab("workspace");
                              }
                            }}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded bg-cta-bg hover:opacity-90 text-cta-text py-2 text-xs font-semibold transition-opacity"
                          >
                            <Briefcase size={12} />
                            Negotiate
                          </button>
                          <button
                            onClick={() => handleReviewTrace(item)}
                            className="inline-flex items-center justify-center rounded border border-border bg-surface px-2.5 py-2 hover:bg-border-subtle transition-colors"
                            title="Inspect provenance documents"
                          >
                            <ShieldCheck className="h-4 w-4 text-verified" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Auditor & Admin Dashboard View */}
        {activeTab === "adminPanel" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left/Middle: Verification Document Queue */}
            <div className="lg:col-span-2 space-y-6">
              <div className="border border-border-subtle rounded-lg bg-surface-elevated shadow-xs overflow-hidden">
                <div className="border-b border-border-subtle p-5 bg-surface/20">
                  <h3 className="font-bold text-base text-text-primary">
                    {activeRole === "auditor" ? "Audit Inspection Workspace" : "Organization Verification Queue"}
                  </h3>
                  <p className="text-xs text-text-secondary mt-1">Review onboarding documents, labor certificates, and emissions certifications.</p>
                </div>
                
                <div className="divide-y divide-border-subtle">
                  <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-text-tertiary">ORG-8921</span>
                        <span className="text-text-tertiary">&bull;</span>
                        <span className="font-mono text-xs text-amber-800 bg-amber-100 px-2 py-0.5 rounded">Audit Requested</span>
                      </div>
                      <h4 className="font-semibold text-sm text-text-primary mt-2">Greenfield Chemical Refinery</h4>
                      <p className="text-xs text-text-secondary mt-1">Requesting third-party verification for *Polypropylene Polymerization lifecycle* records.</p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="font-mono text-[10px] text-text-tertiary border border-border bg-surface px-2 py-1 rounded inline-flex items-center gap-1">
                          <FileText size={10} /> ISO_14001.pdf
                        </span>
                        <span className="font-mono text-[10px] text-text-tertiary border border-border bg-surface px-2 py-1 rounded inline-flex items-center gap-1">
                          <FileText size={10} /> Emissions_Lifecycle_Report.xlsx
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => alert("Audit document Approved. Status elevated to Third-Party Verified.")}
                        className="bg-accent text-white px-3.5 py-1.5 rounded text-xs font-semibold hover:bg-accent-hover transition-colors"
                      >
                        Approve Badge
                      </button>
                      <button
                        onClick={() => alert("Clarification request sent.")}
                        className="border border-border bg-surface text-text-primary px-3.5 py-1.5 rounded text-xs font-medium hover:bg-border-subtle transition-colors"
                      >
                        Ask Details
                      </button>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-text-tertiary">ORG-7402</span>
                        <span className="text-text-tertiary">&bull;</span>
                        <span className="font-mono text-xs text-blue-800 bg-blue-100 px-2 py-0.5 rounded">KYC Review</span>
                      </div>
                      <h4 className="font-semibold text-sm text-text-primary mt-2">Swift Transports (All-India Permit)</h4>
                      <p className="text-xs text-text-secondary mt-1">Submitted tax documentation and operational licenses for onboard logistics verification.</p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="font-mono text-[10px] text-text-tertiary border border-border bg-surface px-2 py-1 rounded inline-flex items-center gap-1">
                          <FileText size={10} /> Tax_Registration_2026.pdf
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => alert("Approved and verified.")}
                        className="bg-accent text-white px-3.5 py-1.5 rounded text-xs font-semibold hover:bg-accent-hover transition-colors"
                      >
                        Approve Organization
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Admin Platform Stats & Activity Logs */}
            <div className="lg:col-span-1 space-y-6">
              <div className="border border-border-subtle rounded-lg bg-surface-elevated p-5 shadow-xs">
                <h3 className="font-semibold text-sm text-text-primary border-b border-border-subtle pb-3">Operational Registry</h3>
                <div className="mt-4 space-y-4 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Active Nodes:</span>
                    <span className="text-text-primary font-medium">854 Organizations</span>
                  </div>
                  <div className="flex justify-between border-t border-border-subtle pt-2.5">
                    <span className="text-text-tertiary">Pending Audits:</span>
                    <span className="text-text-primary font-medium">18 requests</span>
                  </div>
                  <div className="flex justify-between border-t border-border-subtle pt-2.5">
                    <span className="text-text-tertiary">Trust Verified:</span>
                    <span className="text-verified font-medium">34% of listings</span>
                  </div>
                  <div className="flex justify-between border-t border-border-subtle pt-2.5">
                    <span className="text-text-tertiary">System Integrity:</span>
                    <span className="text-verified font-medium">99.8% Operations</span>
                  </div>
                </div>
              </div>

              <div className="border border-border-subtle rounded-lg bg-surface-elevated p-5 shadow-xs">
                <h3 className="font-semibold text-sm text-text-primary border-b border-border-subtle pb-3">Disputes Board</h3>
                <div className="mt-4 text-center py-6">
                  <CheckCircle2 size={32} className="mx-auto text-verified" />
                  <p className="text-xs text-text-secondary mt-3 font-medium">No open system level disputes.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vault Tab View */}
        {activeTab === "vault" && (
          <div className="border border-border-subtle rounded-lg bg-surface-elevated overflow-hidden shadow-xs">
            <div className="border-b border-border-subtle p-5 bg-surface/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-text-primary">Independent Document & Certificate Vault</h3>
                <p className="text-xs text-text-secondary mt-1">Review, append, and access legal certifications and audits mapped to this facility.</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => alert("Upload document triggered. Choose a digital copy.")}
                  className="inline-flex items-center gap-1.5 rounded-md bg-accent text-white px-4 py-2 text-xs font-semibold hover:bg-accent-hover transition-colors"
                >
                  <Upload size={14} />
                  Upload Certificate
                </button>
              </div>
            </div>

            <div className="divide-y divide-border-subtle">
              <div className="p-4 flex items-center justify-between hover:bg-surface/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 border border-border-subtle bg-surface rounded">
                    <ShieldCheck className="h-5 w-5 text-verified" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">ISO 14001:2015 Certification</h4>
                    <p className="text-xs text-text-tertiary">Verified by Bureau Veritas &bull; Valid until Dec 2027</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1.5 hover:bg-surface border border-transparent hover:border-border rounded transition-colors text-text-secondary">
                    <Download size={15} />
                  </button>
                  <button className="p-1.5 hover:bg-surface border border-transparent hover:border-border rounded transition-colors text-text-secondary">
                    <ExternalLink size={15} />
                  </button>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between hover:bg-surface/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 border border-border-subtle bg-surface rounded">
                    <ClipboardCheck className="h-5 w-5 text-audited" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">BRSR (Business Responsibility & Sustainability Report) Scope</h4>
                    <p className="text-xs text-text-tertiary">Self-Declared with audit checks &bull; FY 2025-26</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1.5 hover:bg-surface border border-transparent hover:border-border rounded transition-colors text-text-secondary">
                    <Download size={15} />
                  </button>
                  <button className="p-1.5 hover:bg-surface border border-transparent hover:border-border rounded transition-colors text-text-secondary">
                    <ExternalLink size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-6 bg-surface/30">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-text-tertiary">
          <span>&copy; {new Date().getFullYear()} BizzNet Platform Core.</span>
          <span>Security Protocol: TLS 1.3 &bull; Append-Only Ledgers</span>
        </div>
      </footer>

      {/* Trace Audit Trail Modal */}
      {isTraceModalOpen && selectedListingTrace && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-surface-elevated max-w-lg w-full rounded-lg border border-border shadow-lg overflow-hidden">
            <div className="border-b border-border-subtle px-5 py-4 flex items-center justify-between bg-surface/50">
              <h3 className="font-bold text-sm text-text-primary flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-verified" />
                Material Provenance Audit Trace
              </h3>
              <button
                onClick={() => setIsTraceModalOpen(false)}
                className="text-text-tertiary hover:text-text-primary text-xs font-mono"
              >
                [ESC] CLOSE
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <span className="font-mono text-[10px] text-text-tertiary">TRACE TARGET</span>
                <h4 className="font-bold text-base text-text-primary mt-1">{selectedListingTrace.listing || selectedListingTrace.title}</h4>
                <p className="text-xs text-text-secondary mt-1">Listed under Category: <strong className="text-text-primary">{(selectedListingTrace.category || "General").toUpperCase()}</strong></p>
              </div>

              <div className="border-t border-border-subtle pt-4 space-y-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-6 w-6 rounded-full bg-verified-light border border-verified flex items-center justify-center text-[10px] font-bold text-verified">
                      3
                    </div>
                    <div className="w-px flex-1 bg-border-subtle" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-text-primary">Final Stage: Product Assembly</h5>
                    <p className="text-xs text-text-secondary mt-0.5">Tata Chennai Assembly Hub &bull; Audited Carbon Quotient: {selectedListingTrace.co2 || selectedListingTrace.carbon}</p>
                    <span className="inline-block mt-1 font-mono text-[10px] bg-verified-light text-verified px-2 py-0.5 rounded">Verification Pass</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-6 w-6 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-[10px] font-bold text-text-tertiary">
                      2
                    </div>
                    <div className="w-px flex-1 bg-border-subtle" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-text-primary">Middle Stage: Sheet Processing</h5>
                    <p className="text-xs text-text-secondary mt-0.5">Gujarat Milling Station &bull; Facility ISO 14001 Audited</p>
                    <span className="inline-block mt-1 font-mono text-[10px] bg-audited-light text-audited px-2 py-0.5 rounded font-medium border border-audited/20">Audit Complete</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-6 w-6 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-[10px] font-bold text-text-tertiary">
                      1
                    </div>
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-text-primary">Source Generation: Raw Extraction</h5>
                    <p className="text-xs text-text-secondary mt-0.5">Singhbhum Iron Ore District &bull; Self-Reported Labor Wages Baseline</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border-subtle px-5 py-3.5 bg-surface/30 flex justify-end">
              <button
                onClick={() => setIsTraceModalOpen(false)}
                className="bg-cta-bg hover:opacity-90 text-cta-text rounded px-4 py-2 text-xs font-semibold transition-opacity"
              >
                Close Audit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
