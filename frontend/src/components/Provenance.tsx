"use client";

import { ShieldCheck, ClipboardCheck, FileText, ArrowRight } from "lucide-react";

const grades = [
  {
    level: "Self-Reported",
    icon: FileText,
    badgeBg: "bg-self-reported-light",
    badgeText: "text-self-reported",
    iconColor: "text-self-reported",
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
    badgeBg: "bg-audited-light",
    badgeText: "text-audited",
    iconColor: "text-audited",
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
    badgeBg: "bg-verified-light",
    badgeText: "text-verified",
    iconColor: "text-verified",
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
    <section id="provenance" className="bg-surface py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
          Provenance isn&apos;t a badge. It&apos;s a price signal.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-text-secondary">
          Every listing on BizzNet carries a provenance grade — self-reported,
          audited, or third-party verified. Buyers filter on it. Sellers compete
          on it. Contracts lock to it.
        </p>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {grades.map((grade) => {
            const Icon = grade.icon;
            return (
              <div
                key={grade.level}
                className={`rounded-lg border bg-surface-elevated p-8 ${
                  grade.accent
                    ? "border-l-2 border-accent border-t-border-subtle border-r-border-subtle border-b-border-subtle"
                    : "border-border-subtle"
                }`}
              >
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs font-medium ${grade.badgeBg} ${grade.badgeText}`}
                >
                  {grade.accent && <ShieldCheck className="h-3 w-3" />}
                  {grade.level}
                </span>
                <Icon size={24} className={`mt-5 ${grade.iconColor}`} />
                <h3 className="mt-4 text-xl font-semibold text-text-primary">
                  {grade.title}
                </h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                  {grade.description}
                </p>
                <div className="mt-6 border-t border-border-subtle pt-4 space-y-2">
                  {grade.data.map((d) => (
                    <div
                      key={d.label}
                      className="flex items-center justify-between font-mono text-sm"
                    >
                      <span className="text-text-tertiary">{d.label}</span>
                      <span className="font-medium text-text-primary">
                        {d.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex items-center gap-3 rounded-md border border-border-subtle bg-surface-elevated px-6 py-4">
          <p className="flex-1 font-mono text-sm text-text-secondary">
            During negotiation, both parties review the provenance trace before
            locking terms.
          </p>
          <ArrowRight size={16} className="shrink-0 text-accent" />
        </div>
      </div>
    </section>
  );
}
