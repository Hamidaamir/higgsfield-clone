import type { Metadata } from "next";

import { VideoGenerator } from "@/features/video-generation/video-generator";
import { NEGATIVE_PROMPT_MAX_LENGTH } from "@/lib/schemas/generation";

export const metadata: Metadata = { title: "Create Video" };

interface PageProps {
  searchParams: Promise<{ model?: string; prompt?: string; aspect?: string; duration?: string; negative?: string }>;
}

/** `?model=&prompt=&aspect=&duration=&negative=` come from mega-menu links and History "Reuse prompt". */
export default async function VideoGeneratePage({ searchParams }: PageProps) {
  const { model, prompt, aspect, duration, negative } = await searchParams;
  const seconds = Number.parseInt(duration ?? "", 10);
  return (
    <VideoGenerator
      initialModelId={model}
      initialPrompt={prompt}
      initialAspectRatio={aspect}
      initialDuration={Number.isFinite(seconds) ? seconds : undefined}
      initialNegativePrompt={negative?.slice(0, NEGATIVE_PROMPT_MAX_LENGTH)}
    />
  );
}
