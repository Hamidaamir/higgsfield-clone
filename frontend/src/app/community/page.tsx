import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Explore the inside of every project" };

export default function CommunityPage() {
  return (
    <PagePlaceholder
      eyebrow="Community"
      title="Explore the inside of every project"
      description="See all prompts, assets, and how each project was created."
    />
  );
}
