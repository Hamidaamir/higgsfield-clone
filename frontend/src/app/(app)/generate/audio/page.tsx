import type { Metadata } from "next";

import { AudioGenerator } from "@/features/audio-generation/audio-generator";
import { STYLE_PROMPT_MAX_LENGTH } from "@/lib/schemas/generation";

export const metadata: Metadata = { title: "Text to Speech" };

interface PageProps {
  searchParams: Promise<{
    model?: string;
    prompt?: string;
    voice?: string;
    language?: string;
    batch?: string;
    style?: string;
  }>;
}

/**
 * `?model=&prompt=&voice=&language=&batch=&style=` come from mega-menu links and History
 * "Reuse prompt". Only the batch number is parsed here; how high it may go is the selected
 * model's `max_batch`, which the generator reconciles against the registry.
 */
export default async function AudioGeneratePage({ searchParams }: PageProps) {
  const { model, prompt, voice, language, batch, style } = await searchParams;
  const batchSize = Number.parseInt(batch ?? "", 10);
  return (
    <AudioGenerator
      initialModelId={model}
      initialScript={prompt}
      initialVoice={voice}
      initialLanguage={language}
      initialBatchSize={Number.isFinite(batchSize) ? batchSize : undefined}
      initialStylePrompt={style?.slice(0, STYLE_PROMPT_MAX_LENGTH)}
    />
  );
}
