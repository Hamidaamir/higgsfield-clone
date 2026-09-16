"use client";

import { Download, RefreshCw, RotateCcw } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { downloadUrl } from "@/lib/media";
import type { Asset, Generation, ModelSpec } from "@/types/generation";

interface ResultLightboxProps {
  item: { generation: Generation; asset: Asset } | null;
  model: ModelSpec | undefined;
  onClose: () => void;
  onReusePrompt: (generation: Generation) => void;
  onRetry: (generation: Generation) => void;
}

/** Full-size viewer with prompt/model metadata and the same actions as the card. */
export function ResultLightbox({ item, model, onClose, onReusePrompt, onRetry }: ResultLightboxProps) {
  const open = item !== null;
  const filename = item ? `higgsfield-${item.generation.id.slice(0, 8)}.png` : "";
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="grid max-w-6xl gap-0 overflow-hidden p-0 md:grid-cols-[1fr_320px]">
        {item ? (
          <>
            <div className="relative flex min-h-[40vh] items-center justify-center bg-black md:min-h-[70vh]">
              <Image
                src={item.asset.url}
                alt={item.generation.prompt}
                fill
                unoptimized={!item.asset.url.includes("res.cloudinary.com")}
                sizes="(max-width: 768px) 100vw, 70vw"
                className="object-contain"
                priority
              />
            </div>
            <aside className="flex flex-col gap-4 p-5">
              <div>
                <DialogTitle className="text-sm font-semibold text-text-secondary">Prompt</DialogTitle>
                <DialogDescription className="mt-1.5 max-h-40 overflow-y-auto text-sm leading-relaxed text-text-primary scrollbar-thin">
                  {item.generation.prompt}
                </DialogDescription>
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <dt className="text-text-secondary">Model</dt>
                <dd className="font-medium">{model?.name ?? item.generation.model_id}</dd>
                <dt className="text-text-secondary">Size</dt>
                <dd className="font-medium">
                  {item.asset.width} × {item.asset.height}
                </dd>
                <dt className="text-text-secondary">Aspect</dt>
                <dd className="font-medium">{item.generation.settings.aspect_ratio ?? "1:1"}</dd>
                <dt className="text-text-secondary">Created</dt>
                <dd className="font-medium">{new Date(item.generation.created_at).toLocaleString()}</dd>
              </dl>
              <div className="mt-auto flex flex-col gap-2">
                <Button asChild variant="white">
                  <a href={downloadUrl(item.asset.url, filename)} download={filename}>
                    <Download className="size-4" aria-hidden />
                    Download
                  </a>
                </Button>
                <Button variant="secondary" onClick={() => onReusePrompt(item.generation)}>
                  <RotateCcw className="size-4" aria-hidden />
                  Reuse prompt
                </Button>
                <Button onClick={() => onRetry(item.generation)}>
                  <RefreshCw className="size-4" aria-hidden />
                  Generate again
                </Button>
              </div>
            </aside>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
