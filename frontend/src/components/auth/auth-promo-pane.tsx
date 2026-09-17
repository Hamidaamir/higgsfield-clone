"use client";

import { Gem } from "lucide-react";
import { useEffect, useState } from "react";

import { Artwork, type ArtTheme } from "@/components/discovery/artwork";
import { cn } from "@/lib/utils";

interface Slide {
  label: string;
  title: string;
  subtitle: string;
  chip: string;
  /** Locally rendered artwork stands in for the editorial imagery in the reference. */
  theme: ArtTheme;
}

const slides: Slide[] = [
  {
    label: "Seedance 2.0 4K",
    title: "Seedance 2.0 4K",
    subtitle: "The most advanced AI video model, now in crisp 4K.",
    chip: "4K Video",
    theme: "cinematic",
  },
  {
    label: "Nano Banana Pro",
    title: "Nano Banana Pro 4K",
    subtitle: "The best image model, for the best price in the industry, only on Higgsfield.",
    chip: "4K Resolution",
    theme: "character",
  },
  {
    label: "Higgsfield Soul",
    title: "Higgsfield Soul 2.0",
    subtitle: "A culture-native photo model built for fashion, aesthetics and creative expression.",
    chip: "Photo",
    theme: "editorial",
  },
  {
    label: "Cinematic App",
    title: "Cinema Studio 4.0",
    subtitle: "Camera, lens and lighting control with an AI director on every shot.",
    chip: "Studio",
    theme: "tools",
  },
];

const SLIDE_INTERVAL_MS = 4500;

/** Left pane of the auth card: rotating model promo with progress bars (see reference/signup.png). */
export function AuthPromoPane({ className }: { className?: string }) {
  const [index, setIndex] = useState(1);

  useEffect(() => {
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  const slide = slides[index];

  return (
    <div className={cn("relative overflow-hidden bg-black", className)} aria-live="polite">
      {/* Only the active slide is mounted: four full artworks made the auth page slow to hydrate. */}
      <div key={slide.label} aria-hidden className="absolute inset-0 fade-in">
        <Artwork seed={`auth-${slide.label}`} theme={slide.theme} />
        <div className="grain absolute inset-0" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 p-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/15">
          <Gem className="size-3" aria-hidden />
          {slide.chip}
        </span>
        <h2 className="display-heading mt-3 text-3xl text-white sm:text-4xl">{slide.title}</h2>
        <p className="mt-2 max-w-md text-sm text-white/80">{slide.subtitle}</p>
        <div className="mt-6 grid grid-cols-4 gap-2">
          {slides.map((s, i) => (
            <button
              key={s.label}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show ${s.label}`}
              aria-current={i === index}
              className="group text-left"
            >
              <span className="block h-0.5 overflow-hidden rounded-full bg-white/25">
                <span
                  className={cn("block h-full bg-white transition-all", i === index ? "w-full duration-[4500ms] ease-linear" : "w-0 duration-300")}
                />
              </span>
              <span className={cn("mt-2 block truncate text-[11px]", i === index ? "font-semibold text-white" : "text-white/55")}>
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
