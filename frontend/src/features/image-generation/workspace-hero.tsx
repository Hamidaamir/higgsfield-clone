import Image from "next/image";

import { Artwork, type ArtTheme } from "@/components/discovery/artwork";
import { SHOWCASE } from "@/lib/config/explore";

/** Fanned film stills like the reference: one real FLUX output plus themed artwork, all shipped locally. */
const cards: { seed: string; theme: ArtTheme; rotate: string; offset: string }[] = [
  { seed: "soul-trumpet", theme: "cinematic", rotate: "-8deg", offset: "-30px" },
  { seed: "soul-party", theme: "editorial", rotate: "-3deg", offset: "-10px" },
  { seed: "soul-phone", theme: "character", rotate: "3deg", offset: "-10px" },
  { seed: "soul-laugh", theme: "scenic", rotate: "8deg", offset: "-30px" },
];

/** Empty-workspace hero from the reference: fanned photo cards + "START CREATING WITH …". */
export function WorkspaceHero() {
  return (
    <div className="flex flex-col items-center px-4 pt-6 text-center sm:pt-10">
      <div className="flex h-40 items-end justify-center sm:h-48" aria-hidden>
        {cards.map((card, i) => (
          <div
            key={card.seed}
            className="relative h-32 w-24 overflow-hidden rounded-2xl border border-white/20 shadow-card sm:h-40 sm:w-32"
            style={{ transform: `rotate(${card.rotate}) translateY(${card.offset})`, marginLeft: i === 0 ? 0 : "-14px" }}
          >
            {i === 2 ? <Image src={SHOWCASE.fluxLimeJacket.src} alt="" fill sizes="128px" className="object-cover" priority /> : <Artwork seed={card.seed} theme={card.theme} />}
            <div className="grain absolute inset-0" />
          </div>
        ))}
      </div>
      <h1 className="display-heading mt-8 text-3xl sm:text-5xl">
        Start creating with
        <br />
        <span className="text-accent">Higgsfield Soul Cinema</span>
      </h1>
      <p className="mt-4 max-w-2xl text-base text-text-secondary sm:text-lg">
        Describe a scene, character, mood, or style — and watch it come to life
      </p>
    </div>
  );
}
