"use client";

import { ShieldCheck, ClipboardCheck, Layers } from "lucide-react";

const listings = [
  {
    name: "Cold-Rolled Steel CR4",
    supplier: "Tata Steel Ltd.",
    price: "\u20B948,200/MT",
    moq: "MOQ: 25 MT",
    badge: "Verified" as const,
    co2: "2.1 kg CO\u2082e/kg",
  },
  {
    name: "Organic Cotton Yarn 30Ne",
    supplier: "Vardhman Textiles",
    price: "\u20B9890/kg",
    moq: "MOQ: 500 kg",
    badge: "Audited" as const,
    co2: "5.4 kg CO\u2082e/kg",
  },
  {
    name: "Recycled HDPE Pellets",
    supplier: "Dalmia Polypro",
    price: "\u20B972,500/MT",
    moq: "MOQ: 10 MT",
    badge: "Self-Reported" as const,
    co2: "1.8 kg CO\u2082e/kg",
  },
];

const badgeConfig = {
  Verified: {
    bg: "bg-verified-light",
    text: "text-verified",
    border: "border-verified/20",
    icon: <ShieldCheck className="h-3 w-3" />,
  },
  Audited: {
    bg: "bg-audited-light",
    text: "text-audited",
    border: "border-audited/20",
    icon: <ClipboardCheck className="h-3 w-3" />,
  },
  "Self-Reported": {
    bg: "bg-self-reported-light",
    text: "text-self-reported",
    border: "border-self-reported/20",
    icon: <Layers className="h-3 w-3" />,
  },
};

export default function Hero() {
  return (
    <section className="bg-background py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col gap-16 lg:flex-row lg:items-center lg:gap-12">
          <div className="flex flex-col gap-8 lg:w-[55%]">
            <h1 className="max-w-[600px] text-4xl font-extrabold tracking-[-0.03em] text-text-primary md:text-5xl lg:text-6xl">
              Every material tells its story. Now that story has a price.
            </h1>
            <p className="max-w-[500px] text-lg text-text-secondary">
              BizzNet connects suppliers, manufacturers, and retailers through
              verified provenance — so buyers can filter, compare, and negotiate
              on trust, not just cost.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="rounded-md bg-cta-bg px-6 py-3 font-semibold text-cta-text transition-opacity hover:opacity-90">
                Request Early Access
              </button>
              <button className="rounded-md border border-border px-6 py-3 font-medium text-text-primary transition-colors hover:border-text-secondary">
                See How It Works
              </button>
            </div>
            <p
              className="font-mono text-xs text-text-tertiary"
              data-synthetic="true"
            >
              Serving 2,400+ businesses across 12 supply chain verticals
            </p>
          </div>

          <div className="lg:w-[45%]">
            <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-elevated shadow-sm">
              <div className="flex gap-2 border-b border-border-subtle px-4 py-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-verified/30 bg-verified-light px-3 py-1 text-xs font-medium text-verified ring-1 ring-verified/10">
                  <ShieldCheck className="h-3 w-3" />
                  Verified
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-audited-light px-3 py-1 text-xs font-medium text-audited">
                  Audited
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs font-medium text-text-tertiary">
                  All Grades
                </span>
              </div>

              <div className="divide-y divide-border-subtle">
                {listings.map((item) => {
                  const config = badgeConfig[item.badge];
                  return (
                    <div
                      key={item.name}
                      className="flex flex-col gap-2 px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-sans text-sm font-semibold text-text-primary">
                            {item.name}
                          </p>
                          <p className="font-mono text-xs text-text-tertiary">
                            {item.supplier}
                          </p>
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${config.bg} ${config.text} ${config.border}`}
                        >
                          {config.icon}
                          {item.badge}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-sm font-medium text-text-primary">
                          {item.price}
                        </span>
                        <span className="font-mono text-xs text-text-tertiary">
                          {item.moq}
                        </span>
                        <span className="font-mono text-xs text-text-tertiary">
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
