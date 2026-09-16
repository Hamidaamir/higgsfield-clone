import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Cinema Studio" };

export default function CinemaStudioPage() {
  return (
    <PagePlaceholder
      eyebrow="Studio"
      title="Cinema Studio"
      description="Create cinematic scenes with camera, lens, lighting and AI director controls."
    />
  );
}
