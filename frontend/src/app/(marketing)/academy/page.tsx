import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Academy" };

export default function AcademyPage() {
  return (
    <PagePlaceholder
      eyebrow="Learn"
      title="Academy"
      description="Courses, guides and tutorials for every Higgsfield tool."
    />
  );
}
