import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <PagePlaceholder
      eyebrow="Account"
      title="Settings"
      description="Profile, preferences and credits."
    />
  );
}
