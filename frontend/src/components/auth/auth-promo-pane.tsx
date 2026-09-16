"use client";

import { Gem } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface Slide {
  label: string;
  title: string;
  subtitle: string;
  chip: string;
  /** Layered gradients stand in for the editorial imagery in the reference. */
  art: string;
}

const slides: Slide[] = [
  {
    label: "Seedance 2.0 4K",
    title: "Seedance 2.0 4K",
    subtitle: "The most advanced AI video model, now in crisp 4K.",
    chip: "4K Video",
    art: "radial-gradient(120% 80% at 20% 10%, #ff2d8a 0%, transparent 55%), radial-gradient(90% 90% at 90% 90%, #3b1d64 0%, transparent 60%), linear-gradient(180deg, #1a1030 0%, #05050a 100%)",
  },
  {
    label: "Nano Banana Pro",
    title: "Nano Banana Pro 4K",
    subtitle: "The best image model, for the best price in the industry, only on Higgsfield.",
    chip: "4K Resolution",
    art: "radial-gradient(100% 70% at 70% 20%, #d6ff00 0%, transparent 50%), radial-gradient(80% 80% at 10% 90%, #1f5a3a 0%, transparent 60%), linear-gradient(180deg, #14170a 0%, #050605 100%)",
  },
  {
    label: "Higgsfield Soul",
    title: "Higgsfield Soul 2.0",
    subtitle: "A culture-native photo model built for fashion, aesthetics and creative expression.",
    chip: "Photo",
    art: "radial-gradient(90% 70% at 30% 30%, #ff8a3d 0%, transparent 55%), radial-gradient(90% 90% at 90% 80%, #7a1f3f 0%, transparent 60%), linear-gradient(180deg, #1c0f12 0%, #060405 100%)",
  },
  {
    label: "Cinematic App",
    title: "Cinema Studio 4.0",
    subtitle: "Camera, lens and lighting control with an AI director on every shot.",
    chip: "Studio",
    art: "radial-gradient(100% 80% at 80% 10%, #2f7cff 0%, transparent 55%), radial-gradient(80% 80% at 10% 90%, #0b2f4f 0%, transparent 60%), linear-gradient(180deg, #0a1220 0%, #04060a 100%)",
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
      {slides.map((s, i) => (
        <div
          key={s.label}
          aria-hidden
          className={cn("absolute inset-0 transition-opacity duration-700", i === index ? "opacity-100" : "opacity-0")}
          style={{ backgroundImage: s.art }}
        />
      ))}
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
