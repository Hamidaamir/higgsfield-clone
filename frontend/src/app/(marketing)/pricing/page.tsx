import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <PagePlaceholder
      eyebrow="30% off"
      title="Pricing"
      description="Plans and credits. Payment processing is out of scope for this build."
    />
  );
}
