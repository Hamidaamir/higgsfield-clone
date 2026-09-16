import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Higgsfield for teams" };

export default function EnterprisePage() {
  return (
    <PagePlaceholder
      eyebrow="Enterprise"
      title="Higgsfield for teams"
      description="SSO, shared workspaces and volume pricing."
    />
  );
}
