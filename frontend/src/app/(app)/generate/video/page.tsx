import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Create Video" };

export default function GenerateVideoPage() {
  return (
    <PagePlaceholder
      eyebrow="Video"
      title="Create Video"
      description="Turn prompts and images into video. Wired to a real provider in milestone M4."
    />
  );
}
