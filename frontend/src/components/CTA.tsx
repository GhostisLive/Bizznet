"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <section id="pricing" className="bg-white py-24 border-b border-[#E8E0D4]">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-[#2C2418] md:text-4xl">
          Get early access to BizzNet.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-[#5C5040]">
          We&apos;re onboarding pilot partners in select verticals. Request access and we&apos;ll match you to the right cohort.
        </p>

        {submitted ? (
          <div className="mx-auto mt-10 max-w-md rounded-xl border border-[#2E7D5B]/30 bg-[#EEF7F2] px-6 py-5">
            <p className="text-sm font-semibold text-[#2E7D5B]">
              Request received. We&apos;ll be in touch within 48 hours.
            </p>
            <p className="mt-1 font-mono text-xs text-[#8A7E6E]">p
              {email}
            </p>
          </div>
        ) : (
          <form
            className="mx-auto mt-10 flex max-w-md gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (email.trim()) setSubmitted(true);
            }}
          >
            <label className="sr-only" htmlFor="cta-email">
              Work email
            </label>
            <input
              id="cta-email"
              type="email"
              required
              placeholder="your@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-lg border border-[#E8E0D4] bg-[#FAF8F5] px-4 py-3 text-sm text-[#2C2418] placeholder:text-[#A89B8A] focus:border-[#6B5B3E] focus:outline-none focus:ring-1 focus:ring-[#6B5B3E]"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-[#2C2418] hover:bg-[#4E4433] px-6 py-3 text-sm font-semibold text-white transition-colors"
            >
              Request Access
              <ArrowRight size={14} />
            </button>
          </form>
        )}

        <p
          className="mx-auto mt-6 max-w-sm font-mono text-xs text-[#A89B8A]"
          data-synthetic="true"
        >
          Free during pilot. Pricing announced after beta closes.
        </p>
      </div>
    </section>
  );
}
