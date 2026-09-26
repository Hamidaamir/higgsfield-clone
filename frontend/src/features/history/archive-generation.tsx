"use client";

import { FailedAnnotation, PendingPlate, PendingRow, type GroupActions } from "@/components/generation/generation-group-frame";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import type { ModelSpec } from "@/types/generation";

import { ArchiveAudio, ArchiveEdit, ArchiveImages, ArchiveVideos, type ArchiveMediaProps } from "./archive-media";

/** A chronological record: one prompt, one metadata column, one family of outputs. */
export function ArchiveGeneration({ generation: g, model, onOpen, onReusePrompt, onRetry, retrying }: ArchiveMediaProps & GroupActions & { model: ModelSpec | undefined }) {
  const edit = g.type === "image" && Boolean(g.settings.reference_asset_id);
  const pending = g.status === "queued" || g.status === "processing";
  const failed = g.status === "failed" || (g.status === "completed" && !g.assets.length);
  const kind = edit ? "Image edit" : { image: "Image", video: "Video", audio: "Audio" }[g.type];
  const voice = model?.voices.find((v) => v.id === g.settings.voice)?.name ?? g.settings.voice;
  const language = model?.languages.find((l) => l.code === g.settings.language)?.name ?? g.settings.language;
  const count = g.assets.length || g.settings.batch_size || 1;
  const meta = g.type === "audio" ? [voice, language, `${count} ${count === 1 ? "take" : "takes"}`] : [g.settings.aspect_ratio, g.settings.duration_s ? `${g.settings.duration_s}s` : undefined, count > 1 ? `${count} outputs` : undefined];
  const actions = { onReusePrompt, onRetry, retrying };
  const media = { generation: g, onOpen };
  const state = failed ? <FailedAnnotation generation={g} {...actions} /> : pending ? (
    g.type === "audio" ? <PendingRow generation={g} model={model} /> : <div className="max-w-[28rem]"><PendingPlate generation={g} model={model} ratio={g.settings.aspect_ratio ?? (g.type === "video" ? "16:9" : "1:1")} /></div>
  ) : g.status === "cancelled" ? <p role="status" className="border-y border-border-subtle py-6 text-sm text-foreground-muted">Generation cancelled.</p> : null;

  return (
    <article aria-label={`${model?.name ?? g.model_id}: ${g.prompt}`} data-generation-id={g.id} data-media-kind={edit ? "edit" : g.type} className="grid min-w-0 gap-5 border-t border-border-subtle py-7 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] md:gap-10 lg:gap-16">
      <header className="min-w-0">
        <p className="editorial-label text-accent-text">{kind}</p>
        <h3 className="mt-3 text-[15px] font-medium leading-relaxed text-foreground [overflow-wrap:anywhere]">
          <button type="button" onClick={() => onOpen(g, 0)} aria-label={`Open details: ${g.prompt}`} className="line-clamp-4 text-left hover:text-accent-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus" title={g.prompt}>{g.prompt}</button>
        </h3>
        <p className="mt-3 break-words text-xs text-foreground-muted">{model?.name ?? g.model_id}</p>
        <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-foreground-muted" aria-label="Generation settings">
          {meta.filter(Boolean).map((value, i) => <li key={i}>{value}</li>)}
        </ul>
        {g.type === "audio" && g.settings.style_prompt ? <p className="mt-2 line-clamp-2 text-xs text-foreground-muted [overflow-wrap:anywhere]" title={g.settings.style_prompt}>Style: {g.settings.style_prompt}</p> : null}
        <time dateTime={g.created_at} className="mt-3 block text-[11px] text-foreground-muted">{formatDateTime(g.created_at)}</time>
        {!pending ? <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="rounded-none" onClick={() => onReusePrompt(g)} aria-label={`Reuse prompt: ${g.prompt}`}>Reuse</Button>
          {!failed ? <Button size="sm" variant="ghost" className="rounded-none" onClick={() => onRetry(g)} disabled={retrying} aria-label={`Generate again: ${g.prompt}`}>Generate again</Button> : null}
        </div> : null}
      </header>
      <div className="min-w-0 [&_.text-foreground-subtle]:text-foreground-muted">
        {edit ? <ArchiveEdit {...media}>{state}</ArchiveEdit> : state ?? (g.type === "audio" ? <ArchiveAudio {...media} /> : g.type === "video" ? <ArchiveVideos {...media} /> : <ArchiveImages {...media} />)}
      </div>
    </article>
  );
}
