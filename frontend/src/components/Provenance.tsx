"use client";

import { ShieldCheck, ClipboardCheck, FileText, ArrowRight } from "lucide-react";

const grades = [
  {
    level: "Self-Reported",
    icon: FileText,
    badgeBg: "bg-[#F0EBE3]",
    badgeText: "text-[#8A7E6E]",
    iconColor: "text-[#8A7E6E]",
    title: "Supplier-Declared",
    description:
      "The supplier uploads their own documentation. Useful for initial listings, but carries lower trust weight in provenance-filtered searches.",
    data: [
      { label: "Trust Weight", value: "Low" },
      { label: "Filter Priority", value: "3rd" },
      { label: "Bid Impact", value: "Baseline" },
    ],
    accent: false,
  },
  {
    level: "Audited",
    icon: ClipboardCheck,
    badgeBg: "bg-[#FDF5E6]",
    badgeText: "text-[#C68A17]",
    iconColor: "text-[#C68A17]",
    title: "Independently Audited",
    description:
      "A recognized auditor has reviewed the facility or material records. The audit report is attached and timestamped.",
    data: [
      { label: "Trust Weight", value: "Medium" },
      { label: "Filter Priority", value: "2nd" },
      { label: "Bid Impact", value: "+8–12%" },
    ],
    accent: false,
  },
  {
    level: "Third-Party Verified",
    icon: ShieldCheck,
    badgeBg: "bg-[#EEF7F2]",
    badgeText: "text-[#2E7D5B]",
    iconColor: "text-[#2E7D5B]",
    title: "Third-Party Verified",
    description:
      "An accredited third party has verified the full chain — from raw material origin through processing. The verification is contract-linkable.",
    data: [
      { label: "Trust Weight", value: "High" },
      { label: "Filter Priority", value: "1st" },
      { label: "Bid Impact", value: "+15–22%" },
    ],
    accent: true,
  },
];

export default function Provenance() {
  return (
    <section id="provenance" className="bg-[#FAF8F5] py-24 border-b border-[#E8E0D4]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs font-semibold text-[#6B5B3E] uppercase tracking-wider">Provenance Tiers</span>
          <h2 className="text-3xl font-bold tracking-tight text-[#2C2418] md:text-4xl">
            Provenance isn&apos;t a badge. It&apos;s a price signal.
          </h2>
          <p className="mt-2 max-w-2xl text-lg text-[#5C5040]">
            Every listing on BizzNet carries a provenance grade — self-reported, audited, or third-party verified. Buyers filter on it. Sellers compete on it. Contracts lock to it.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {grades.map((grade) => {
            const Icon = grade.icon;
            return (
              <div
                key={grade.level}
                className={`rounded-xl border bg-white p-8 shadow-xs ${
                  grade.accent
                    ? "border-[#6B5B3E]/40 ring-1 ring-[#6B5B3E]/20"
                    : "border-[#E8E0D4]"
                }`}
              >
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs font-semibold ${grade.badgeBg} ${grade.badgeText}`}
                >
                  {grade.accent && <ShieldCheck className="h-3.5 w-3.5" />}
                  {grade.level}
                </span>
                <Icon size={24} className={`mt-5 ${grade.iconColor}`} />
                <h3 className="mt-4 text-xl font-semibold text-[#2C2418]">
                  {grade.title}
                </h3>
                <p className="mt-2 text-sm text-[#5C5040] leading-relaxed">
                  {grade.description}
                </p>
                <div className="mt-6 border-t border-[#E8E0D4] pt-4 space-y-2">
                  {grade.data.map((d) => (
                    <div
                      key={d.label}
                      className="flex items-center justify-between font-mono text-sm"
                    >
                      <span className="text-[#A89B8A]">{d.label}</span>
                      <span className="font-semibold text-[#2C2418]">
                        {d.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex items-center gap-3 rounded-xl border border-[#E8E0D4] bg-white px-6 py-4 shadow-xs">
          <p className="flex-1 font-mono text-sm text-[#5C5040]">
            During negotiation, both parties review the provenance trace before locking terms.
          </p>
          <ArrowRight size={16} className="shrink-0 text-[#6B5B3E]" />
        </div>
      </div>
    </section>
  );
}
