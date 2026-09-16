import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Text to Speech" };

export default function GenerateAudioPage() {
  return (
    <PagePlaceholder
      eyebrow="Audio"
      title="Text to Speech"
      description="Lifelike speech from any script. Wired to a real provider in milestone M5."
    />
  );
}
