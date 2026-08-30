"use client";

import { Building2, Users, ShieldCheck, MessageSquare, BarChart3 } from "lucide-react";

const steps = [
  {
    icon: Building2,
    title: "Register Your Business",
    description:
      "Select your role — supplier, manufacturer, distributor, retailer, or transporter — and tag your product categories.",
  },
  {
    icon: Users,
    title: "Get Matched",
    description:
      "See only the counterparts relevant to your role and categories. No noise, no irrelevant listings.",
  },
  {
    icon: ShieldCheck,
    title: "Browse with Provenance",
    description:
      "Filter the marketplace by verified, audited, or self-reported provenance grades. Every listing carries its evidence.",
  },
  {
    icon: MessageSquare,
    title: "Negotiate Transparently",
    description:
      "Make offers, review counter-offers, and inspect the full material trace before locking terms.",
  },
  {
    icon: BarChart3,
    title: "Track & Verify",
    description:
      "Monitor your active orders, ESG metrics, and provenance records from one dashboard.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
          From registration to trade, every step carries its proof.
        </h2>
        <p className="mt-3 font-mono text-sm text-text-tertiary">
          The provenance trail starts at onboarding.
        </p>

        <div className="mt-16 flex flex-col gap-0">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isLast = i === steps.length - 1;

            return (
              <div key={step.title} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-accent bg-background">
                    <Icon size={20} className="text-accent" />
                  </div>
                  {!isLast && <div className="w-px flex-1 bg-accent" />}
                </div>

                <div className={isLast ? "pb-0" : "pb-12"}>
                  <h3 className="text-lg font-semibold text-text-primary">
                    {step.title}
                  </h3>
                  <p className="mt-1 max-w-md text-base text-text-secondary">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
