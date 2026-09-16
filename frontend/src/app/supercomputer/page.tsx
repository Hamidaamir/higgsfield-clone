import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Supercomputer" };

export default function SupercomputerPage() {
  return (
    <PagePlaceholder
      eyebrow="Agent"
      title="Supercomputer"
      description="One superagent for your entire creative stack."
    />
  );
}
