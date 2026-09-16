import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "One canvas. Every workflow." };

export default function CanvasPage() {
  return (
    <PagePlaceholder
      eyebrow="New feature"
      title="One canvas. Every workflow."
      description="Moodboard, chain workflows, and share with your team — all on one canvas."
    />
  );
}
