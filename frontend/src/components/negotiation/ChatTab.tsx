"use client";

import { useEffect, useState, useRef, useCallback, type Dispatch, type SetStateAction } from "react";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { formatTime } from "@/lib/formatTime";
import { supabase } from "@/utils/supabaseClient";

interface Message {
  id: string;
  negotiation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  edited_at?: string | null;
  read_by?: string[];
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
}

interface Props {
  activeNeg: {
    id: string;
    buyer_id: string;
    seller_id: string;
    listing?: { unit: string };
    buyer?: { name: string };
    seller?: { name: string };
  } | null;
  activeNegId: string | null;
  messages: Message[];
  messagesLoading: boolean;
  chatInput: string;
  setChatInput: Dispatch<SetStateAction<string>>;
  sendingMessage: boolean;
  sendMessage: (id: string) => Promise<void>;
  typingUsers: Record<string, { name: string; timeout: NodeJS.Timeout }>;
  org: { id: string; name: string } | null | undefined;
  formatTime: (iso: string) => string;
  API_BASE: string;
}

export function ChatTabContent({
  activeNeg,
  activeNegId,
  messages,
  messagesLoading,
  chatInput,
  setChatInput,
  sendingMessage,
  sendMessage,
  typingUsers,
  org,
  formatTime,
  API_BASE,
}: Props) {
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasTypedRef = useRef(false);

  const handleTyping = useCallback((isTyping: boolean) => {
    if (!activeNegId) return;
    const role = activeNeg
      ? activeNeg.buyer_id === org?.id
        ? "buyer"
        : "seller"
      : "buyer";
    const userName = role === "buyer"
      ? `${activeNeg?.buyer?.name || "Buyer"} (Buyer)`
      : `${activeNeg?.seller?.name || "Seller"} (Seller)`;

    supabase
      .channel(`negotiation-messages-${activeNegId}`)
      .send({
        type: "broadcast",
        event: "typing",
        payload: { userId: org?.id, userName, isTyping },
      });
  }, [activeNegId, activeNeg, org]);

  function onChatInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setChatInput(value);

    if (value.trim() && !hasTypedRef.current) {
      hasTypedRef.current = true;
      handleTyping(true);
    } else if (!value.trim() && hasTypedRef.current) {
      hasTypedRef.current = false;
      handleTyping(false);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      if (hasTypedRef.current) {
        hasTypedRef.current = false;
        handleTyping(false);
      }
    }, 2000);
  }

  return (
    <div>
      <div className="text-center py-1">
        <span className="font-mono text-[11px] text-[#A89B8A] bg-[#FAF8F5] border border-[#E8E0D4] px-3 py-1 rounded-full uppercase">
          Negotiation Chat
        </span>
      </div>

      {messagesLoading ? (
        <div className="text-center py-8 text-sm text-[#8A7E6E]">
          <Loader2 size={20} className="animate-spin mx-auto text-[#6B5B3E]" />
          <p className="mt-2">Loading messages...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-8 text-sm text-[#8A7E6E]">
          <MessageSquare size={24} className="mx-auto text-[#D4C9B8]" />
          <p className="mt-2">No messages yet. Start the conversation!</p>
        </div>
      ) : (
        messages.map((msg) => {
          const isMine = msg.sender_id === org?.id;
          const senderName =
            msg.sender_id === activeNeg?.buyer_id
              ? `${activeNeg?.buyer?.name || "Buyer"} (Buyer)`
              : `${activeNeg?.seller?.name || "Seller"} (Seller)`;

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
                className={`mt-1.5 max-w-lg rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed ${
                  isMine
                    ? "bg-[#6B5B3E] text-white shadow-sm"
                    : "bg-[#FAF8F5] border border-[#E8E0D4] text-[#2C2418]"
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })
      )}

      {/* Typing Indicator */}
      {Object.keys(typingUsers).length > 0 && (
        <div className="flex items-center gap-2 text-xs text-[#8A7E6E] font-medium animate-pulse">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#6B5B3E] animate-bounce" style={{animationDelay: "0ms"}} />
            <div className="w-1.5 h-1.5 rounded-full bg-[#6B5B3E] animate-bounce" style={{animationDelay: "150ms"}} />
            <div className="w-1.5 h-1.5 rounded-full bg-[#6B5B3E] animate-bounce" style={{animationDelay: "300ms"}} />
          </div>
          {Object.values(typingUsers).map((u) => u.name).join(", ")} is typing...
        </div>
      )}

      {/* Chat Input */}
      <div className="pt-4 border-t border-[#E8E0D4] flex flex-col gap-2">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Type a message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && e.preventDefault() && sendMessage(activeNegId!)}
              disabled={sendingMessage}
              className="w-full px-4 py-2.5 border border-[#E8E0D4] bg-white rounded-xl text-sm font-medium text-[#2C2418] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E] disabled:bg-[#FAF8F5]"
            />
          </div>
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
      </div>
    </div>
  );
}