import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Higgsfield Genjutsu" };

export default function GenjutsuPage() {
  return (
    <PagePlaceholder
      eyebrow="New model"
      title="Higgsfield Genjutsu"
      description="Reality manipulation — transfer motion into new scenes, or swap details while everything else stays as filmed."
    />
  );
}
