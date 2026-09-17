import type { Metadata } from "next";

import { AudioGenerator } from "@/features/audio-generation/audio-generator";

export const metadata: Metadata = { title: "Text to Speech" };

interface PageProps {
  searchParams: Promise<{ model?: string; prompt?: string; voice?: string; language?: string }>;
}

/** `?model=&prompt=&voice=&language=` come from mega-menu links and History "Reuse prompt". */
export default async function AudioGeneratePage({ searchParams }: PageProps) {
  const { model, prompt, voice, language } = await searchParams;
  return <AudioGenerator initialModelId={model} initialScript={prompt} initialVoice={voice} initialLanguage={language} />;
}
