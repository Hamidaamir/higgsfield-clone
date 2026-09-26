import { PrintFrame } from "@/components/editorial/print-frame";
import { SHOWCASE } from "@/lib/config/explore";

/**
 * The left pane of the auth page. It replaces the old rotating promo, which advertised models
 * this build does not run. Everything here is either typography or media that actually ships
 * with the app, and the only claim made is the caption on the one real generation.
 */
export function AuthCreativePane() {
  return (
    <aside className="relative hidden overflow-hidden border-r border-border-subtle bg-surface lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-14">
      <div className="max-w-sm">
        <p className="editorial-label">Creative studio</p>
        <h2 className="editorial-display mt-5 text-[2.5rem] leading-[1.06] xl:text-5xl">
          Make something
          <br />
          worth <em className="editorial-emphasis">keeping.</em>
        </h2>
        <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-foreground-muted">
          Images, motion and speech in one workspace — with every result saved to your archive.
        </p>
      </div>

      <div className="relative mt-12 flex items-end gap-5" aria-hidden>
        <PrintFrame
          src={SHOWCASE.fluxLimeJacket.src}
          seed="auth-portrait"
          ratio="4 / 5"
          rotate={-2}
          sizes="(max-width: 1280px) 240px, 300px"
          caption="FLUX.1 Schnell · generated in this studio"
          className="w-[15rem] xl:w-[18rem]"
        />
        <PrintFrame
          seed="auth-scenic"
          theme="scenic"
          ratio="1 / 1"
          rotate={3}
          sizes="180px"
          className="mb-8 w-[9rem] xl:w-[11rem]"
        />
      </div>
    </aside>
  );
}

/**
 * Phone/tablet counterpart: a single small print above the form, so the creative identity is
 * present without pushing the fields below the fold.
 */
export function AuthCreativeStrip() {
  return (
    <div className="mb-8 flex items-center gap-4 lg:hidden">
      <PrintFrame
        src={SHOWCASE.fluxLimeJacket.src}
        seed="auth-portrait"
        ratio="1 / 1"
        sizes="88px"
        className="w-[5.5rem] shrink-0"
      />
      <p className="editorial-display text-[1.375rem] leading-tight">
        Make something worth <em className="editorial-emphasis">keeping.</em>
      </p>
    </div>
  );
}
