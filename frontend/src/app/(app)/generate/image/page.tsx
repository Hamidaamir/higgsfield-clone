import type { Metadata } from "next";

import { ImageGenerator } from "@/features/image-generation/image-generator";

export const metadata: Metadata = { title: "Create Image" };

interface PageProps {
  searchParams: Promise<{ model?: string; prompt?: string; aspect?: string; batch?: string }>;
}

/** `?model=&prompt=&aspect=&batch=` come from mega-menu links and History "Reuse prompt". */
export default async function ImageGeneratePage({ searchParams }: PageProps) {
  const { model, prompt, aspect, batch } = await searchParams;
  const batchSize = Number.parseInt(batch ?? "", 10);
  return (
    <ImageGenerator
      initialModelId={model}
      initialPrompt={prompt}
      initialAspectRatio={aspect}
      initialBatchSize={Number.isFinite(batchSize) ? batchSize : undefined}
    />
  );
}
