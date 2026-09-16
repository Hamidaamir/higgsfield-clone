import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "3D Jutsu" };

export default function ThreedJutsuPage() {
  return (
    <PagePlaceholder
      eyebrow="New"
      title="3D Jutsu"
      description="Create 3D scenes and turn them into videos."
    />
  );
}
