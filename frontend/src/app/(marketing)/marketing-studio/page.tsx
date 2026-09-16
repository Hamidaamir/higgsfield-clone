import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Marketing Studio" };

export default function MarketingStudioPage() {
  return (
    <PagePlaceholder
      eyebrow="Studio"
      title="Marketing Studio"
      description="UGC, product shots, ads and posters from a product image or URL."
    />
  );
}
