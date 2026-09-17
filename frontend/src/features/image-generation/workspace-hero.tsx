"use client";

import Image from "next/image";
import { useState } from "react";

import { photoUrl } from "@/lib/photos";

/** Fanned film stills like the reference; each falls back to gradient art if the photo can't load. */
const cards = [
  { seed: "soul-trumpet", rotate: "-8deg", art: "radial-gradient(80% 80% at 30% 30%, #f6b26b 0%, #3b1f0e 70%)", offset: "-30px" },
  { seed: "soul-party", rotate: "-3deg", art: "radial-gradient(80% 80% at 60% 40%, #ff5a8a 0%, #2a0a1a 70%)", offset: "-10px" },
  { seed: "soul-phone", rotate: "3deg", art: "radial-gradient(80% 80% at 40% 60%, #9ad1ff 0%, #0b1d33 70%)", offset: "-10px" },
  { seed: "soul-laugh", rotate: "8deg", art: "radial-gradient(80% 80% at 50% 30%, #d6ff00 0%, #1c2405 70%)", offset: "-30px" },
];

/** Empty-workspace hero from the reference: fanned photo cards + "START CREATING WITH …". */
export function WorkspaceHero() {
  return (
    <div className="flex flex-col items-center px-4 pt-6 text-center sm:pt-10">
      <div className="flex h-40 items-end justify-center sm:h-48" aria-hidden>
        {cards.map((card, i) => (
          <HeroCard key={card.seed} {...card} first={i === 0} />
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

function HeroCard({ seed, rotate, art, offset, first }: (typeof cards)[number] & { first: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className="relative h-32 w-24 overflow-hidden rounded-2xl border border-white/20 shadow-card sm:h-40 sm:w-32"
      style={{
        backgroundImage: art,
        transform: `rotate(${rotate}) translateY(${offset})`,
        marginLeft: first ? 0 : "-14px",
      }}
    >
      {!failed ? (
        <Image src={photoUrl(seed, 256, 320)} alt="" fill unoptimized sizes="128px" className="object-cover" onError={() => setFailed(true)} />
      ) : null}
    </div>
  );
}
