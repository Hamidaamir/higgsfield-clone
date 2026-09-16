import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "History" };

export default function HistoryPage() {
  return (
    <PagePlaceholder
      eyebrow="Library"
      title="History"
      description="Every generation you create is saved here. Available after milestone M3."
    />
  );
}
