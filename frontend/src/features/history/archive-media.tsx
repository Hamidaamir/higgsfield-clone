"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Waveform } from "@/components/generation/waveform";
import { useAsset } from "@/hooks/use-asset";
import { DOWNLOAD_PREFIX, aspectRatioStyle, downloadUrl, ratioToStyle } from "@/lib/media";
import type { Asset, Generation } from "@/types/generation";

export interface ArchiveMediaProps {
  generation: Generation;
  onOpen: (generation: Generation, assetIndex: number) => void;
}

const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus";

/** Small, always-visible actions shared across plates and takes. */
function AssetActions({ generation, asset, index, onOpen }: ArchiveMediaProps & { asset: Asset; index: number }) {
  const filename = `${DOWNLOAD_PREFIX}-${generation.id.slice(0, 8)}-${index + 1}`;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-foreground-muted">
      <button type="button" className={`${focus} min-h-8 hover:text-accent-text`} onClick={() => onOpen(generation, index)} aria-label={`Details for output ${index + 1}: ${generation.prompt}`}>Details</button>
      <a className={`${focus} inline-flex min-h-8 items-center hover:text-accent-text`} href={downloadUrl(asset.url, filename)} download={filename} aria-label={`Download output ${index + 1}: ${generation.prompt}`}>Download</a>
      <a className={`${focus} inline-flex min-h-8 items-center hover:text-accent-text`} href={asset.url} target="_blank" rel="noreferrer" aria-label={`Open original output ${index + 1}: ${generation.prompt}`}>Original ↗</a>
    </div>
  );
}

function ArchiveImage({ asset, alt }: { asset: Asset; alt: string }) {
  const [unavailable, setUnavailable] = useState(false);
  const src = asset.thumbnail_url ?? asset.url;
  return unavailable ? (
    <span className="absolute inset-0 flex items-center justify-center p-4 text-sm text-foreground-muted">Image preview unavailable.</span>
  ) : (
    <Image src={src} alt={alt} fill sizes="(max-width: 640px) 90vw, (max-width: 1024px) 60vw, 35vw" unoptimized={!src.includes("res.cloudinary.com")} className="object-contain" onError={() => setUnavailable(true)} />
  );
}

export function ArchiveImages({ generation, onOpen }: ArchiveMediaProps) {
  return (
    <div className={generation.assets.length > 1 ? "grid grid-cols-2 items-start gap-3 sm:gap-4" : "max-w-[28rem]"}>
      {generation.assets.map((asset, index) => (
        <figure key={asset.id} className="min-w-0">
          <button type="button" onClick={() => onOpen(generation, index)} aria-label={`Open image ${index + 1}: ${generation.prompt}`} className={`${focus} relative block w-full overflow-hidden border border-border-subtle bg-surface-subtle`} style={asset.width && asset.height ? aspectRatioStyle(asset.width, asset.height) : ratioToStyle(generation.settings.aspect_ratio ?? "1:1")}>
            <ArchiveImage asset={asset} alt={`${generation.prompt} — output ${index + 1}`} />
          </button>
          {generation.assets.length > 1 ? <figcaption className="editorial-label mt-2 text-foreground-muted">Plate {String(index + 1).padStart(2, "0")}</figcaption> : null}
          <AssetActions generation={generation} asset={asset} index={index} onOpen={onOpen} />
        </figure>
      ))}
    </div>
  );
}

export function ArchiveVideos({ generation, onOpen }: ArchiveMediaProps) {
  return (
    <div className="space-y-5">
      {generation.assets.map((asset, index) => (
        <figure key={asset.id} className={(asset.height ?? 0) > (asset.width ?? 0) || generation.settings.aspect_ratio === "9:16" ? "max-w-[21rem]" : "max-w-[48rem]"}>
          {/* Archive loads only the poster. Playback and the video request start in Details. */}
          <button type="button" onClick={() => onOpen(generation, index)} aria-label={`Open video ${index + 1}: ${generation.prompt}`} className={`${focus} relative block w-full overflow-hidden border border-border-subtle bg-surface-subtle`} style={asset.width && asset.height ? aspectRatioStyle(asset.width, asset.height) : ratioToStyle(generation.settings.aspect_ratio ?? "16:9")}>
            {asset.thumbnail_url ? <ArchiveImage asset={{ ...asset, url: asset.thumbnail_url }} alt={`Video poster: ${generation.prompt}`} /> : <span className="absolute inset-0 flex items-end p-4 text-xs text-foreground-muted">Poster unavailable · Open to play</span>}
            <span className="absolute inset-0 flex items-center justify-center"><span className="flex size-12 items-center justify-center rounded-full border border-white/50 bg-black/50 text-white"><Play className="size-5" aria-hidden /></span></span>
          </button>
          <AssetActions generation={generation} asset={asset} index={index} onOpen={onOpen} />
        </figure>
      ))}
    </div>
  );
}

export function ArchiveAudio({ generation, onOpen }: ArchiveMediaProps) {
  return (
    <div className="max-w-[48rem] space-y-3">
      {generation.assets.map((asset, index) => (
        <figure key={asset.id} className="min-w-0 border-y border-border-subtle bg-surface px-3 py-3 sm:px-5">
          <figcaption className="flex items-center justify-between gap-3 editorial-label text-foreground-muted">
            <span>Take {String(index + 1).padStart(2, "0")}</span>
            {asset.duration_ms !== null ? <span>{(asset.duration_ms / 1000).toFixed(1)}s</span> : null}
          </figcaption>
          {/* Decorative studio motif, not a measurement of the audio. */}
          <div className="my-3 h-8" aria-hidden><Waveform seed={asset.id} bars={48} /></div>
          <audio src={asset.url} controls preload="metadata" aria-label={`Take ${index + 1} of ${generation.assets.length}: ${generation.prompt}`} className="h-9 w-full min-w-0" />
          <AssetActions generation={generation} asset={asset} index={index} onOpen={onOpen} />
        </figure>
      ))}
    </div>
  );
}

export function ArchiveEdit({ generation, onOpen, children }: ArchiveMediaProps & { children?: React.ReactNode }) {
  // Keep the existing ownership-enforcing API and infinite-stale cache.
  const reference = useAsset(generation.settings.reference_asset_id);
  return (
    <div className="grid items-start gap-5 sm:grid-cols-2" aria-label="Before and after edit">
      <figure className="min-w-0">
        <figcaption className="editorial-label mb-3 text-foreground-muted">Before</figcaption>
        <div className="relative flex min-h-48 items-center justify-center border border-border-subtle bg-surface-subtle" style={reference.data ? aspectRatioStyle(reference.data.width, reference.data.height) : ratioToStyle(generation.settings.aspect_ratio ?? "1:1")}>
          {reference.data ? <ArchiveImage asset={reference.data} alt={`Before the edit: ${generation.prompt}`} /> : reference.isError ? <p className="p-5 text-sm text-foreground-muted">The original image is no longer available.</p> : <p role="status" className="p-5 text-sm text-foreground-muted">Loading the original image…</p>}
        </div>
      </figure>
      <div className="min-w-0" role="group" aria-label="After">
        <p className="editorial-label mb-3 text-foreground-muted">After <span aria-hidden>↗</span></p>
        {children ?? <ArchiveImages generation={generation} onOpen={onOpen} />}
      </div>
    </div>
  );
}
