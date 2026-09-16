import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <PagePlaceholder
      eyebrow="Library"
      title="Projects"
      description="Organize generations into projects."
    />
  );
}
