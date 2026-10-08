"use client";

import { ShieldCheck, ClipboardCheck, Layers, ArrowRight } from "lucide-react";

const listings = [
  {
    name: "Cold-Rolled Steel CR4",
    supplier: "Tata Steel Ltd.",
    price: "₹48,200/MT",
    moq: "MOQ: 25 MT",
    badge: "Verified" as const,
    co2: "2.1 kg CO₂e/kg",
  },
  {
    name: "Organic Cotton Yarn 30Ne",
    supplier: "Vardhman Textiles",
    price: "₹890/kg",
    moq: "MOQ: 500 kg",
    badge: "Audited" as const,
    co2: "5.4 kg CO₂e/kg",
  },
  {
    name: "Recycled HDPE Pellets",
    supplier: "Dalmia Polypro",
    price: "₹72,500/MT",
    moq: "MOQ: 10 MT",
    badge: "Self-Reported" as const,
    co2: "1.8 kg CO₂e/kg",
  },
];

const badgeConfig = {
  Verified: {
    bg: "bg-[#EEF7F2]",
    text: "text-[#2E7D5B]",
    border: "border-[#2E7D5B]/30",
    icon: <ShieldCheck className="h-3.5 w-3.5 text-[#2E7D5B]" />,
  },
  Audited: {
    bg: "bg-[#FDF5E6]",
    text: "text-[#C68A17]",
    border: "border-[#C68A17]/30",
    icon: <ClipboardCheck className="h-3.5 w-3.5 text-[#C68A17]" />,
  },
  "Self-Reported": {
    bg: "bg-[#F0EBE3]",
    text: "text-[#8A7E6E]",
    border: "border-[#8A7E6E]/30",
    icon: <Layers className="h-3.5 w-3.5 text-[#8A7E6E]" />,
  },
};

export default function Hero() {
  return (
    <section className="bg-[#FAF8F5] py-20 lg:py-28 border-b border-[#E8E0D4]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col gap-16 lg:flex-row lg:items-center lg:gap-12">
          <div className="flex flex-col gap-6 lg:w-[55%]">
            <div className="inline-flex items-center gap-2 w-fit rounded-full border border-[#6B5B3E]/20 bg-[#F5F0E8] px-3.5 py-1 text-xs font-semibold text-[#6B5B3E]">
              <span className="size-2 rounded-full bg-[#6B5B3E]" />
              Enterprise B2B Provenance Engine
            </div>

            <h1 className="max-w-[600px] text-4xl font-extrabold tracking-tight text-[#2C2418] md:text-5xl lg:text-6xl leading-[1.15]">
              Every material tells its story. Now that story has a price.
            </h1>

            <p className="max-w-[520px] text-lg text-[#5C5040] leading-relaxed">
              BizzNet connects suppliers, manufacturers, and retailers through verified provenance — so buyers can filter, compare, and negotiate on trust, not just cost.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
               <a
                 href="/login"
                 className="inline-flex items-center gap-2 rounded-lg bg-[#2C2418] hover:bg-[#4E4433] px-6 py-3.5 font-semibold text-white text-sm transition-all shadow-sm"
               >
                 Login
                 <ArrowRight size={16} />
               </a>
               <a
                 href="/signup"
                 className="inline-flex items-center gap-2 rounded-lg border border-[#E8E0D4] bg-white px-6 py-3.5 font-medium text-[#2C2418] text-sm transition-colors hover:bg-[#FAF8F5] shadow-xs"
               >
                 Register
               </a>
             </div>

            <p className="font-mono text-xs text-[#A89B8A]">
              Serving 2,400+ businesses across 12 supply chain verticals
            </p>
          </div>

          <div className="lg:w-[45%]">
            <div className="overflow-hidden rounded-xl border border-[#E8E0D4] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E8E0D4] bg-[#FAF8F5] px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-[#2C2418]">BizzNet Live Marketplace</span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#EEF7F2] px-2.5 py-0.5 text-xs font-semibold text-[#2E7D5B] border border-[#2E7D5B]/20">
                  <ShieldCheck className="h-3 w-3" /> 100% Trace Verified
                </span>
              </div>

              <div className="divide-y divide-[#E8E0D4]">
                {listings.map((item) => {
                  const config = badgeConfig[item.badge];
                  return (
                    <div
                      key={item.name}
                      className="flex flex-col gap-2.5 px-5 py-4 transition-colors hover:bg-[#FAF8F5]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-sans text-sm font-semibold text-[#2C2418]">
                            {item.name}
                          </p>
                          <p className="font-mono text-xs text-[#8A7E6E]">
                            {item.supplier}
                          </p>
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold ${config.bg} ${config.text} ${config.border}`}
                        >
                          {config.icon}
                          {item.badge}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-sm font-semibold text-[#2C2418]">
                          {item.price}
                        </span>
                        <span className="font-mono text-xs text-[#8A7E6E]">
                          {item.moq}
                        </span>
                        <span className="font-mono text-xs text-[#8A7E6E] ml-auto">
                          {item.co2}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
