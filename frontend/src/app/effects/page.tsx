import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Visual Effects" };

export default function EffectsPage() {
  return (
    <PagePlaceholder
      eyebrow="Free"
      title="Visual Effects"
      description="Big-budget visual effects, from explosions to surreal transformations."
    />
  );
}
