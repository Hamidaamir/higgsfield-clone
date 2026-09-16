import type { Metadata } from "next";

import { ImageGenerator } from "@/features/image-generation/image-generator";

export const metadata: Metadata = { title: "Create Image" };

interface PageProps {
  searchParams: Promise<{ model?: string }>;
}

export default async function ImageGeneratePage({ searchParams }: PageProps) {
  const { model } = await searchParams;
  return <ImageGenerator initialModelId={model} />;
}
