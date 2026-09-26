import type { Metadata } from "next";

import { ImageGenerator } from "@/features/image-generation/image-generator";
import { NEGATIVE_PROMPT_MAX_LENGTH } from "@/lib/schemas/generation";

export const metadata: Metadata = { title: "Create Image" };

interface PageProps {
  searchParams: Promise<{ model?: string; prompt?: string; aspect?: string; batch?: string; negative?: string }>;
}

/** `?model=&prompt=&aspect=&batch=&negative=` come from mega-menu links and History "Reuse prompt". */
export default async function ImageGeneratePage({ searchParams }: PageProps) {
  const { model, prompt, aspect, batch, negative } = await searchParams;
  const batchSize = Number.parseInt(batch ?? "", 10);
  return (
    <ImageGenerator
      initialModelId={model}
      initialPrompt={prompt}
      initialAspectRatio={aspect}
      initialBatchSize={Number.isFinite(batchSize) ? batchSize : undefined}
      initialNegativePrompt={negative?.slice(0, NEGATIVE_PROMPT_MAX_LENGTH)}
    />
  );
}
