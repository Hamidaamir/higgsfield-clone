import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Higgsfield MCP" };

export default function IntegrationsMcpPage() {
  return (
    <PagePlaceholder
      eyebrow="MCP & CLI"
      title="Higgsfield MCP"
      description="Turn Claude into a creative engine — build games, motion graphics and interactive 3D with Higgsfield MCP."
    />
  );
}
