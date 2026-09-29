"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import {
  Handshake,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Send,
  Lock,
  ArrowUpRight
} from "lucide-react";

export default function NegotiationsPage() {
  const [activeChannelId, setActiveChannelId] = useState("NEG-9081");
  const [messageInput, setMessageInput] = useState("");
  const [activeParty, setActiveParty] = useState<"buyer" | "seller">("buyer");
  
  // Local edit inputs for live counter bidding/asking
  const [bidInput, setBidInput] = useState<number | "">("");
  const [askInput, setAskInput] = useState<number | "">("");

  const [channels, setChannels] = useState([
    {
      id: "NEG-9081",
      counterpart: "Tata Steel Ltd.",
      material: "Cold-Rolled Steel CR4",
      volume: "50 MT",
      sellerAsk: 49500,
      buyerBid: 48200,
      status: "Agreed",
      provenance: "3rd-Party Verified",
      co2: "2.1 kg CO₂e/kg",
      history: [
        { sender: "Tata Steel Ltd. (Seller)", text: "Batch #982 CR4 documentation uploaded with ISO-14001 certification attached.", time: "10:14 AM" },
        { sender: "Manufacturer Alpha (Buyer)", text: "Offer accepted at ₹48,200/MT. Trace verification confirmed by auditor node.", time: "10:25 AM" }
      ]
    },
    {
      id: "NEG-9084",
      counterpart: "Greenfield Polymers Ltd.",
      material: "Recycled HDPE Pellets",
      volume: "25 MT",
      sellerAsk: 74000,
      buyerBid: 72500,
      status: "Countered",
      provenance: "3rd-Party Verified",
      co2: "1.8 kg CO₂e/kg",
      history: [
        { sender: "Greenfield Polymers (Seller)", text: "Revised volume availability to 25 MT at ₹74,000/MT asking price.", time: "Yesterday" }
      ]
    },
    {
      id: "NEG-9089",
      counterpart: "Vardhman Textiles",
      material: "Organic Cotton Yarn 30Ne",
      volume: "500 kg",
      sellerAsk: 920,
      buyerBid: 890,
      status: "In Review",
      provenance: "Audited",
      co2: "5.4 kg CO₂e/kg",
      history: [
        { sender: "Vardhman Textiles (Seller)", text: "Organic certification document link generated.", time: "2 days ago" }
      ]
    }
  ]);

  const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0];

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    const senderName = activeParty === "buyer" ? "Manufacturer Alpha (Buyer)" : `${activeChannel.counterpart} (Seller)`;
    setChannels(prev => prev.map(c => {
      if (c.id === activeChannel.id) {
        return {
          ...c,
          history: [...c.history, { sender: senderName, text: messageInput, time: "Just now" }]
        };
      }
      return c;
    }));
    setMessageInput("");
  };

  const handleUpdateBid = (newBid: number) => {
    if (!newBid || isNaN(newBid)) return;
    setChannels(prev => prev.map(c => {
      if (c.id === activeChannel.id) {
        const isMatch = newBid >= c.sellerAsk;
        return {
          ...c,
          buyerBid: newBid,
          status: isMatch ? "Agreed" : "Countered",
          history: [
            ...c.history,
            {
              sender: "Manufacturer Alpha (Buyer)",
              text: `Submitted counter-bid of ₹${newBid.toLocaleString()}/unit. ${isMatch ? "Matched asking price! Deal status set to Agreed." : ""}`,
              time: "Just now"
            }
          ]
        };
      }
      return c;
    }));
  };

  const handleUpdateAsk = (newAsk: number) => {
    if (!newAsk || isNaN(newAsk)) return;
    setChannels(prev => prev.map(c => {
      if (c.id === activeChannel.id) {
        const isMatch = newAsk <= c.buyerBid;
        return {
          ...c,
          sellerAsk: newAsk,
          status: isMatch ? "Agreed" : "Countered",
          history: [
            ...c.history,
            {
              sender: `${c.counterpart} (Seller)`,
              text: `Updated asking price to ₹${newAsk.toLocaleString()}/unit. ${isMatch ? "Matched buyer bid! Deal status set to Agreed." : ""}`,
              time: "Just now"
            }
          ]
        };
      }
      return c;
    }));
  };

  const handleAcceptDeal = () => {
    setChannels(prev => prev.map(c => {
      if (c.id === activeChannel.id) {
        const finalPrice = activeParty === "buyer" ? c.sellerAsk : c.buyerBid;
        return {
          ...c,
          buyerBid: finalPrice,
          sellerAsk: finalPrice,
          status: "Agreed",
          history: [
            ...c.history,
            {
              sender: activeParty === "buyer" ? "Manufacturer Alpha (Buyer)" : `${c.counterpart} (Seller)`,
              text: `Accepted contract terms at ₹${finalPrice.toLocaleString()}/unit! Both parties agreed.`,
              time: "Just now"
            }
          ]
        };
      }
      return c;
    }));
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C2418] flex flex-col lg:flex-row font-sans">
      <Sidebar currentRole="Manufacturer" orgName="Manufacturer Alpha" />

      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-x-hidden max-w-[1600px] mx-auto w-full">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E8E0D4]">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#2C2418] tracking-tight">
              Contract & Offer Negotiations
            </h1>
            <p className="text-base font-semibold text-[#5C5040] mt-1">
              Interactive dual-party negotiation console with cryptographic audit trail
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Interactive Party Switcher Toggle */}
            <div className="flex items-center bg-[#F5F0E8] border border-[#E8E0D4] p-1 rounded-xl">
              <button
                onClick={() => setActiveParty("buyer")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeParty === "buyer"
                    ? "bg-[#2C2418] text-white shadow-xs"
                    : "text-[#8A7E6E] hover:text-[#2C2418]"
                }`}
              >
                Act as Buyer (Manufacturer)
              </button>
              <button
                onClick={() => setActiveParty("seller")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeParty === "seller"
                    ? "bg-[#6B5B3E] text-white shadow-xs"
                    : "text-[#8A7E6E] hover:text-[#2C2418]"
                }`}
              >
                Act as Seller (Supplier)
              </button>
            </div>

            <span className="hidden sm:inline-flex items-center gap-2 px-3 py-2 bg-white border border-[#E8E0D4] rounded-xl text-xs font-mono font-bold text-[#2E7D5B]">
              <span className="size-2.5 rounded-full bg-[#2E7D5B]" />
              Auditor Session Active
            </span>
          </div>
        </div>

        {/* Negotiations Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Channel Selector Sidebar */}
          <div className="lg:col-span-1 bg-white border border-[#E8E0D4] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-[#E8E0D4] bg-[#FAF8F5] flex justify-between items-center">
              <h2 className="text-lg font-extrabold text-[#2C2418]">Negotiation Channels</h2>
              <span className="font-mono text-xs font-bold text-[#6B5B3E] bg-[#F5F0E8] px-2.5 py-1 rounded-full">
                {channels.length} Active
              </span>
            </div>

            <div className="divide-y divide-[#E8E0D4]">
              {channels.map((chan) => (
                <button
                  key={chan.id}
                  onClick={() => setActiveChannelId(chan.id)}
                  className={`w-full text-left p-5 transition-colors flex flex-col gap-2 ${
                    activeChannelId === chan.id ? "bg-[#F5F0E8]/60 border-l-4 border-[#6B5B3E]" : "hover:bg-[#FAF8F5]"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-[#6B5B3E]">{chan.id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                      chan.status === "Agreed" ? "bg-[#EEF7F2] text-[#2E7D5B]" : "bg-[#FDF5E6] text-[#C68A17]"
                    }`}>
                      {chan.status}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base text-[#2C2418]">{chan.material}</h3>
                  <div className="flex justify-between items-center text-xs text-[#8A7E6E] font-semibold mt-1">
                    <span>{chan.counterpart}</span>
                    <span className="font-mono font-bold text-[#2C2418]">₹{chan.buyerBid.toLocaleString()}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Explanatory Text Below Channel Selector */}
            <div className="p-4 bg-[#FAF8F5] border-t border-[#E8E0D4] text-xs text-[#8A7E6E] font-medium leading-relaxed">
              <strong>Panel Details:</strong> Select a channel to view the real-time bid progression and cryptographically signed audit timeline.
            </div>
          </div>

          {/* Active Workspace */}
          <div className="lg:col-span-2 bg-white border border-[#E8E0D4] rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px] justify-between">
            <div>
              {/* Channel Header */}
              <div className="p-6 border-b border-[#E8E0D4] bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#6B5B3E]">{activeChannel.id}</span>
                    <span className="text-[#8A7E6E]">&bull;</span>
                    <span className="font-mono text-xs font-bold text-[#2E7D5B]">{activeChannel.provenance}</span>
                    <span className="text-[#8A7E6E]">&bull;</span>
                    <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                      activeChannel.status === "Agreed" ? "bg-[#EEF7F2] text-[#2E7D5B]" : "bg-[#FDF5E6] text-[#C68A17]"
                    }`}>
                      {activeChannel.status}
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-[#2C2418] mt-1">{activeChannel.material}</h2>
                  <p className="text-xs font-semibold text-[#8A7E6E]">
                    Counterpart: <strong className="text-[#2C2418]">{activeChannel.counterpart}</strong> ({activeChannel.volume})
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => alert(`Contract ${activeChannel.id} locked! Cryptographic provenance proof generated.`)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2E7D5B] hover:bg-[#247A53] text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                  >
                    <Lock size={14} />
                    Lock Contract Terms
                  </button>
                </div>
              </div>

              {/* Interactive Dual-Party Price Offer Control Bar */}
              <div className="p-4 bg-[#F5F0E8] border-b border-[#E8E0D4] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-[#8A7E6E] font-bold block uppercase text-[10px]">Seller Asking Price</span>
                      <strong className="text-base text-[#2C2418] font-extrabold">₹{activeChannel.sellerAsk.toLocaleString()}</strong>
                    </div>
                    <div className="h-8 w-px bg-[#E8E0D4]" />
                    <div>
                      <span className="text-[#8A7E6E] font-bold block uppercase text-[10px]">Buyer Bidding Price</span>
                      <strong className="text-base text-[#2E7D5B] font-extrabold">₹{activeChannel.buyerBid.toLocaleString()}</strong>
                    </div>
                    <div className="h-8 w-px bg-[#E8E0D4]" />
                    <div>
                      <span className="text-[#8A7E6E] font-bold block uppercase text-[10px]">Spread Margin</span>
                      <strong className="text-base text-[#C68A17] font-extrabold">₹{(activeChannel.sellerAsk - activeChannel.buyerBid).toLocaleString()}</strong>
                    </div>
                  </div>

                  <button
                    onClick={handleAcceptDeal}
                    className="px-4 py-2 bg-[#2E7D5B] hover:bg-[#247A53] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    ✓ Accept & Agree Deal Terms
                  </button>
                </div>

                {/* Counter Offer Input Row depending on Active Party */}
                <div className="flex items-center gap-3 pt-2 border-t border-[#E8E0D4]">
                  <span className="text-xs font-bold text-[#2C2418] shrink-0 font-mono">
                    {activeParty === "buyer" ? "Submit Buyer Bid (₹):" : "Submit Seller Ask (₹):"}
                  </span>
                  <input
                    type="number"
                    placeholder={activeParty === "buyer" ? `e.g. ${activeChannel.buyerBid + 500}` : `e.g. ${activeChannel.sellerAsk - 500}`}
                    value={activeParty === "buyer" ? bidInput : askInput}
                    onChange={(e) => {
                      const val = e.target.value === "" ? "" : Number(e.target.value);
                      if (activeParty === "buyer") setBidInput(val);
                      else setAskInput(val);
                    }}
                    className="w-40 px-3 py-1.5 border border-[#E8E0D4] bg-white rounded-lg text-xs font-mono font-bold text-[#2C2418] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
                  />
                  <button
                    onClick={() => {
                      if (activeParty === "buyer" && typeof bidInput === "number") {
                        handleUpdateBid(bidInput);
                        setBidInput("");
                      } else if (activeParty === "seller" && typeof askInput === "number") {
                        handleUpdateAsk(askInput);
                        setAskInput("");
                      }
                    }}
                    className="px-4 py-1.5 bg-[#2C2418] hover:bg-[#4E4433] text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Submit Proposal
                  </button>
                </div>
              </div>

              {/* Chat & Offer Progression */}
              <div className="p-6 space-y-4 max-h-[320px] overflow-y-auto">
                <div className="text-center py-1">
                  <span className="font-mono text-[11px] text-[#A89B8A] bg-[#FAF8F5] border border-[#E8E0D4] px-3 py-1 rounded-full uppercase">
                    Audit Log Session Initialized &bull; Encrypted
                  </span>
                </div>

                {activeChannel.history.map((msg, i) => {
                  const isCurrentPartyMsg = (activeParty === "buyer" && msg.sender.includes("Buyer")) || (activeParty === "seller" && msg.sender.includes("Seller"));
                  return (
                    <div key={i} className={`flex flex-col ${isCurrentPartyMsg ? "items-end" : "items-start"}`}>
                      <div className="flex items-center gap-1.5 text-xs font-mono text-[#8A7E6E]">
                        <span className="font-bold text-[#2C2418]">{msg.sender}</span>
                        <span>&bull;</span>
                        <span>{msg.time}</span>
                      </div>
                      <div className={`mt-1.5 max-w-lg rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed ${
                        isCurrentPartyMsg ? "bg-[#6B5B3E] text-white shadow-sm" : "bg-[#FAF8F5] border border-[#E8E0D4] text-[#2C2418]"
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Input & Explanatory Footer */}
            <div>
              <div className="p-4 border-t border-[#E8E0D4] bg-[#FAF8F5] flex gap-3">
                <input
                  type="text"
                  placeholder={`Post message as ${activeParty === "buyer" ? "Manufacturer Alpha (Buyer)" : activeChannel.counterpart + " (Seller)"}...`}
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

              {/* Explanatory Details Below Negotiation Area */}
              <div className="p-4 bg-white border-t border-[#E8E0D4] text-xs text-[#8A7E6E] font-medium leading-relaxed">
                <strong>Interactive Workspace Details:</strong> Toggle between Buyer and Seller perspectives at the top right to simulate multi-party negotiations. Submitting bid or ask updates automatically recalculates the price spread margin and updates contract status.
              </div>
            </div>
          </div>
        </div>

        {/* Offer Matrix Table */}
        <div className="bg-white border border-[#E8E0D4] rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#E8E0D4] bg-[#FAF8F5]">
            <h2 className="text-2xl font-extrabold text-[#2C2418]">Active Offer Matrix & Price Differential</h2>
            <p className="text-sm text-[#5C5040] font-semibold mt-0.5">Price spread analysis across active channels</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans">
              <thead className="bg-[#FAF8F5] border-b border-[#E8E0D4] font-mono text-xs text-[#8A7E6E] uppercase">
                <tr>
                  <th className="py-4 px-6 font-extrabold">Channel ID</th>
                  <th className="py-4 px-6 font-extrabold">Material</th>
                  <th className="py-4 px-6 font-extrabold">Seller Ask</th>
                  <th className="py-4 px-6 font-extrabold">Buyer Bid</th>
                  <th className="py-4 px-6 font-extrabold">Spread Differential</th>
                  <th className="py-4 px-6 font-extrabold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E0D4]">
                {channels.map((chan) => {
                  const diff = chan.sellerAsk - chan.buyerBid;
                  return (
                    <tr key={chan.id} className="hover:bg-[#FAF8F5]">
                      <td className="py-4 px-6 font-mono font-bold text-[#6B5B3E]">{chan.id}</td>
                      <td className="py-4 px-6 font-bold text-[#2C2418]">{chan.material}</td>
                      <td className="py-4 px-6 font-mono font-bold text-[#2C2418]">₹{chan.sellerAsk.toLocaleString()}</td>
                      <td className="py-4 px-6 font-mono font-bold text-[#2E7D5B]">₹{chan.buyerBid.toLocaleString()}</td>
                      <td className="py-4 px-6 font-mono font-bold text-[#C68A17]">₹{diff.toLocaleString()}</td>
                      <td className="py-4 px-6 font-bold">{chan.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Explanatory Details Directly Below Table */}
          <div className="p-4 bg-[#FAF8F5] border-t border-[#E8E0D4] text-xs text-[#8A7E6E] font-medium leading-relaxed">
            <strong>Table Details:</strong> Spread Differential measures the margin between seller asking price and buyer offer bid. Smaller spreads indicate high probability of contract execution within 24 hours.
          </div>
        </div>
      </main>
    </div>
  );
}
