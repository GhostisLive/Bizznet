"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <section id="pricing" className="bg-background py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
          Get early access to BizzNet.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-text-secondary">
          We&apos;re onboarding pilot partners in select verticals. Request
          access and we&apos;ll match you to the right cohort.
        </p>

        {submitted ? (
          <div className="mx-auto mt-10 max-w-md rounded-lg border border-accent/30 bg-verified-light px-6 py-5">
            <p className="text-sm font-medium text-verified">
              Request received. We&apos;ll be in touch within 48 hours.
            </p>
            <p className="mt-1 font-mono text-xs text-text-tertiary">
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
              className="flex-1 rounded-md border border-border bg-surface-elevated px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md bg-cta-bg px-6 py-3 text-sm font-semibold text-cta-text transition-opacity hover:opacity-90"
            >
              Request Access
              <ArrowRight size={14} />
            </button>
          </form>
        )}

        <p
          className="mx-auto mt-6 max-w-sm font-mono text-xs text-text-tertiary"
          data-synthetic="true"
        >
          Free during pilot. Pricing announced after beta closes.
        </p>
      </div>
    </section>
  );
}
