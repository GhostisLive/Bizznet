"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { useCurrentOrg } from "@/lib/useCurrentOrg";
import { useAuth } from "@/lib/AuthProvider";
import {
  Handshake,
  ShieldCheck,
  Clock,
  Loader2,
  PackageSearch,
  AlertCircle,
  FileCheck,
  LockKeyhole,
  MessageSquare,
  Send,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface Bid {
  id: string;
  negotiation_id: string;
  sender_id: string;
  price: number;
  moq: number;
  provenance_requirement: string | null;
  terms: string | null;
  timestamp: string;
}

interface Message {
  id: string;
  negotiation_id: string;
  sender_id: string;
  content: string;
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
}

interface ListingInfo {
  id: string;
  title: string;
  category: string;
  price: number;
  unit: string;
  moq: number;
  organization_id: string;
}

interface OrgInfo {
  id: string;
  name: string;
  role: string;
}

interface EnrichedNegotiation extends Negotiation {
  listing?: ListingInfo;
  buyer?: OrgInfo;
  seller?: OrgInfo;
  bids: Bid[];
}

interface NegotiationWithLastMessage extends EnrichedNegotiation {
  lastMessage?: Message;
  unreadCount?: number;
}

export default function MessagesPage() {
  const orgCtx = useCurrentOrg();
  const { user, org, loading: authLoading } = useAuth();

  const [negotiations, setNegotiations] = useState<NegotiationWithLastMessage[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !org || !user) return;
    fetchNegotiationsWithMessages();
  }, [authLoading, org, user]);

  async function fetchNegotiationsWithMessages() {
    if (!user) return;
    setFetching(true);
    setError(null);
    try {
      const { supabase: sb } = await import("@/utils/supabaseClient");
      const { data: { session } } = await sb.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`${API_BASE}/negotiation/negotiations/enriched`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch negotiations");

      const enriched: EnrichedNegotiation[] = await res.json();

      // Fetch last message for each negotiation
      const negotiationsWithMessages = await Promise.all(
        enriched.map(async (neg) => {
          try {
            const msgRes = await fetch(`${API_BASE}/negotiation/${neg.id}/messages`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (msgRes.ok) {
              const messages: Message[] = await msgRes.json();
              const lastMessage = messages[messages.length - 1];
              // Count unread messages (simplified - messages from other party after last view)
              const otherPartyMessages = messages.filter(
                (m) => m.sender_id !== org?.id
              );
              return { ...neg, lastMessage, unreadCount: otherPartyMessages.length };
            }
          } catch {
            // Ignore errors for individual negotiations
          }
          return { ...neg, lastMessage: undefined, unreadCount: 0 };
        })
      );

      // Sort by last message time (most recent first), then by negotiations with messages first
      negotiationsWithMessages.sort((a, b) => {
        if (a.lastMessage && !b.lastMessage) return -1;
        if (!a.lastMessage && b.lastMessage) return 1;
        if (a.lastMessage && b.lastMessage) {
          return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime();
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setNegotiations(negotiationsWithMessages);
    } catch (err: any) {
      console.error("Failed to fetch negotiations:", err);
      setError(err.message || "Failed to load negotiations");
    } finally {
      setFetching(false);
    }
  }

  const getUserRole = (neg: EnrichedNegotiation): "buyer" | "seller" => {
    return org?.id === neg.buyer_id ? "buyer" : "seller";
  };

  const getCounterpartName = (neg: EnrichedNegotiation): string => {
    const role = getUserRole(neg);
    return role === "buyer" ? neg.seller?.name || "Seller" : neg.buyer?.name || "Buyer";
  };

  const getCounterpartOrg = (neg: EnrichedNegotiation): OrgInfo | undefined => {
    const role = getUserRole(neg);
    return role === "buyer" ? neg.seller : neg.buyer;
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    }
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  };

  const statusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "terms_locked" || s === "completed") return "bg-[#EEF7F2] text-[#2E7D5B]";
    if (s === "active") return "bg-[#FDF5E6] text-[#C68A17]";
    return "bg-[#F5F0E8] text-[#6B5B3E]";
  };

  if (authLoading || fetching) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#2C2418] flex flex-col lg:flex-row font-sans">
        <Sidebar currentRole={orgCtx.roleLabel} orgName={orgCtx.orgName} nodeId={orgCtx.nodeId} />
        <main className="flex-1 p-6 md:p-10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-8 text-[#6B5B3E] animate-spin" />
            <span className="text-sm font-semibold text-[#8A7E6E]">Loading messages...</span>
          </div>
        </main>
      </div>
    );
  }

  if (negotiations.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#2C2418] flex flex-col lg:flex-row font-sans">
        <Sidebar currentRole={orgCtx.roleLabel} orgName={orgCtx.orgName} nodeId={orgCtx.nodeId} />
        <main className="flex-1 p-6 md:p-10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <MessageSquare className="size-12 text-[#8A7E6E]" />
            <h2 className="text-2xl font-extrabold text-[#2C2418]">No negotiations yet</h2>
            <p className="text-sm font-semibold text-[#8A7E6E] max-w-md">
              Start a negotiation from the Marketplace to begin chatting with suppliers or buyers.
            </p>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2C2418] hover:bg-[#4E4433] text-white font-bold text-xs rounded-xl transition-colors"
            >
              <ArrowRight size={14} />
              Browse Marketplace
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C2418] flex flex-col lg:flex-row font-sans">
      <Sidebar currentRole={orgCtx.roleLabel} orgName={orgCtx.orgName} nodeId={orgCtx.nodeId} />

      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-x-hidden max-w-[1200px] mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E8E0D4]">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#2C2418] tracking-tight">
              Messages
            </h1>
            <p className="text-base font-semibold text-[#5C5040] mt-1">
              Conversations across all your negotiations
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-red-900">Error</h3>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-white border border-[#E8E0D4] rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y divide-[#E8E0D4]">
            {negotiations.map((neg) => {
              const counterpartOrg = getCounterpartOrg(neg);
              const lastMsg = neg.lastMessage;
              const hasMessages = !!lastMsg;
              const isMine = lastMsg?.sender_id === org?.id;

              return (
                <Link
                  key={neg.id}
                  href={`/negotiations?id=${neg.id}`}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 transition-colors hover:bg-[#FAF8F5] border-l-4 border-transparent hover:border-[#6B5B3E]/30"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-[#F5F0E8] flex items-center justify-center flex-shrink-0">
                      <PackageSearch className="size-6 text-[#6B5B3E]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-extrabold text-base text-[#2C2418] truncate">
                          {neg.listing?.title || "Unknown Listing"}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold ${statusBadge(neg.status)}`}>
                          {neg.status === "terms_locked" ? "Locked" : "Active"}
                        </span>
                        {neg.provenance_reviewed && (
                          <span className="flex items-center gap-1 font-mono text-xs font-bold text-[#2E7D5B]">
                            <ShieldCheck size={12} />
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#8A7E6E] font-semibold mt-0.5 truncate">
                        With <strong className="text-[#2C2418]">{getCounterpartName(neg)}</strong>
                        {neg.listing && ` • ${neg.listing.category}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2 text-right w-full sm:w-auto">
                    {hasMessages ? (
                      <>
                        <div className="flex flex-col items-end gap-1">
                          <p className={`text-sm font-medium ${isMine ? "text-[#2C2418]" : "text-[#6B5B3E] font-bold"}`}>
                            {isMine ? "You: " : ""}{lastMsg?.content?.slice(0, 60)}{lastMsg && lastMsg.content.length > 60 ? "..." : ""}
                          </p>
                          <span className="text-xs font-mono text-[#8A7E6E]">{formatTime(lastMsg?.created_at || "")}</span>
                        </div>
                        {(neg.unreadCount || 0) > 0 && (
                          <span className="px-2.5 py-1 rounded-full bg-[#6B5B3E] text-white font-mono text-xs font-bold">
                            {neg.unreadCount}
                          </span>
                        )}
                      </>
                    ) : (
                      <div className="text-center text-[#8A7E6E]">
                        <span className="text-xs font-medium">No messages yet</span>
                        <p className="text-[11px] font-mono mt-0.5">Start the conversation</p>
                      </div>
                    )}
                    <Send className="size-5 text-[#6B5B3E] opacity-50" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-[#E8E0D4] rounded-2xl shadow-sm overflow-hidden p-6 text-center">
          <MessageSquare className="size-12 text-[#D4C9B8] mx-auto mb-3" />
          <h3 className="text-lg font-extrabold text-[#2C2418]">Keep the conversation going</h3>
          <p className="text-sm text-[#8A7E6E] mt-1 max-w-md mx-auto">
            Click any conversation to open the full negotiation with chat, bids, and contract management.
          </p>
        </div>
      </main>
    </div>
  );
}