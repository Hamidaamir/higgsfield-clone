import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Edit Video" };

export default function EditVideoPage() {
  return (
    <PagePlaceholder
      eyebrow="Edit"
      title="Edit Video"
      description="Edit scenes, shots and elements with text prompts."
    />
  );
}
