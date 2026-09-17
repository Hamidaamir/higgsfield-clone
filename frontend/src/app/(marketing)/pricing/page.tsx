import type { Metadata } from "next";
import { Check } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Pricing" };

const plans = [
  { name: "Free", price: "$0", period: "forever", tagline: "Everything in this build", features: ["Real image, video and speech generation", "History with reuse and retry", "Free-tier provider quotas", "No card required"], cta: { label: "Start for free", href: "/signup" }, featured: true },
  { name: "Pro", price: "$29", period: "per month", tagline: "For creators shipping daily", features: ["Higher generation limits", "Priority queues", "Commercial license", "4K upscales"], cta: { label: "Coming soon", href: "/signup" } },
  { name: "Scale", price: "$99", period: "per month", tagline: "Teams and studios", features: ["Shared workspaces", "SSO", "Usage analytics", "Dedicated support"], cta: { label: "Contact sales", href: "/enterprise" } },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-10 sm:px-6">
      <div className="text-center">
        <span className="inline-flex rounded-full bg-promo px-3 py-1 text-xs font-bold uppercase text-white">30% off</span>
        <h1 className="display-heading mt-4 text-4xl sm:text-6xl">Plans for every creator</h1>
        <p className="mx-auto mt-3 max-w-xl text-text-secondary">
          This assessment build runs entirely on free tiers, so the Free plan is the real one. Paid plans are shown for product completeness — no billing is wired up.
        </p>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <section key={plan.name} className={cn("flex flex-col rounded-3xl border p-6", plan.featured ? "border-accent/60 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(214,255,0,0.12),transparent)] bg-surface shadow-accent" : "border-border bg-surface")}>
            <h2 className="text-lg font-semibold">{plan.name}</h2>
            <p className="mt-1 text-sm text-text-secondary">{plan.tagline}</p>
            <p className="mt-5"><span className="display-heading text-4xl">{plan.price}</span> <span className="text-sm text-text-secondary">{plan.period}</span></p>
            <ul className="mt-5 flex-1 space-y-2 text-sm">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />{f}</li>
              ))}
            </ul>
            <Button asChild size="lg" variant={plan.featured ? "primary" : "secondary"} className="mt-6">
              <Link href={plan.cta.href}>{plan.cta.label}</Link>
            </Button>
          </section>
        ))}
      </div>
    </div>
  );
}
