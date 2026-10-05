"use client";

import { formatTime } from "@/lib/formatTime";

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

interface EnrichedNegotiation {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  status: string;
  provenance_reviewed: boolean;
  created_at: string;
  listing?: {
    id: string;
    title: string;
    category: string;
    price: number;
    unit: string;
    moq: number;
    organization_id: string;
  };
  buyer?: { id: string; name: string; role: string };
  seller?: { id: string; name: string; role: string };
  bids: Bid[];
}

interface OrgInfo {
  id: string;
  name: string;
  role: string;
}

interface Props {
  activeNeg: EnrichedNegotiation | null;
  formatTime: (iso: string) => string;
  org: { id: string; name: string } | null | undefined;
}

export function TimelineTabContent({ activeNeg, formatTime, org }: Props) {
  return (
    <div>
      <div className="text-center py-1">
        <span className="font-mono text-[11px] text-[#A89B8A] bg-[#FAF8F5] border border-[#E8E0D4] px-3 py-1 rounded-full uppercase">
          Negotiation Timeline
        </span>
      </div>

      {activeNeg && activeNeg.bids.length === 0 ? (
        <div className="text-center py-8 text-sm text-[#8A7E6E]">
          No bids yet. Submit the first bid to start negotiating.
        </div>
      ) : (
        activeNeg?.bids.map((bid) => {
          const isMine = bid.sender_id === org?.id;
          const senderName =
            bid.sender_id === activeNeg?.buyer_id
              ? `${activeNeg?.buyer?.name || "Buyer"} (Buyer)`
              : `${activeNeg?.seller?.name || "Seller"} (Seller)`;

          const text = bid.terms
            ? bid.terms
            : `Offered \u20B9${bid.price.toLocaleString("en-IN")}/${activeNeg?.listing?.unit || "unit"} (MOQ: ${bid.moq})${bid.provenance_requirement ? ` \u2022 Provenance: ${bid.provenance_requirement}` : ""}`;

          return (
            <div
              key={bid.id}
              className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-1.5 text-xs font-mono text-[#8A7E6E]">
                <span className="font-bold text-[#2C2418]">{senderName}</span>
                <span>\u2022</span>
                <span>{formatTime(bid.timestamp)}</span>
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
        })
      )}
    </div>
  );
}