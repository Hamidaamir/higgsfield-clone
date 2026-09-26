import type { Metadata } from "next";
import Link from "next/link";

import { MarketingComposer } from "@/features/studios/marketing-composer";

export const metadata: Metadata = { title: "Marketing Studio" };

export default function MarketingStudioPage() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border-subtle py-5">
        <div>
          <h1 className="editorial-label">Marketing Studio</h1>
          <p className="mt-1 text-[13px] text-foreground-muted">Shape a campaign, then generate the creative.</p>
        </div>
        <Link href="/community" className="text-[13px] text-foreground-muted transition-colors hover:text-accent-text">
          See the showcase
        </Link>
      </header>
      <p className="max-w-2xl pt-6 text-[15px] leading-relaxed text-foreground-muted">
        A product, a brand and a format become a written brief. Picking a format decides which
        studio the brief opens in — still or motion.
      </p>
      <MarketingComposer />
    </div>
  );
}
