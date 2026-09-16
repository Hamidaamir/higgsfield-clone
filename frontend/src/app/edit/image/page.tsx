import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Edit Image" };

export default function EditImagePage() {
  return (
    <PagePlaceholder
      eyebrow="Edit"
      title="Edit Image"
      description="Inpaint, relight, upscale and swap — one real editing path lands in P1."
    />
  );
}
