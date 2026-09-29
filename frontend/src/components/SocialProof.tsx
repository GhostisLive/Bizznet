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
    <section className="bg-[#FAF8F5] py-24 border-b border-[#E8E0D4]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs font-semibold text-[#6B5B3E] uppercase tracking-wider">Social Proof</span>
          <h2 className="text-3xl font-bold tracking-tight text-[#2C2418] md:text-4xl">
            Trusted across the chain.
          </h2>
          <p className="mt-2 font-mono text-xs text-[#A89B8A]" data-synthetic="true">
            Synthetic testimonials — real pilot data pending.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <blockquote
              key={t.name}
              className="flex flex-col rounded-xl border border-[#E8E0D4] bg-white p-6 shadow-xs"
            >
              <p className="flex-1 text-sm leading-relaxed text-[#5C5040]">
                &ldquo;{t.quote}&rdquo;
              </p>
              <footer className="mt-6 border-t border-[#E8E0D4] pt-4">
                <p className="text-sm font-semibold text-[#2C2418]">
                  {t.name}
                </p>
                <p className="font-mono text-xs text-[#A89B8A]">
                  {t.role}, {t.company}
                </p>
              </footer>
            </blockquote>
          ))}
        </div>

        <div className="mt-16 border-t border-[#E8E0D4] pt-8">
          <p className="font-mono text-xs uppercase tracking-wider text-[#A89B8A]">
            Compliance frameworks supported
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {complianceBadges.map((badge) => (
              <span
                key={badge}
                className="rounded-lg border border-[#E8E0D4] bg-white px-4 py-2 font-mono text-sm text-[#5C5040] shadow-xs"
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
