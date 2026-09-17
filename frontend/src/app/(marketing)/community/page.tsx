import type { Metadata } from "next";

import { SectionHeader } from "@/components/discovery/primitives";
import { CommunityGallery } from "@/features/community/community-gallery";

export const metadata: Metadata = { title: "Community" };

export default function CommunityPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-10 pt-6 sm:px-6">
      <SectionHeader
        as="h1"
        title="Explore the inside of every project"
        subtitle="A curated showcase with the prompt and model behind each piece. Hit Recreate to open the generator pre-filled."
      />
      <CommunityGallery />
    </div>
  );
}
