import type { Metadata } from "next";

import { VideoGenerator } from "@/features/video-generation/video-generator";

export const metadata: Metadata = { title: "Create Video" };

interface PageProps {
  searchParams: Promise<{ model?: string; prompt?: string; aspect?: string; duration?: string }>;
}

/** `?model=&prompt=&aspect=&duration=` come from mega-menu links and History "Reuse prompt". */
export default async function VideoGeneratePage({ searchParams }: PageProps) {
  const { model, prompt, aspect, duration } = await searchParams;
  const seconds = Number.parseInt(duration ?? "", 10);
  return (
    <VideoGenerator
      initialModelId={model}
      initialPrompt={prompt}
      initialAspectRatio={aspect}
      initialDuration={Number.isFinite(seconds) ? seconds : undefined}
    />
  );
}
