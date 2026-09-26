import { PrintFrame } from "@/components/editorial/print-frame";
import type { ArtTheme } from "@/components/discovery/artwork";
import type { ShowcaseMedia } from "@/components/discovery/media-card";

/** Local sample or explicitly labelled concept artwork; videos play only on request. */
export function CatalogPlate({ seed, theme, media, alt, ratio = "4 / 3", priority = false }: {
  seed: string; theme?: ArtTheme; media?: ShowcaseMedia; alt: string; ratio?: string; priority?: boolean;
}) {
  if (media?.kind === "video") return (
    <figure className="border border-border-subtle bg-surface-raised p-2">
      <video controls playsInline preload="metadata" src={media.src} poster={media.poster} aria-label={alt}
        className="w-full bg-black object-contain" style={{ aspectRatio: ratio }} />
    </figure>
  );
  return <PrintFrame src={media?.src} alt={alt} seed={seed} theme={theme} ratio={ratio} priority={priority}
    sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw" className="shadow-none" />;
}
