import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Contests" };

export default function ContestsPage() {
  return (
    <PagePlaceholder
      eyebrow="Contests"
      title="Contests"
      description="Join live challenges and win credits."
    />
  );
}
