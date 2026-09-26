import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Pricing" };

/**
 * One plan exists. The other two describe where a paid tier would sit and are marked as
 * concepts — there is no billing system, so nothing here can be bought.
 */
const CURRENT = {
  name: "Free",
  price: "$0",
  note: "What every account gets today.",
  features: [
    "Image, video and speech generation",
    "Reference-guided editing",
    "An archive with reuse and retry",
    "No card, no billing",
  ],
};

const CONCEPTS = [
  {
    name: "Pro",
    note: "Where a single-creator tier would sit.",
    features: ["Higher generation limits", "Priority queueing", "Commercial licence", "Upscaling"],
  },
  {
    name: "Scale",
    note: "Where a team tier would sit.",
    features: ["Shared workspaces", "Single sign-on", "Usage reporting", "Dedicated support"],
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-8">
      <header className="border-b border-border-subtle py-5">
        <h1 className="editorial-label">Pricing</h1>
        <p className="mt-1 text-[13px] text-foreground-muted">One real plan, and two that are not built.</p>
      </header>

      <p className="max-w-2xl pt-6 text-[15px] leading-relaxed text-foreground-muted">
        This build generates through free-tier providers, so the free plan is the whole product.
        There is no checkout, subscription, invoice or credit balance behind this page.
      </p>

      <section className="mt-10 grid gap-10 border-t border-border-default pt-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div>
          <p className="editorial-label text-accent-text">Current plan</p>
          <h2 className="editorial-display mt-3 text-5xl">{CURRENT.name}</h2>
          <p className="mt-2 text-3xl text-foreground-muted">{CURRENT.price}</p>
          <p className="mt-4 text-sm leading-relaxed text-foreground-muted">{CURRENT.note}</p>
          <ul className="mt-6 space-y-3 text-sm">
            {CURRENT.features.map((feature) => (
              <li key={feature} className="border-t border-border-subtle pt-3 text-foreground">
                {feature}
              </li>
            ))}
          </ul>
          <Button asChild size="lg" className="mt-8 rounded-none shadow-none">
            <Link href="/signup">Create a free account</Link>
          </Button>
        </div>

        <div>
          <p className="editorial-label text-foreground-muted">Concepts</p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-foreground-muted">
            Sketches of paid tiers, listed for completeness. No price is set, nothing can be
            purchased, and none of these features exist in this build.
          </p>
          <div className="mt-6 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-1">
            {CONCEPTS.map((plan) => (
              <article key={plan.name} className="border-t border-border-default py-6">
                <p className="editorial-label text-foreground-subtle">Not available</p>
                <h3 className="editorial-display mt-2 text-2xl">{plan.name}</h3>
                <p className="mt-2 text-sm text-foreground-muted">{plan.note}</p>
                <ul className="mt-3 text-sm text-foreground-muted">
                  {plan.features.map((feature) => (
                    <li key={feature} className="leading-relaxed">
                      {feature}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <p className="mt-6 text-[13px] leading-relaxed text-foreground-muted">
            Team requirements are described on the{" "}
            <Link href="/enterprise" className="text-accent-text underline underline-offset-4">
              teams concept page
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
