"use client";

import { Image as ImageIcon, Loader2, Music, Upload, Video, X } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";

import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ReferenceDropzoneProps {
  previewUrl: string | null;
  uploading: boolean;
  error: string | null;
  onSelect: (file: File) => void;
  onClear: () => void;
  disabled?: boolean;
  /** Chip on the preview and empty-state title; defaults to the video workspace wording. */
  purpose?: string;
  title?: string;
  /** `editorial` is the redesigned workspace styling; `default` keeps the pre-redesign look. */
  variant?: "default" | "editorial";
}

/** "Add references" panel from the video reference. Only images are accepted today. */
export function ReferenceDropzone({
  previewUrl,
  uploading,
  error,
  onSelect,
  onClear,
  disabled,
  purpose = "Image to video",
  title = "Add references",
  variant = "default",
}: ReferenceDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const editorial = variant === "editorial";

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file && !disabled) onSelect(file);
  };

  if (previewUrl) {
    if (editorial) {
      return (
        <div>
          <div className="relative overflow-hidden border border-border-default bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
            <img src={previewUrl} alt="Reference image" className="h-40 w-full object-cover" />
            {uploading ? (
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-overlay text-sm font-medium text-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Uploading
              </div>
            ) : null}
          </div>
          {/* Replace and remove stay visible rather than appearing on hover. */}
          <div className="mt-1.5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => !disabled && inputRef.current?.click()}
              disabled={disabled}
              className="text-[13px] text-foreground-muted underline-offset-4 transition-colors hover:text-foreground hover:underline disabled:opacity-50"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={onClear}
              className="text-[13px] text-foreground-muted underline-offset-4 transition-colors hover:text-danger hover:underline"
            >
              Remove
            </button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            aria-label="Upload reference image"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onSelect(file);
              e.target.value = "";
            }}
          />
          {error ? (
            <p role="alert" className="mt-2 text-xs text-danger">
              {error}
            </p>
          ) : null}
        </div>
      );
    }
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
        <img src={previewUrl} alt="Reference image" className="h-36 w-full object-cover" />
        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 text-sm font-semibold">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Uploading
          </div>
        ) : (
          <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            {purpose}
          </span>
        )}
        <button
          type="button"
          onClick={onClear}
          aria-label="Remove reference image"
          className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-black"
        >
          <X className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        aria-label="Add a reference image"
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-2 px-4 py-6 text-center transition-colors",
          editorial ? "border border-dashed" : "rounded-2xl border border-dashed",
          dragging
            ? "border-accent bg-accent-subtle"
            : editorial
              ? "border-border-strong bg-surface hover:border-accent"
              : "border-border-strong bg-surface hover:border-text-muted",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <div className={cn("flex items-center gap-1.5", editorial && "hidden")}>
          <span className="flex size-8 items-center justify-center rounded-lg bg-surface-muted text-text-primary">
            <ImageIcon className="size-4" aria-hidden />
          </span>
          <Tooltip content="Video references arrive with Edit Video">
            <span className="flex size-8 items-center justify-center rounded-lg bg-surface-muted text-text-muted">
              <Video className="size-4" aria-hidden />
            </span>
          </Tooltip>
          <Tooltip content="Audio references arrive with Edit Video">
            <span className="flex size-8 items-center justify-center rounded-lg bg-surface-muted text-text-muted">
              <Music className="size-4" aria-hidden />
            </span>
          </Tooltip>
        </div>
        {editorial ? <Upload className="size-5 text-foreground-subtle" aria-hidden /> : null}
        <p className={cn(editorial ? "text-[13px] font-medium text-foreground" : "text-sm font-semibold")}>{title}</p>
        <p className={cn("text-xs", editorial ? "text-foreground-muted" : "text-text-secondary")}>
          Drop an image or choose a file
        </p>
        <p className={cn("text-[11px]", editorial ? "text-foreground-subtle" : "text-text-muted")}>
          PNG, JPEG or WebP, up to 10 MB
        </p>
        {editorial ? null : (
          <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-text-muted">
            <Upload className="size-3.5" aria-hidden />
            Drop a file or click to browse
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        aria-label="Upload reference image"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
          e.target.value = "";
        }}
      />
      {error ? (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
