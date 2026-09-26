import Link from "next/link";

/**
 * Empty workspace: a restrained editorial statement with an aspect-ratio frame study, kept
 * short so the composer below stays the focus. No sample results are shown — nothing here
 * pretends to be the viewer's work.
 */
export function WorkspaceEmptyState() {
  return (
    <div className="flex flex-col items-start gap-10 py-10 lg:flex-row lg:items-center lg:justify-between lg:py-16">
      <div className="max-w-md">
        <h2 className="editorial-display text-4xl sm:text-5xl">What will you make?</h2>
        <p className="mt-4 text-[15px] leading-relaxed text-foreground-muted">
          Describe an image in the composer below and pick a model. Every result is kept in your
          archive, so you can revisit or rerun it later.
        </p>
        <p className="mt-6 text-[13px] text-foreground-muted">
          Starting from a picture you already have?{" "}
          <Link
            href="/edit/image"
            className="border-b border-accent/40 pb-px text-accent-text transition-colors hover:border-accent"
          >
            Edit &amp; Enhance
          </Link>
        </p>
      </div>

      {/* Frame study: the aspect ratios the studio can produce, drawn as empty plates. */}
      <div className="flex items-end gap-3" aria-hidden>
        {[
          { ratio: "1 / 1", label: "1:1", w: "w-24 sm:w-28" },
          { ratio: "16 / 9", label: "16:9", w: "w-32 sm:w-40" },
          { ratio: "9 / 16", label: "9:16", w: "w-16 sm:w-20" },
        ].map((frame) => (
          <span key={frame.label} className="flex flex-col items-center gap-2">
            <span
              className={`block border border-border-default bg-surface ${frame.w}`}
              style={{ aspectRatio: frame.ratio }}
            />
            <span className="editorial-label">{frame.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
