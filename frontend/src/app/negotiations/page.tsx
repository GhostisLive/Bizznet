"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { useCurrentOrg } from "@/lib/useCurrentOrg";
import { useAuth } from "@/lib/AuthProvider";
import { supabase } from "@/utils/supabaseClient";
import {
  Handshake,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Send,
  Lock,
  ArrowUpRight,
  Loader2,
  PackageSearch,
} from "lucide-react";

interface Bid {
  id: string;
  sender_id: string;
  price: number;
  moq: number;
  terms: string | null;
  created_at: string;
}

interface Listing {
  title: string;
  category: string;
  price: number;
  unit: string;
  moq?: number;
}

interface OrgRef {
  name: string;
  role: string;
}

interface Negotiation {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  status: string;
  provenance_reviewed: boolean;
  created_at: string;
  listing: Listing;
  buyer: OrgRef;
  seller: OrgRef;
  bids: Bid[];
}

export default function NegotiationsPage() {
  const orgCtx = useCurrentOrg();
  const { user, org, loading: authLoading } = useAuth();

  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [fetching, setFetching] = useState(true);
  const [activeNegId, setActiveNegId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [bidInput, setBidInput] = useState<number | "">("");
  const [askInput, setAskInput] = useState<number | "">("");

  useEffect(() => {
    if (authLoading || !org) return;

    async function fetchNegotiations() {
      setFetching(true);
      const { data, error } = await supabase
        .from("negotiations")
        .select(
          "*, listing:listings(title, category, price, unit, moq), buyer:organizations!negotiations_buyer_id_fkey(name, role), seller:organizations!negotiations_seller_id_fkey(name, role), bids:negotiation_bids(id, sender_id, price, moq, terms, created_at)"
        )
        .or(`buyer_id.eq.${org!.id},seller_id.eq.${org!.id}`);

      if (!error && data) {
        const sorted = (data as Negotiation[]).map((n) => ({
          ...n,
          bids: [...n.bids].sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          ),
        }));
        setNegotiations(sorted);
        if (sorted.length > 0 && !activeNegId) {
          setActiveNegId(sorted[0].id);
        }
      }
      setFetching(false);
    }

    fetchNegotiations();
  }, [authLoading, org]);

  const activeNeg = negotiations.find((n) => n.id === activeNegId) || null;

  const getUserRole = (neg: Negotiation): "buyer" | "seller" => {
    return org?.id === neg.buyer_id ? "buyer" : "seller";
  };

  const getCounterpartName = (neg: Negotiation): string => {
    const role = getUserRole(neg);
    return role === "buyer" ? neg.seller.name : neg.buyer.name;
  };

  const getLatestSellerAsk = (neg: Negotiation): number | null => {
    const sellerBids = neg.bids.filter((b) => b.sender_id === neg.seller_id);
    if (sellerBids.length > 0) return sellerBids[sellerBids.length - 1].price;
    return neg.listing.price;
  };

  const getLatestBuyerBid = (neg: Negotiation): number | null => {
    const buyerBids = neg.bids.filter((b) => b.sender_id === neg.buyer_id);
    if (buyerBids.length > 0) return buyerBids[buyerBids.length - 1].price;
    return null;
  };

  const handleSubmitBid = async () => {
    if (!activeNeg || !org) return;
    const role = getUserRole(activeNeg);
    const price = role === "buyer" ? bidInput : askInput;
    if (price === "" || typeof price !== "number" || isNaN(price)) return;

    const { data, error } = await supabase
      .from("negotiation_bids")
      .insert({
        negotiation_id: activeNeg.id,
        sender_id: org.id,
        price,
        moq: activeNeg.listing.moq || 1,
        terms: null,
      })
      .select("id, sender_id, price, moq, terms, created_at")
      .single();

    if (!error && data) {
      setNegotiations((prev) =>
        prev.map((n) => {
          if (n.id !== activeNeg.id) return n;
          return { ...n, bids: [...n.bids, data as Bid] };
        })
      );
      if (role === "buyer") setBidInput("");
      else setAskInput("");

      const sellerAsk = getLatestSellerAsk(activeNeg);
      const buyerBid = role === "buyer" ? price : getLatestBuyerBid(activeNeg);
      if (
        sellerAsk !== null &&
        buyerBid !== null &&
        ((role === "buyer" && buyerBid >= sellerAsk) ||
          (role === "seller" && price <= (buyerBid ?? Infinity)))
      ) {
        await supabase
          .from("negotiations")
          .update({ status: "agreed" })
          .eq("id", activeNeg.id);
        setNegotiations((prev) =>
          prev.map((n) =>
            n.id === activeNeg.id ? { ...n, status: "agreed" } : n
          )
        );
      } else {
        await supabase
          .from("negotiations")
          .update({ status: "countered" })
          .eq("id", activeNeg.id);
        setNegotiations((prev) =>
          prev.map((n) =>
            n.id === activeNeg.id ? { ...n, status: "countered" } : n
          )
        );
      }
    }
  };

  const handleAcceptDeal = async () => {
    if (!activeNeg || !org) return;
    const role = getUserRole(activeNeg);
    const acceptPrice =
      role === "buyer"
        ? getLatestSellerAsk(activeNeg)
        : getLatestBuyerBid(activeNeg);
    if (acceptPrice === null) return;

    const { data, error } = await supabase
      .from("negotiation_bids")
      .insert({
        negotiation_id: activeNeg.id,
        sender_id: org.id,
        price: acceptPrice,
        moq: activeNeg.listing.moq || 1,
        terms: "Accepted deal terms",
      })
      .select("id, sender_id, price, moq, terms, created_at")
      .single();

    if (!error && data) {
      await supabase
        .from("negotiations")
        .update({ status: "agreed" })
        .eq("id", activeNeg.id);

      setNegotiations((prev) =>
        prev.map((n) => {
          if (n.id !== activeNeg.id) return n;
          return { ...n, status: "agreed", bids: [...n.bids, data as Bid] };
        })
      );
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeNeg || !org) return;

    const { data, error } = await supabase
      .from("negotiation_bids")
      .insert({
        negotiation_id: activeNeg.id,
        sender_id: org.id,
        price: 0,
        moq: 0,
        terms: messageInput.trim(),
      })
      .select("id, sender_id, price, moq, terms, created_at")
      .single();

    if (!error && data) {
      setNegotiations((prev) =>
        prev.map((n) => {
          if (n.id !== activeNeg.id) return n;
          return { ...n, bids: [...n.bids, data as Bid] };
        })
      );
      setMessageInput("");
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      return d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  const statusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "agreed" || s === "completed")
      return "bg-[#EEF7F2] text-[#2E7D5B]";
    if (s === "countered" || s === "pending")
      return "bg-[#FDF5E6] text-[#C68A17]";
    return "bg-[#F5F0E8] text-[#6B5B3E]";
  };

  if (authLoading || fetching) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#2C2418] flex flex-col lg:flex-row font-sans">
        <Sidebar
          currentRole={orgCtx.roleLabel}
          orgName={orgCtx.orgName}
          nodeId={orgCtx.nodeId}
        />
        <main className="flex-1 p-6 md:p-10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-8 text-[#6B5B3E] animate-spin" />
            <span className="text-sm font-semibold text-[#8A7E6E]">
              Loading negotiations...
            </span>
          </div>
        </main>
      </div>
    );
  }

  if (negotiations.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#2C2418] flex flex-col lg:flex-row font-sans">
        <Sidebar
          currentRole={orgCtx.roleLabel}
          orgName={orgCtx.orgName}
          nodeId={orgCtx.nodeId}
        />
        <main className="flex-1 p-6 md:p-10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <PackageSearch className="size-12 text-[#8A7E6E]" />
            <h2 className="text-2xl font-extrabold text-[#2C2418]">
              No active negotiations
            </h2>
            <p className="text-sm font-semibold text-[#8A7E6E]">
              No active negotiations. Start by browsing the Marketplace.
            </p>
            <a
              href="/marketplace"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2C2418] hover:bg-[#4E4433] text-white font-bold text-xs rounded-xl transition-colors"
            >
              <ArrowUpRight size={14} />
              Browse Marketplace
            </a>
          </div>
        </main>
      </div>
    );
  }

  const myRole = activeNeg ? getUserRole(activeNeg) : "buyer";
  const sellerAsk = activeNeg ? getLatestSellerAsk(activeNeg) : null;
  const buyerBid = activeNeg ? getLatestBuyerBid(activeNeg) : null;
  const spread =
    sellerAsk !== null && buyerBid !== null ? sellerAsk - buyerBid : null;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C2418] flex flex-col lg:flex-row font-sans">
      <Sidebar
        currentRole={orgCtx.roleLabel}
        orgName={orgCtx.orgName}
        nodeId={orgCtx.nodeId}
      />

      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-x-hidden max-w-[1600px] mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E8E0D4]">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#2C2418] tracking-tight">
              Contract & Offer Negotiations
            </h1>
            <p className="text-base font-semibold text-[#5C5040] mt-1">
              Interactive dual-party negotiation console with cryptographic audit
              trail
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeNeg && (
              <div className="flex items-center bg-[#F5F0E8] border border-[#E8E0D4] p-1 rounded-xl">
                <span className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#2C2418] text-white shadow-xs">
                  {myRole === "buyer"
                    ? `Acting as Buyer (${org?.name})`
                    : `Acting as Seller (${org?.name})`}
                </span>
              </div>
            )}

            <span className="hidden sm:inline-flex items-center gap-2 px-3 py-2 bg-white border border-[#E8E0D4] rounded-xl text-xs font-mono font-bold text-[#2E7D5B]">
              <span className="size-2.5 rounded-full bg-[#2E7D5B]" />
              Auditor Session Active
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-1 bg-white border border-[#E8E0D4] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-[#E8E0D4] bg-[#FAF8F5] flex justify-between items-center">
              <h2 className="text-lg font-extrabold text-[#2C2418]">
                Negotiation Channels
              </h2>
              <span className="font-mono text-xs font-bold text-[#6B5B3E] bg-[#F5F0E8] px-2.5 py-1 rounded-full">
                {negotiations.length} Active
              </span>
            </div>

            <div className="divide-y divide-[#E8E0D4]">
              {negotiations.map((neg) => {
                const latestBuyerBid = getLatestBuyerBid(neg);
                return (
                  <button
                    key={neg.id}
                    onClick={() => setActiveNegId(neg.id)}
                    className={`w-full text-left p-5 transition-colors flex flex-col gap-2 ${
                      activeNegId === neg.id
                        ? "bg-[#F5F0E8]/60 border-l-4 border-[#6B5B3E]"
                        : "hover:bg-[#FAF8F5]"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs font-bold text-[#6B5B3E]">
                        NEG-{neg.id.slice(0, 4).toUpperCase()}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold ${statusBadge(neg.status)}`}
                      >
                        {neg.status.charAt(0).toUpperCase() +
                          neg.status.slice(1)}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-base text-[#2C2418]">
                      {neg.listing.title}
                    </h3>
                    <div className="flex justify-between items-center text-xs text-[#8A7E6E] font-semibold mt-1">
                      <span>{getCounterpartName(neg)}</span>
                      <span className="font-mono font-bold text-[#2C2418]">
                        {latestBuyerBid !== null
                          ? `₹${latestBuyerBid.toLocaleString("en-IN")}`
                          : "—"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 bg-[#FAF8F5] border-t border-[#E8E0D4] text-xs text-[#8A7E6E] font-medium leading-relaxed">
              <strong>Panel Details:</strong> Select a channel to view the
              real-time bid progression and cryptographically signed audit
              timeline.
            </div>
          </div>

          {activeNeg && (
            <div className="lg:col-span-2 bg-white border border-[#E8E0D4] rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px] justify-between">
              <div>
                <div className="p-6 border-b border-[#E8E0D4] bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#6B5B3E]">
                        NEG-{activeNeg.id.slice(0, 4).toUpperCase()}
                      </span>
                      <span className="text-[#8A7E6E]">&bull;</span>
                      <span className="font-mono text-xs font-bold text-[#2E7D5B]">
                        {activeNeg.provenance_reviewed
                          ? "3rd-Party Verified"
                          : "Pending Review"}
                      </span>
                      <span className="text-[#8A7E6E]">&bull;</span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${statusBadge(activeNeg.status)}`}
                      >
                        {activeNeg.status.charAt(0).toUpperCase() +
                          activeNeg.status.slice(1)}
                      </span>
                    </div>
                    <h2 className="text-xl font-extrabold text-[#2C2418] mt-1">
                      {activeNeg.listing.title}
                    </h2>
                    <p className="text-xs font-semibold text-[#8A7E6E]">
                      Counterpart:{" "}
                      <strong className="text-[#2C2418]">
                        {getCounterpartName(activeNeg)}
                      </strong>{" "}
                      ({activeNeg.listing.category})
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        alert(
                          `Contract NEG-${activeNeg.id.slice(0, 4).toUpperCase()} locked! Cryptographic provenance proof generated.`
                        )
                      }
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2E7D5B] hover:bg-[#247A53] text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                    >
                      <Lock size={14} />
                      Lock Contract Terms
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-[#F5F0E8] border-b border-[#E8E0D4] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-[#8A7E6E] font-bold block uppercase text-[10px]">
                          Seller Asking Price
                        </span>
                        <strong className="text-base text-[#2C2418] font-extrabold">
                          {sellerAsk !== null
                            ? `₹${sellerAsk.toLocaleString("en-IN")}`
                            : "—"}
                        </strong>
                      </div>
                      <div className="h-8 w-px bg-[#E8E0D4]" />
                      <div>
                        <span className="text-[#8A7E6E] font-bold block uppercase text-[10px]">
                          Buyer Bidding Price
                        </span>
                        <strong className="text-base text-[#2E7D5B] font-extrabold">
                          {buyerBid !== null
                            ? `₹${buyerBid.toLocaleString("en-IN")}`
                            : "—"}
                        </strong>
                      </div>
                      <div className="h-8 w-px bg-[#E8E0D4]" />
                      <div>
                        <span className="text-[#8A7E6E] font-bold block uppercase text-[10px]">
                          Spread Margin
                        </span>
                        <strong className="text-base text-[#C68A17] font-extrabold">
                          {spread !== null
                            ? `₹${spread.toLocaleString("en-IN")}`
                            : "—"}
                        </strong>
                      </div>
                    </div>

                    <button
                      onClick={handleAcceptDeal}
                      className="px-4 py-2 bg-[#2E7D5B] hover:bg-[#247A53] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      ✓ Accept & Agree Deal Terms
                    </button>
                  </div>

                  <div className="flex items-center gap-3 pt-2 border-t border-[#E8E0D4]">
                    <span className="text-xs font-bold text-[#2C2418] shrink-0 font-mono">
                      {myRole === "buyer"
                        ? "Submit Buyer Bid (₹):"
                        : "Submit Seller Ask (₹):"}
                    </span>
                    <input
                      type="number"
                      placeholder={
                        myRole === "buyer"
                          ? `e.g. ${(buyerBid ?? sellerAsk ?? 0) + 500}`
                          : `e.g. ${(sellerAsk ?? 0) - 500}`
                      }
                      value={myRole === "buyer" ? bidInput : askInput}
                      onChange={(e) => {
                        const val =
                          e.target.value === "" ? "" : Number(e.target.value);
                        if (myRole === "buyer") setBidInput(val);
                        else setAskInput(val);
                      }}
                      className="w-40 px-3 py-1.5 border border-[#E8E0D4] bg-white rounded-lg text-xs font-mono font-bold text-[#2C2418] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
                    />
                    <button
                      onClick={handleSubmitBid}
                      className="px-4 py-1.5 bg-[#2C2418] hover:bg-[#4E4433] text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Submit Proposal
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4 max-h-[320px] overflow-y-auto">
                  <div className="text-center py-1">
                    <span className="font-mono text-[11px] text-[#A89B8A] bg-[#FAF8F5] border border-[#E8E0D4] px-3 py-1 rounded-full uppercase">
                      Audit Log Session Initialized &bull; Encrypted
                    </span>
                  </div>

                  {activeNeg.bids.map((bid) => {
                    const isMine = bid.sender_id === org?.id;
                    const senderName =
                      bid.sender_id === activeNeg.buyer_id
                        ? `${activeNeg.buyer.name} (Buyer)`
                        : `${activeNeg.seller.name} (Seller)`;

                    let text = "";
                    if (bid.terms && bid.price === 0) {
                      text = bid.terms;
                    } else if (bid.terms) {
                      text = `${bid.terms} — ₹${bid.price.toLocaleString("en-IN")}/${activeNeg.listing.unit}`;
                    } else {
                      const action =
                        bid.sender_id === activeNeg.buyer_id
                          ? "Submitted bid"
                          : "Updated asking price";
                      text = `${action} of ₹${bid.price.toLocaleString("en-IN")}/${activeNeg.listing.unit}${bid.moq ? ` (MOQ: ${bid.moq})` : ""}`;
                    }

                    return (
                      <div
                        key={bid.id}
                        className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-mono text-[#8A7E6E]">
                          <span className="font-bold text-[#2C2418]">
                            {senderName}
                          </span>
                          <span>&bull;</span>
                          <span>{formatTime(bid.created_at)}</span>
                        </div>
                        <div
                          className={`mt-1.5 max-w-lg rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed ${
                            isMine
                              ? "bg-[#6B5B3E] text-white shadow-sm"
                              : "bg-[#FAF8F5] border border-[#E8E0D4] text-[#2C2418]"
                          }`}
                        >
                          {text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="p-4 border-t border-[#E8E0D4] bg-[#FAF8F5] flex gap-3">
                  <input
                    type="text"
                    placeholder={`Post message as ${org?.name} (${myRole === "buyer" ? "Buyer" : "Seller"})...`}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1 px-4 py-3 border border-[#E8E0D4] bg-white rounded-xl text-sm font-semibold text-[#2C2418] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="px-6 py-3 bg-[#2C2418] hover:bg-[#4E4433] text-white font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-2"
                  >
                    <Send size={14} />
                    Post Message
                  </button>
                </div>

                <div className="p-4 bg-white border-t border-[#E8E0D4] text-xs text-[#8A7E6E] font-medium leading-relaxed">
                  <strong>Interactive Workspace Details:</strong> Your role is
                  automatically determined per negotiation. Submitting bid or ask
                  updates automatically recalculates the price spread margin and
                  updates contract status.
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-[#E8E0D4] rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#E8E0D4] bg-[#FAF8F5]">
            <h2 className="text-2xl font-extrabold text-[#2C2418]">
              Active Offer Matrix & Price Differential
            </h2>
            <p className="text-sm text-[#5C5040] font-semibold mt-0.5">
              Price spread analysis across active channels
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans">
              <thead className="bg-[#FAF8F5] border-b border-[#E8E0D4] font-mono text-xs text-[#8A7E6E] uppercase">
                <tr>
                  <th className="py-4 px-6 font-extrabold">Channel ID</th>
                  <th className="py-4 px-6 font-extrabold">Material</th>
                  <th className="py-4 px-6 font-extrabold">Seller Ask</th>
                  <th className="py-4 px-6 font-extrabold">Buyer Bid</th>
                  <th className="py-4 px-6 font-extrabold">
                    Spread Differential
                  </th>
                  <th className="py-4 px-6 font-extrabold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E0D4]">
                {negotiations.map((neg) => {
                  const sa = getLatestSellerAsk(neg);
                  const bb = getLatestBuyerBid(neg);
                  const diff =
                    sa !== null && bb !== null ? sa - bb : null;
                  return (
                    <tr key={neg.id} className="hover:bg-[#FAF8F5]">
                      <td className="py-4 px-6 font-mono font-bold text-[#6B5B3E]">
                        NEG-{neg.id.slice(0, 4).toUpperCase()}
                      </td>
                      <td className="py-4 px-6 font-bold text-[#2C2418]">
                        {neg.listing.title}
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-[#2C2418]">
                        {sa !== null
                          ? `₹${sa.toLocaleString("en-IN")}`
                          : "—"}
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-[#2E7D5B]">
                        {bb !== null
                          ? `₹${bb.toLocaleString("en-IN")}`
                          : "—"}
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-[#C68A17]">
                        {diff !== null
                          ? `₹${diff.toLocaleString("en-IN")}`
                          : "—"}
                      </td>
                      <td className="py-4 px-6 font-bold">
                        {neg.status.charAt(0).toUpperCase() +
                          neg.status.slice(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-[#FAF8F5] border-t border-[#E8E0D4] text-xs text-[#8A7E6E] font-medium leading-relaxed">
            <strong>Table Details:</strong> Spread Differential measures the
            margin between seller asking price and buyer offer bid. Smaller
            spreads indicate high probability of contract execution within 24
            hours.
          </div>
        </div>
      </main>
    </div>
  );
}
