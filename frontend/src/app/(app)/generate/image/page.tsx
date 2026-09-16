import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Create Image" };

export default function GenerateImagePage() {
  return (
    <PagePlaceholder
      eyebrow="Image"
      title="Create Image"
      description="Generate AI images from a prompt. Wired to a real provider in milestone M2."
    />
  );
}
