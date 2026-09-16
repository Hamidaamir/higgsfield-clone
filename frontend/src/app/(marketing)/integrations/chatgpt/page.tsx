import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "ChatGPT Plugin" };

export default function IntegrationsChatgptPage() {
  return (
    <PagePlaceholder
      eyebrow="New"
      title="ChatGPT Plugin"
      description="Viral video presets now in ChatGPT, with free generations."
    />
  );
}
