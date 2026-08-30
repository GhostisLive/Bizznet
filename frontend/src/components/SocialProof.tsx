"use client";

const testimonials = [
  {
    quote:
      "We switched three suppliers last quarter based on provenance grades alone. The audit trail in the negotiation thread saved us two weeks of back-and-forth.",
    name: "Ananya Mehta",
    role: "Head of Procurement",
    company: "Ashoka Textiles",
  },
  {
    quote:
      "Our verified status gives us priority in search results. We've seen a measurable increase in inbound RFQs since getting third-party verification.",
    name: "Rajesh Kumar",
    role: "Operations Director",
    company: "Greenfield Polymers",
  },
  {
    quote:
      "The role-based matching means I only see manufacturers in my category. No filtering through thousands of irrelevant listings.",
    name: "Priya Venkatesh",
    role: "Supply Chain Manager",
    company: "Metro Distribution Co.",
  },
];

const complianceBadges = [
  "ISO 14001",
  "SA8000",
  "BRSR Ready",
  "GRI Standards",
  "CSRD Aligned",
  "Scope 3 Tracked",
];

export default function SocialProof() {
  return (
    <section className="bg-surface py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
          Trusted across the chain.
        </h2>
        <p className="mt-4 font-mono text-sm text-text-tertiary" data-synthetic="true">
          Synthetic testimonials — real pilot data pending.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <blockquote
              key={t.name}
              className="flex flex-col rounded-lg border border-border-subtle bg-surface-elevated p-6"
            >
              <p className="flex-1 text-sm leading-relaxed text-text-secondary">
                &ldquo;{t.quote}&rdquo;
              </p>
              <footer className="mt-6 border-t border-border-subtle pt-4">
                <p className="text-sm font-semibold text-text-primary">
                  {t.name}
                </p>
                <p className="font-mono text-xs text-text-tertiary">
                  {t.role}, {t.company}
                </p>
              </footer>
            </blockquote>
          ))}
        </div>

        <div className="mt-16 border-t border-border-subtle pt-8">
          <p className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
            Compliance frameworks supported
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {complianceBadges.map((badge) => (
              <span
                key={badge}
                className="rounded-md border border-border-subtle bg-surface-elevated px-4 py-2 font-mono text-sm text-text-secondary"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
