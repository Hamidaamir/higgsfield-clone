import type { Metadata } from "next";

import { SectionHeader } from "@/components/discovery/primitives";
import { EffectsGallery } from "@/features/effects/effects-gallery";

export const metadata: Metadata = { title: "Effects" };

export default function EffectsPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-10 pt-6 sm:px-6">
      <SectionHeader
        as="h1"
        title="Visual effects"
        subtitle="Big-budget visual effects, from explosions to surreal transformations. Every preset opens Create Video pre-filled — free to use."
      />
      <EffectsGallery />
    </div>
  );
}
