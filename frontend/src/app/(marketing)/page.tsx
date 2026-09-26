import { CreateHero } from "@/features/create/create-hero";
import { CreativeModes } from "@/features/create/creative-modes";
import { RecentWork } from "@/features/create/recent-work";
import { StudioShowcase } from "@/features/create/studio-showcase";

/**
 * Create — the product's creative entry point (reference: docs/design/editorial-studio-*.png).
 *
 * Hero, the four workflows, then recent work. Everything except the session-dependent parts
 * renders on the server; `RecentWork` decides between real generations and the curated
 * showcase, which is passed in already rendered so anonymous visitors never load the
 * authenticated generations code path.
 *
 * The previous discovery-heavy homepage (effects, model galleries, project cards, banners,
 * chip cloud) now belongs to Explore and is untouched at /community for its own phase.
 */
export default function CreatePage() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-16 sm:px-6">
      <CreateHero />
      <CreativeModes />
      <RecentWork fallback={<StudioShowcase />} />
    </div>
  );
}
