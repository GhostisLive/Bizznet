"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import {
  Store,
  Search,
  Filter,
  ShieldCheck,
  ClipboardCheck,
  Layers,
  ArrowRight,
  CheckCircle2,
  Plus,
  MapPin,
  Truck,
  Clock,
  DollarSign,
  Package,
  X
} from "lucide-react";

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedLabour, setSelectedLabour] = useState("all");
  const [selectedFreightBearer, setSelectedFreightBearer] = useState("all");

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<any>(null);

  const catalogItems = [
    {
      id: "LIST-981",
      name: "Cold-Rolled Steel Sheets CR4",
      supplier: "Tata Steel Ltd.",
      category: "steel",
      price: "₹48,200/MT",
      moq: "25 MT",
      provenance: "Verified" as const,
      co2: "2.1 kg CO₂e/kg",
      labour: "3rd-Party Inspected",
      companyTrust: "3rd-Party Audited",
      location: "Jamshedpur, Jharkhand",
      sellerAddress: "Plot 14-B, Tata Steel Industrial Complex, Sonari, Jamshedpur, Jharkhand - 831001",
      stock: "450 MT Available",
      transitTime: "2-3 Business Days (Express Rail)",
      transitCost: "₹14,500 / shipment",
      transitBearer: "Seller Paid (FOB Destination)",
      imageColor: "from-[#6B5B3E] to-[#4E4433]",
      itemTypeIcon: "Steel Sheets CR4"
    },
    {
      id: "LIST-982",
      name: "Organic Cotton Yarn 30Ne",
      supplier: "Vardhman Textiles",
      category: "textiles",
      price: "₹890/kg",
      moq: "500 kg",
      provenance: "Audited" as const,
      co2: "5.4 kg CO₂e/kg",
      labour: "Worker Voluntary",
      companyTrust: "3rd-Party Audited",
      location: "Ludhiana, Punjab",
      sellerAddress: "Focal Point Phase IV, Ludhiana, Punjab - 141010",
      stock: "12,000 kg Available",
      transitTime: "4-5 Business Days (Surface Cargo)",
      transitCost: "₹3,200 / shipment",
      transitBearer: "Buyer Paid (FOB Origin)",
      imageColor: "from-[#C68A17] to-[#8A7E6E]",
      itemTypeIcon: "Organic Yarn 30Ne"
    },
    {
      id: "LIST-983",
      name: "Recycled HDPE Pellets",
      supplier: "Dalmia Polypro",
      category: "plastics",
      price: "₹72,500/MT",
      moq: "10 MT",
      provenance: "Self-Reported" as const,
      co2: "1.8 kg CO₂e/kg",
      labour: "Worker Voluntary",
      companyTrust: "Voluntary",
      location: "Vapi, Gujarat",
      sellerAddress: "GIDC Industrial Estate, Plot 89, Vapi, Gujarat - 396195",
      stock: "180 MT Available",
      transitTime: "3-4 Business Days (Full Truck Load)",
      transitCost: "₹8,800 / shipment",
      transitBearer: "Shared 50/50 Freight",
      imageColor: "from-[#2E7D5B] to-[#5C5040]",
      itemTypeIcon: "HDPE Pellets"
    },
    {
      id: "LIST-984",
      name: "Virgin Aluminum Ingots AL-99",
      supplier: "Hindalco Industries",
      category: "aluminum",
      price: "₹2,10,000/MT",
      moq: "15 MT",
      provenance: "Verified" as const,
      co2: "8.4 kg CO₂e/kg",
      labour: "3rd-Party Inspected",
      companyTrust: "3rd-Party Audited",
      location: "Renukoot, Uttar Pradesh",
      sellerAddress: "Hindalco Works Campus, Sonebhadra, Renukoot, Uttar Pradesh - 231217",
      stock: "220 MT Available",
      transitTime: "2-4 Business Days (Dedicated Logistics)",
      transitCost: "₹22,000 / shipment",
      transitBearer: "Seller Paid (FOB Destination)",
      imageColor: "from-[#4E4433] to-[#2C2418]",
      itemTypeIcon: "AL-99 Ingots"
    },
    {
      id: "LIST-985",
      name: "Recycled PET Flakes Green",
      supplier: "Greenfield Polymers",
      category: "plastics",
      price: "₹64,000/MT",
      moq: "40 MT",
      provenance: "Audited" as const,
      co2: "1.2 kg CO₂e/kg",
      labour: "Worker Voluntary",
      companyTrust: "Voluntary",
      location: "Dahej, Gujarat",
      sellerAddress: "SEZ Phase II, Dahej Industrial Port, Bharuch, Gujarat - 392130",
      stock: "95 MT Available",
      transitTime: "3-5 Business Days (Standard Ground)",
      transitCost: "₹11,000 / shipment",
      transitBearer: "Buyer Paid (FOB Origin)",
      imageColor: "from-[#2E7D5B] to-[#6B5B3E]",
      itemTypeIcon: "rPET Flakes"
    },
    {
      id: "LIST-986",
      name: "High-Tensile Fasteners Grade 8.8",
      supplier: "Sundram Fasteners",
      category: "hardware",
      price: "₹185/kg",
      moq: "1,000 kg",
      provenance: "Verified" as const,
      co2: "3.1 kg CO₂e/kg",
      labour: "3rd-Party Inspected",
      companyTrust: "3rd-Party Audited",
      location: "Chennai, Tamil Nadu",
      sellerAddress: "Padi Industrial Complex, Chennai, Tamil Nadu - 600050",
      stock: "35,000 kg Available",
      transitTime: "1-2 Business Days (Express Logistics)",
      transitCost: "₹2,500 / shipment",
      transitBearer: "Seller Paid (FOB Destination)",
      imageColor: "from-[#6B5B3E] to-[#2C2418]",
      itemTypeIcon: "Fasteners Grade 8.8"
    }
  ];

  const filteredItems = catalogItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === "all" || item.category === selectedCategory;
    const matchesGrade = selectedGrade === "all" || item.provenance.toLowerCase() === selectedGrade.toLowerCase();
    const matchesLabour = selectedLabour === "all" || item.labour === selectedLabour;
    const matchesFreight = selectedFreightBearer === "all" || item.transitBearer.toLowerCase().includes(selectedFreightBearer.toLowerCase());
    return matchesSearch && matchesCat && matchesGrade && matchesLabour && matchesFreight;
  });

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C2418] flex flex-col lg:flex-row font-sans">
      <Sidebar currentRole="Manufacturer" orgName="Manufacturer Alpha" />

      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-x-hidden max-w-[1600px] mx-auto w-full">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E8E0D4]">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#2C2418] tracking-tight">
              B2B Material Marketplace
            </h1>
            <p className="text-base font-semibold text-[#5C5040] mt-1">
              Role-matched verified supplier catalog with integrated audit provenance & logistics transparency
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => alert("Creating new supply listing...")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2C2418] hover:bg-[#4E4433] text-white rounded-xl text-xs font-bold shadow-md transition-colors"
            >
              <Plus size={16} />
              Post New Supply Listing
            </button>
          </div>
        </div>

        {/* Integrated Filter Controls Bar */}
        <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A89B8A]" />
              <input
                type="text"
                placeholder="Search material spec, seller, location or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-sm font-semibold text-[#2C2418] placeholder:text-[#A89B8A] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-[#8A7E6E]" />
                <span className="text-xs font-mono font-bold text-[#8A7E6E]">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-xs font-bold text-[#2C2418] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
                >
                  <option value="all">All Categories</option>
                  <option value="steel">Steel</option>
                  <option value="textiles">Textiles</option>
                  <option value="plastics">Plastics</option>
                  <option value="aluminum">Aluminum</option>
                  <option value="hardware">Hardware</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#8A7E6E]">Provenance:</span>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="px-3 py-2 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-xs font-bold text-[#2C2418] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
                >
                  <option value="all">All Grades</option>
                  <option value="verified">Verified</option>
                  <option value="audited">Audited</option>
                  <option value="self-reported">Self-Reported</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#8A7E6E]">Labour Audit:</span>
                <select
                  value={selectedLabour}
                  onChange={(e) => setSelectedLabour(e.target.value)}
                  className="px-3 py-2 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-xs font-bold text-[#2C2418] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
                >
                  <option value="all">All Labour Audits</option>
                  <option value="3rd-Party Inspected">3rd-Party Inspected</option>
                  <option value="Worker Voluntary">Worker Voluntary</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#8A7E6E]">Freight Bearer:</span>
                <select
                  value={selectedFreightBearer}
                  onChange={(e) => setSelectedFreightBearer(e.target.value)}
                  className="px-3 py-2 border border-[#E8E0D4] bg-[#FAF8F5] rounded-xl text-xs font-bold text-[#2C2418] focus:outline-none focus:ring-2 focus:ring-[#6B5B3E]"
                >
                  <option value="all">All Freight Terms</option>
                  <option value="seller">Seller Paid (FOB Dest)</option>
                  <option value="buyer">Buyer Paid (FOB Origin)</option>
                  <option value="shared">Shared Freight</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Marketplace Produce Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-[#E8E0D4] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Visual Produce Card Image Header */}
                <div className={`h-36 bg-gradient-to-r ${item.imageColor} p-4 flex flex-col justify-between relative overflow-hidden`}>
                  <div className="flex justify-between items-start z-10">
                    <span className="font-mono text-xs font-bold text-white/90 bg-black/30 backdrop-blur-xs px-2.5 py-1 rounded-md">
                      {item.id}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-mono text-xs font-bold shadow-xs ${
                      item.provenance === "Verified"
                        ? "bg-[#EEF7F2] text-[#2E7D5B]"
                        : item.provenance === "Audited"
                        ? "bg-[#FDF5E6] text-[#C68A17]"
                        : "bg-[#F0EBE3] text-[#8A7E6E]"
                    }`}>
                      {item.provenance === "Verified" && <ShieldCheck size={14} />}
                      {item.provenance === "Audited" && <ClipboardCheck size={14} />}
                      {item.provenance === "Self-Reported" && <Layers size={14} />}
                      {item.provenance}
                    </span>
                  </div>

                  {/* Produce Graphic Overlay */}
                  <div className="z-10">
                    <h4 className="text-white font-extrabold text-lg tracking-tight drop-shadow-xs">{item.itemTypeIcon}</h4>
                    <p className="text-white/80 font-mono text-xs">{item.supplier}</p>
                  </div>

                  <div className="absolute right-[-20px] bottom-[-20px] opacity-15 text-white pointer-events-none">
                    <Package size={120} />
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-[#2C2418] line-clamp-1">{item.name}</h3>
                    <p className="text-xs font-semibold text-[#8A7E6E] flex items-center gap-1 mt-1">
                      <MapPin size={13} className="text-[#6B5B3E]" /> {item.location}
                    </p>
                  </div>

                  {/* Pricing & MOQ Box */}
                  <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E0D4] space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#8A7E6E]">Price:</span>
                      <strong className="text-[#2C2418] font-extrabold text-sm">{item.price}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8A7E6E]">MOQ & Stock:</span>
                      <span className="text-[#2C2418] font-bold">MOQ: {item.moq} ({item.stock})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8A7E6E]">Carbon Rating:</span>
                      <span className="text-[#2E7D5B] font-bold">{item.co2}</span>
                    </div>
                  </div>

                  {/* Transport & Charges Summary */}
                  <div className="space-y-1.5 text-xs font-mono border-t border-b border-[#F0EBE3] py-3">
                    <div className="flex items-center justify-between text-[#5C5040]">
                      <span className="flex items-center gap-1.5">
                        <Truck size={14} className="text-[#6B5B3E]" /> Transit Time:
                      </span>
                      <span className="font-bold text-[#2C2418]">{item.transitTime}</span>
                    </div>
                    <div className="flex items-center justify-between text-[#5C5040]">
                      <span className="flex items-center gap-1.5">
                        <DollarSign size={14} className="text-[#6B5B3E]" /> Freight Charge:
                      </span>
                      <span className="font-bold text-[#2E7D5B]">{item.transitBearer}</span>
                    </div>
                  </div>

                  {/* Integrated Audit Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 bg-[#EEF7F2] text-[#2E7D5B] rounded text-[10px] font-mono font-bold border border-[#2E7D5B]/20">
                      Labour: {item.labour}
                    </span>
                    <span className="px-2 py-0.5 bg-[#F5F0E8] text-[#6B5B3E] rounded text-[10px] font-mono font-bold border border-[#6B5B3E]/20">
                      Trust: {item.companyTrust}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-5 pt-0">
                <button
                  onClick={() => {
                    setActiveItem(item);
                    setIsDetailModalOpen(true);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2C2418] hover:bg-[#4E4433] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  Open Produce & Freight Details
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Comprehensive Produce & Logistics Detail Modal */}
      {isDetailModalOpen && activeItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8E0D4] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#E8E0D4] pb-4">
              <div className="flex gap-4 items-center">
                <div className={`size-16 rounded-xl bg-gradient-to-r ${activeItem.imageColor} flex items-center justify-center text-white shrink-0 shadow-md`}>
                  <Package size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[#6B5B3E] font-bold">{activeItem.id}</span>
                    <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold bg-[#EEF7F2] text-[#2E7D5B]">
                      {activeItem.provenance}
                    </span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-[#2C2418] mt-0.5">{activeItem.name}</h3>
                  <p className="text-xs text-[#8A7E6E] font-semibold">{activeItem.supplier} &bull; {activeItem.category.toUpperCase()}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 text-[#A89B8A] hover:text-[#2C2418] font-mono font-bold"
              >
                <X size={20} />
              </button>
            </div>

            {/* Produce Picture & Specifications Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E8E0D4] space-y-2 text-xs font-mono">
                <h4 className="font-extrabold text-sm text-[#2C2418] font-sans pb-1 border-b border-[#E8E0D4]">Material & Pricing Specs</h4>
                <div className="flex justify-between"><span className="text-[#8A7E6E]">Listed Price:</span><strong className="text-[#2C2418] font-extrabold">{activeItem.price}</strong></div>
                <div className="flex justify-between"><span className="text-[#8A7E6E]">Minimum Order (MOQ):</span><span className="text-[#2C2418] font-bold">{activeItem.moq}</span></div>
                <div className="flex justify-between"><span className="text-[#8A7E6E]">Available Stock:</span><span className="text-[#2E7D5B] font-bold">{activeItem.stock}</span></div>
                <div className="flex justify-between"><span className="text-[#8A7E6E]">Carbon Intensity:</span><span className="text-[#2E7D5B] font-bold">{activeItem.co2}</span></div>
              </div>

              {/* Transportation & Logistics Details */}
              <div className="p-4 bg-[#F5F0E8] rounded-xl border border-[#E8E0D4] space-y-2 text-xs font-mono">
                <h4 className="font-extrabold text-sm text-[#2C2418] font-sans pb-1 border-b border-[#E8E0D4]">Transportation & Freight</h4>
                <div className="flex justify-between"><span className="text-[#8A7E6E]">Estimated Transit Time:</span><strong className="text-[#2C2418] font-bold">{activeItem.transitTime}</strong></div>
                <div className="flex justify-between"><span className="text-[#8A7E6E]">Transport Cost Estimate:</span><strong className="text-[#6B5B3E] font-bold">{activeItem.transitCost}</strong></div>
                <div className="flex justify-between"><span className="text-[#8A7E6E]">Freight Charge Bearer:</span><strong className="text-[#2E7D5B] font-bold">{activeItem.transitBearer}</strong></div>
              </div>
            </div>

            {/* Seller Complete Physical Address */}
            <div className="p-4 bg-white rounded-xl border border-[#E8E0D4] space-y-1.5">
              <h4 className="text-xs font-mono uppercase font-bold text-[#8A7E6E] flex items-center gap-1.5">
                <MapPin size={14} className="text-[#6B5B3E]" /> Seller Facility & Physical Address
              </h4>
              <p className="text-sm font-bold text-[#2C2418]">{activeItem.supplier}</p>
              <p className="text-xs text-[#5C5040] leading-relaxed font-mono">{activeItem.sellerAddress}</p>
            </div>

            {/* Integrated Verification & Audit Overview */}
            <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E8E0D4] space-y-3 text-xs">
              <h4 className="font-extrabold text-sm text-[#2C2418]">Supply Chain Audit & Provenance Verification Record</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-white rounded-lg border border-[#E8E0D4]">
                  <span className="text-[#8A7E6E] font-mono block text-[10px]">Labour Standards</span>
                  <strong className="text-[#2E7D5B] font-bold block mt-0.5">{activeItem.labour}</strong>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#E8E0D4]">
                  <span className="text-[#8A7E6E] font-mono block text-[10px]">Company Trust Audit</span>
                  <strong className="text-[#6B5B3E] font-bold block mt-0.5">{activeItem.companyTrust}</strong>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#E8E0D4]">
                  <span className="text-[#8A7E6E] font-mono block text-[10px]">Carbon Rating</span>
                  <strong className="text-[#2E7D5B] font-bold block mt-0.5">{activeItem.co2}</strong>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex flex-col sm:flex-row justify-end gap-3 border-t border-[#E8E0D4]">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2.5 border border-[#E8E0D4] hover:bg-[#FAF8F5] text-[#5C5040] font-bold text-xs rounded-xl transition-colors"
              >
                Close Window
              </button>
              <button
                onClick={() => {
                  alert(`Offer submitted for ${activeItem.name}! Opening channel in Negotiations page.`);
                  setIsDetailModalOpen(false);
                }}
                className="px-6 py-2.5 bg-[#2C2418] hover:bg-[#4E4433] text-white font-bold text-xs rounded-xl transition-colors shadow-sm inline-flex items-center justify-center gap-2"
              >
                Initiate Contract Bid in Negotiations
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
