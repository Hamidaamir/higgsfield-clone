import { PrintFrame } from "@/components/editorial/print-frame";
import { HeroActions } from "@/features/create/hero-actions";
import { SHOWCASE } from "@/lib/config/explore";

/**
 * Editorial hero: copy on the left, a small composition of prints on the right — one real
 * FLUX output shipped with the app plus two locally rendered plates. Server-rendered except
 * for the action row, which needs the session.
 */
export function CreateHero() {
  return (
    <section className="grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-16 lg:py-24">
      <div className="max-w-xl">
        <p className="editorial-label">AI creative studio</p>
        <h1 className="editorial-display mt-5 text-[2.75rem] leading-[1.04] sm:text-6xl lg:text-[4.25rem]">
          Turn your ideas
          <br />
          into <em className="editorial-emphasis">reality.</em>
        </h1>
        <p className="mt-6 max-w-md text-[15px] leading-relaxed text-foreground-muted sm:text-base">
          Make still images, motion and speech in one focused workspace — then edit what you
          made without leaving it.
        </p>
        <HeroActions />
      </div>

      <HeroComposition />
    </section>
  );
}

/**
 * Three overlapping plates on desktop. On small screens the overlap is dropped for a simple
 * two-up row, because a scaled-down collage reads as clutter rather than composition.
 */
function HeroComposition() {
  return (
    <div className="relative" aria-hidden>
      {/* Mobile / tablet: two clean plates, no overlap. */}
      <div className="flex items-start justify-center gap-3 lg:hidden">
        <PrintFrame
          src={SHOWCASE.fluxLimeJacket.src}
          seed="create-hero-portrait"
          ratio="4 / 5"
          rotate={-2}
          priority
          sizes="45vw"
          className="w-[46%] max-w-[200px]"
        />
        <PrintFrame
          seed="create-hero-scenic"
          theme="scenic"
          ratio="4 / 5"
          rotate={2.5}
          sizes="45vw"
          className="mt-6 w-[46%] max-w-[200px]"
        />
      </div>

      {/* Desktop: a contact-sheet arrangement with controlled overlap. */}
      <div className="relative hidden h-[30rem] lg:block">
        <PrintFrame
          seed="create-hero-effects"
          theme="effects"
          ratio="5 / 4"
          rotate={-5}
          sizes="260px"
          className="absolute left-0 top-8 w-[16rem]"
        />
        <PrintFrame
          seed="create-hero-scenic"
          theme="scenic"
          ratio="4 / 5"
          rotate={4}
          sizes="220px"
          className="absolute right-0 top-0 w-[13rem]"
        />
        <PrintFrame
          src={SHOWCASE.fluxLimeJacket.src}
          seed="create-hero-portrait"
          ratio="4 / 5"
          rotate={1.5}
          priority
          sizes="320px"
          caption="FLUX.1 Schnell · generated in this studio"
          className="absolute bottom-0 right-10 w-[19rem]"
        />
      </div>
    </div>
  );
}
