import type { Metadata } from "next";
import Link from "next/link";

import { EffectsGallery } from "@/features/effects/effects-gallery";

export const metadata: Metadata = { title: "Effects" };

export default function EffectsPage() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border-subtle py-5">
        <div>
          <h1 className="editorial-label">Effects</h1>
          <p className="mt-1 text-[13px] text-foreground-muted">Start with a visual direction.</p>
        </div>
        <Link href="/generate/video" className="text-[13px] text-foreground-muted transition-colors hover:text-accent-text">
          Video Studio
        </Link>
      </header>
      <p className="max-w-2xl pt-6 text-[15px] leading-relaxed text-foreground-muted">
        A reference library of camera moves, effects and looks. Each entry is a written preset:
        choosing one opens Video Studio with its prompt already in place.
      </p>
      <EffectsGallery />
    </div>
  );
}
