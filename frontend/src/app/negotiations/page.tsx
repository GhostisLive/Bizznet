"use client";

import { useEffect, useState, useRef, type ChangeEvent } from "react";
import Sidebar from "@/components/Sidebar";
import { useCurrentOrg } from "@/lib/useCurrentOrg";
import { useAuth } from "@/lib/AuthProvider";
import { api } from "@/lib/api";
import {
  Handshake,
  ShieldCheck,
  CheckCircle2,
  Send,
  Lock,
  ArrowUpRight,
  Loader2,
  PackageSearch,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
} from "lucide-react";
import { formatTime } from "@/lib/formatTime";

interface Bid {
  id: string;
  negotiation_id: string;
  sender_id: string;
  price: number;
  moq: number;
  provenance_requirement: string | null;
  terms: string | null;
  created_at: string;
  timestamp?: string;
  type: "bid";
}

interface Message {
  id: string;
  negotiation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  edited_at?: string | null;
  read_by?: string[];
  type: "message";
}

type ConversationItem = (Bid | Message) & { type: "bid" | "message" };

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

interface NegotiationDocument {
  id: string;
  negotiation_id: string;
  document_type: string;
  document_number: string;
  title: string;
  content_markdown: string;
  terms_snapshot: Record<string, unknown>;
  generation_source: "ollama" | "template";
  ai_model: string | null;
  generation_error: string | null;
  created_at: string;
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
  document?: NegotiationDocument | null;
}

export default function NegotiationsPage() {
  const orgCtx = useCurrentOrg();
  const { user, org, loading: authLoading } = useAuth();

  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [fetching, setFetching] = useState(true);
  const [activeNegId, setActiveNegId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, { name: string; timeout: NodeJS.Timeout }>>({});
  
  const [bidInput, setBidInput] = useState<number | "">("");
  const [askInput, setAskInput] = useState<number | "">("");
  const [submittingBid, setSubmittingBid] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading || !org) return;

    async function fetchNegotiations() {
      setFetching(true);
      try {
        const data = await api.request<Negotiation[]>("/negotiation/negotiations/enriched");
        const sorted = data.map((n) => ({
          ...n,
          bids: [...n.bids].sort((a, b) =>
            new Date(a.created_at || a.timestamp || 0).getTime() -
            new Date(b.created_at || b.timestamp || 0).getTime()
          ),
        }));
        setNegotiations(sorted);
        if (sorted.length > 0 && !activeNegId) setActiveNegId(sorted[0].id);
      } catch (error) {
        console.error("Failed to fetch negotiations:", error);
        setNegotiations([]);
      } finally {
        setFetching(false);
      }
    }

    fetchNegotiations();
  }, [authLoading, org]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function fetchMessages(negotiationId: string) {
     if (!org) return;
     setMessagesLoading(true);
     try {
       // Use the ApiClient which already has the token set from login
       const msgs = await api.request<any[]>(`/negotiation/${negotiationId}/messages`);
       setMessages(msgs);
       await markMessagesAsRead(negotiationId, msgs);
     } catch (err: any) {
       console.error("Failed to fetch messages:", err);
     } finally {
       setMessagesLoading(false);
     }
  }

  async function markMessagesAsRead(negotiationId: string, msgs: Message[]) {
    if (!org) return;
    const unreadIds = msgs
      .filter((m) => m.sender_id !== org.id && !m.read_by?.includes(org.id))
      .map((m) => m.id);
    if (unreadIds.length === 0) return;
    try {
      for (const msgId of unreadIds) {
        await api.request(`/negotiation/${negotiationId}/messages/read`, {
          method: "POST",
          body: JSON.stringify({ message_id: msgId }),
        });
      }
      setMessages((prev) => prev.map((m) =>
        unreadIds.includes(m.id) ? { ...m, read_by: [...(m.read_by || []), org.id] } : m
      ));
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  }

  async function sendMessage(negotiationId: string) {
    if (!chatInput.trim() || !org) return;
    setSendingMessage(true);
    try {
      const newMsg = await api.request<Message>(
        `/negotiation/${negotiationId}/messages`,
        { method: "POST", body: JSON.stringify({ content: chatInput.trim() }) }
      );
      setMessages((prev) => [...prev, newMsg]);
      setChatInput("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSendingMessage(false);
    }
  }

  useEffect(() => {
    if (!activeNegId || !user) return;
    setMessages([]);
    fetchMessages(activeNegId);
    const interval = window.setInterval(() => fetchMessages(activeNegId), 5000);
    return () => window.clearInterval(interval);
  }, [activeNegId, user]);

  async function handleSubmitBid() {
    if (!activeNeg || !org) return;
    const role = getUserRole(activeNeg);
    const price = role === "buyer" ? bidInput : askInput;
    if (price === "" || typeof price !== "number" || Number.isNaN(price)) {
      alert("Please enter a valid price");
      return;
    }
    setSubmittingBid(true);
    try {
      const data = await api.request<Bid>(`/negotiation/${activeNeg.id}/bid`,
        {
          method: "POST",
          body: JSON.stringify({ price, moq: activeNeg.listing.moq || 1, terms: "Accepted deal terms", provenance_requirement: "none" }),
        }
      );
      const newBid = { ...data, type: "bid" as const };
      setNegotiations((prev) => prev.map((n) => n.id === activeNeg.id ? { ...n, bids: [...n.bids, newBid] } : n));
      if (role === "buyer") setBidInput(""); else setAskInput("");
      await checkAndUpdateAgreement(activeNeg.id, role, Number(price));
    } catch (error: any) {
      console.error("Failed to submit bid:", error);
      alert("Failed to submit offer: " + error.message);
    } finally {
      setSubmittingBid(false);
    }
  }

  async function checkAndUpdateAgreement(negotiationId: string, submitterRole: "buyer" | "seller", submittedPrice: number) {
    const neg = negotiations.find((n) => n.id === negotiationId);
    if (!neg) return;
    const agreed = getLatestSellerAsk(neg) !== null && getLatestBuyerBid(neg) !== null && getLatestBuyerBid(neg)! >= getLatestSellerAsk(neg)!;
    setNegotiations((prev) => prev.map((n) => n.id === negotiationId ? { ...n, status: agreed ? "agreed" : "countered" } : n));
    if (agreed) alert("Deal agreed! Both parties have agreed on the price.");
  }

  async function handleAcceptOffer() {
    if (!activeNeg || !org) return;
    const currentSellerAsk = getLatestSellerAsk(activeNeg);
    const currentBuyerBid = getLatestBuyerBid(activeNeg);
    if (currentSellerAsk === null || currentBuyerBid === null) {
      alert("No offers to accept");
      return;
    }
    try {
      const result = await api.request<{ negotiation: Negotiation; document: NegotiationDocument }>(
        `/negotiation/${activeNeg.id}/accept`,
        { method: "POST" }
      );
      setNegotiations((prev) =>
        prev.map((n) =>
          n.id === activeNeg.id
            ? { ...n, ...result.negotiation, document: result.document }
            : n
        )
      );
      alert("Offer accepted. The commercial agreement document is ready below.");
    } catch (error: any) {
      console.error("Failed to accept offer:", error);
      alert("Failed to accept: " + error.message);
    }
  }

  async function handleRejectOffer() {
    if (!activeNeg || !confirm("Are you sure you want to reject this offer and cancel the negotiation?")) return;
    setNegotiations((prev) => prev.map((n) => n.id === activeNeg.id ? { ...n, status: "cancelled" } : n));
    alert("Offer rejected. Negotiation cancelled.");
  }

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

  const getMergedConversation = (): ConversationItem[] => {
    if (!activeNeg) return [];
    
    const items: ConversationItem[] = [];
    
    activeNeg.bids.forEach((bid) => {
      items.push({ ...bid, type: "bid" });
    });
    
    messages.forEach((msg) => {
      items.push({ ...msg, type: "message" });
    });
    
    return items.sort((a, b) => 
      new Date(a.created_at || ("timestamp" in a ? a.timestamp : undefined) || 0).getTime() -
      new Date(b.created_at || ("timestamp" in b ? b.timestamp : undefined) || 0).getTime()
    );
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
  const spread = sellerAsk !== null && buyerBid !== null ? sellerAsk - buyerBid : null;
  const originalAsk = activeNeg ? activeNeg.listing.price : null;
  const conversation = getMergedConversation();

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
              Unified negotiation console with real-time messaging and offer tracking
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
          {/* Negotiation List */}
          <div className="lg:col-span-1 bg-white border border-[#E8E0D4] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-[#E8E0D4] bg-[#FAF8F5] flex justify-between items-center">
              <h2 className="text-lg font-extrabold text-[#2C2418]">
                Negotiation Channels
              </h2>
              <span className="font-mono text-xs font-bold text-[#6B5B3E] bg-[#F5F0E8] px-2.5 py-1 rounded-full">
                {negotiations.length} Active
              </span>
            </div>

            <div className="divide-y divide-[#E8E0D4] max-h-[600px] overflow-y-auto">
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
          </div>

          {/* Chat Window */}
          {activeNeg && (
            <div className="lg:col-span-2 bg-white border border-[#E8E0D4] rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[700px]">
              {/* Header with Deal Info */}
              <div className="p-6 border-b border-[#E8E0D4] bg-[#FAF8F5] space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
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
                  <h2 className="text-xl font-extrabold text-[#2C2418]">
                    {activeNeg.listing.title}
                  </h2>
                  <p className="text-xs font-semibold text-[#8A7E6E]">
                    Negotiating with:{" "}
                    <strong className="text-[#2C2418]">
                      {getCounterpartName(activeNeg)}
                    </strong>
                  </p>
                </div>

                {/* Deal Tracker */}
                <div className="grid grid-cols-3 gap-3 bg-white rounded-xl border border-[#E8E0D4] p-3">
                  <div className="text-center">
                    <span className="text-[#8A7E6E] font-bold block text-[10px] uppercase">
                      Original Ask
                    </span>
                    <strong className="text-sm text-[#2C2418] font-extrabold">
                      {originalAsk !== null
                        ? `₹${originalAsk.toLocaleString("en-IN")}`
                        : "—"}
                    </strong>
                  </div>
                  <div className="text-center">
                    <span className="text-[#8A7E6E] font-bold block text-[10px] uppercase">
                      Our Offer
                    </span>
                    <strong className="text-sm text-[#2E7D5B] font-extrabold">
                      {myRole === "buyer"
                        ? buyerBid !== null
                          ? `₹${buyerBid.toLocaleString("en-IN")}`
                          : "—"
                        : sellerAsk !== null
                        ? `₹${sellerAsk.toLocaleString("en-IN")}`
                        : "—"}
                    </strong>
                  </div>
                  <div className="text-center">
                    <span className="text-[#8A7E6E] font-bold block text-[10px] uppercase">
                      Their Offer
                    </span>
                    <strong className="text-sm text-[#C68A17] font-extrabold flex items-center justify-center gap-1">
                      {myRole === "buyer"
                        ? sellerAsk !== null
                          ? `₹${sellerAsk.toLocaleString("en-IN")}`
                          : "—"
                        : buyerBid !== null
                        ? `₹${buyerBid.toLocaleString("en-IN")}`
                        : "—"}
                    </strong>
                  </div>
                </div>

                {/* Spread Info */}
                {spread !== null && (
                  <div className="flex items-center gap-2 text-xs font-mono bg-white rounded-lg p-2 border border-[#E8E0D4]">
                    <span className="text-[#8A7E6E] font-bold">Gap:</span>
                    <strong className="text-[#2C2418] font-extrabold">
                      ₹{Math.abs(spread).toLocaleString("en-IN")}
                    </strong>
                    <span className="flex items-center gap-1">
                      {spread > 0 ? (
                        <>
                          <TrendingUp size={12} className="text-[#C68A17]" />
                          <span className="text-[#C68A17] font-bold">Seller higher</span>
                        </>
                      ) : spread < 0 ? (
                        <>
                          <TrendingDown size={12} className="text-[#2E7D5B]" />
                          <span className="text-[#2E7D5B] font-bold">Buyer higher</span>
                        </>
                      ) : (
                        <>
                          <Minus size={12} className="text-[#2E7D5B]" />
                          <span className="text-[#2E7D5B] font-bold">Matched!</span>
                        </>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Conversation */}
              <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[450px]">
                <div className="text-center py-2">
                  <span className="font-mono text-[11px] text-[#A89B8A] bg-[#FAF8F5] border border-[#E8E0D4] px-3 py-1 rounded-full uppercase">
                    Unified Negotiation Thread
                  </span>
                </div>

                {conversation.length === 0 ? (
                  <div className="text-center py-12 text-sm text-[#8A7E6E]">
                    <MessageSquare size={32} className="mx-auto text-[#D4C9B8] mb-2" />
                    <p>Start the negotiation...</p>
                  </div>
                ) : (
                  conversation.map((item) => {
                    const isMine = item.sender_id === org?.id;
                    const senderName =
                      item.sender_id === activeNeg.buyer_id
                        ? `${activeNeg.buyer?.name || "Buyer"} (Buyer)`
                        : `${activeNeg.seller?.name || "Seller"} (Seller)`;

                    if (item.type === "bid") {
                      const bid = item as Bid;
                      const text =
                        bid.sender_id === activeNeg.buyer_id
                          ? `Submitted bid of ₹${bid.price.toLocaleString("en-IN")}/${activeNeg.listing?.unit || "unit"}`
                          : `Updated asking price to ₹${bid.price.toLocaleString("en-IN")}/${activeNeg.listing?.unit || "unit"}`;

                      return (
                        <div
                          key={bid.id}
                          className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                        >
                          <div className="flex items-center gap-1.5 text-xs font-mono text-[#8A7E6E]">
                            <span className="font-bold text-[#2C2418]">{senderName}</span>
                            <span>&bull;</span>
                            <span>{formatTime(bid.created_at || bid.timestamp || "")}</span>
                          </div>
                          <div
                            className={`mt-1.5 max-w-xs rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed flex items-center gap-2 ${
                              isMine
                                ? "bg-[#6B5B3E] text-white shadow-sm"
                                : "bg-[#FAF8F5] border border-[#E8E0D4] text-[#2C2418]"
                            }`}
                          >
                            <DollarSign size={16} />
                            {text}
                          </div>
                        </div>
                      );
                    } else {
                      const msg = item as Message;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                        >
                          <div className="flex items-center gap-1.5 text-xs font-mono text-[#8A7E6E]">
                            <span className="font-bold text-[#2C2418]">{senderName}</span>
                            <span>&bull;</span>
                            <span>{formatTime(msg.created_at)}</span>
                          </div>
                          <div
                            className={`mt-1.5 max-w-xs rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed ${
                              isMine
                                ? "bg-[#6B5B3E] text-white shadow-sm"
                                : "bg-[#FAF8F5] border border-[#E8E0D4] text-[#2C2418]"
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      );
                    }
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-6 border-t border-[#E8E0D4] bg-[#FAF8F5] space-y-3">
                {/* Quotation Submission */}
                <div className="flex items-center gap-3 bg-white border border-[#E8E0D4] p-3 rounded-xl">
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
                    className="flex-1 px-3 py-2 border border-[#E8E0D4] bg-white rounded-lg text-xs font-mono font-bold text-[#2C2418] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
                  />
                  <button
                    onClick={handleSubmitBid}
                    disabled={submittingBid}
                    className="px-4 py-2 bg-[#2E7D5B] hover:bg-[#247A53] disabled:bg-gray-400 text-white rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-2"
                  >
                    {submittingBid ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <DollarSign size={14} />
                    )}
                    Submit Offer
                  </button>
                </div>

                {/* Accept/Reject Buttons */}
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={handleAcceptOffer}
                    disabled={submittingBid}
                    className="flex-1 px-4 py-2 bg-[#2E7D5B] hover:bg-[#247A53] disabled:bg-gray-400 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    {myRole === "buyer"
                      ? "Accept Their Ask"
                      : "Accept Buyer Bid"}
                  </button>
                  <button
                    onClick={handleRejectOffer}
                    disabled={submittingBid}
                    className="flex-1 px-4 py-2 ml-3 bg-[#DC2626] hover:bg-[#B91C1C] disabled:bg-gray-400 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Reject Offer
                  </button>
                </div>

                {/* Chat Input */}
                <div className="flex items-end gap-3">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (activeNegId) sendMessage(activeNegId);
                      }
                    }}
                    disabled={sendingMessage}
                    className="flex-1 px-4 py-2.5 border border-[#E8E0D4] bg-white rounded-xl text-sm font-medium text-[#2C2418] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E] disabled:bg-[#FAF8F5]"
                  />
                  <button
                    onClick={() => sendMessage(activeNegId!)}
                    disabled={sendingMessage || !chatInput.trim()}
                    className="px-4 py-2.5 bg-[#2C2418] hover:bg-[#4E4433] disabled:bg-gray-400 text-white rounded-xl text-sm font-bold transition-colors whitespace-nowrap flex items-center gap-2"
                  >
                    {sendingMessage ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                    Send
                  </button>
                </div>

                {activeNeg.document && (
                  <section className="mt-5 rounded-xl border border-[#D8E8DE] bg-[#F7FCF8] p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-extrabold text-[#2E7D5B]">
                          <CheckCircle2 size={16} />
                          {activeNeg.document.title}
                        </div>
                        <p className="mt-1 text-[11px] font-mono text-[#6B7E70]">
                          {activeNeg.document.document_number} · Generated with{" "}
                          {activeNeg.document.generation_source === "ollama"
                            ? activeNeg.document.ai_model || "Ollama Cloud"
                            : "verified template"}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          const blob = await api.downloadAgreementPdf(activeNeg.document!.negotiation_id);
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement("a");
                          link.href = url;
                          link.download = `${activeNeg.document!.document_number}.pdf`;
                          link.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="inline-flex items-center justify-center rounded-lg bg-[#2E7D5B] px-3 py-2 text-xs font-bold text-white hover:bg-[#247A53]"
                      >
                        Download agreement
                      </button>
                    </div>
                    {activeNeg.document.generation_error && (
                      <p className="mt-3 text-xs font-semibold text-[#8A5A17]">
                        AI generation notice: {activeNeg.document.generation_error}. A complete
                        template document was retained so the accepted terms are not lost.
                      </p>
                    )}
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs font-bold text-[#2C2418]">
                        View agreement details
                      </summary>
                      <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-white p-4 text-xs leading-5 text-[#4E4433]">
                        {activeNeg.document.content_markdown}
                      </pre>
                    </details>
                  </section>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
