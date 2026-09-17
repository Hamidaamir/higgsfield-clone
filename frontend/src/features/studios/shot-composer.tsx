"use client";

import { ArrowRight, Clapperboard } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Artwork } from "@/components/discovery/artwork";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Option {
  id: string;
  label: string;
  phrase: string;
}

const CAMERAS: Option[] = [
  { id: "wide", label: "Wide 24mm", phrase: "wide 24mm lens" },
  { id: "standard", label: "Standard 50mm", phrase: "50mm lens" },
  { id: "tele", label: "Telephoto 85mm", phrase: "85mm telephoto, compressed background" },
  { id: "anamorphic", label: "Anamorphic", phrase: "anamorphic lens, oval bokeh, horizontal flares" },
];
const MOVEMENTS: Option[] = [
  { id: "static", label: "Static", phrase: "locked-off static camera" },
  { id: "dolly", label: "Dolly in", phrase: "slow dolly in" },
  { id: "orbit", label: "Orbit", phrase: "camera slowly orbits the subject" },
  { id: "handheld", label: "Handheld", phrase: "handheld documentary camera" },
  { id: "crane", label: "Crane up", phrase: "crane shot rising up" },
];
const LIGHTING: Option[] = [
  { id: "golden", label: "Golden hour", phrase: "golden hour sunlight" },
  { id: "neon", label: "Neon night", phrase: "neon-lit night, wet streets" },
  { id: "noir", label: "Noir", phrase: "hard chiaroscuro lighting, deep shadows" },
  { id: "overcast", label: "Soft overcast", phrase: "soft overcast daylight" },
  { id: "studio", label: "Studio", phrase: "clean three-point studio lighting" },
];
const GRADES: Option[] = [
  { id: "teal", label: "Teal & orange", phrase: "teal and orange color grade" },
  { id: "film", label: "35mm film", phrase: "35mm film grain, muted colors" },
  { id: "bw", label: "Black & white", phrase: "black and white" },
  { id: "pastel", label: "Pastel", phrase: "pastel color palette" },
];

/** Cinema Studio's control deck: composes a director-grade prompt and hands it to the real video generator. */
export function ShotComposer() {
  const [scene, setScene] = useState("A lone figure walks through an empty subway station at night");
  const [camera, setCamera] = useState(CAMERAS[1].id);
  const [movement, setMovement] = useState(MOVEMENTS[1].id);
  const [lighting, setLighting] = useState(LIGHTING[1].id);
  const [grade, setGrade] = useState(GRADES[0].id);

  const prompt = useMemo(() => {
    const pick = (list: Option[], id: string) => list.find((o) => o.id === id)?.phrase ?? "";
    return [scene.trim(), pick(CAMERAS, camera), pick(MOVEMENTS, movement), pick(LIGHTING, lighting), pick(GRADES, grade), "cinematic"].filter(Boolean).join(", ");
  }, [scene, camera, movement, lighting, grade]);

  const href = `/generate/video?${new URLSearchParams({ prompt, model: "ltx-video", aspect: "16:9" })}`;

  return (
    <section className="mt-12 grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]" aria-label="Shot composer">
      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-4">
        <label className="block">
          <span className="text-xs font-medium text-text-secondary">Scene</span>
          <Textarea value={scene} onChange={(e) => setScene(e.target.value)} className="mt-1.5 min-h-20" maxLength={400} />
        </label>
        <Deck label="Camera & lens" options={CAMERAS} value={camera} onChange={setCamera} />
        <Deck label="Movement" options={MOVEMENTS} value={movement} onChange={setMovement} />
        <Deck label="Lighting" options={LIGHTING} value={lighting} onChange={setLighting} />
        <Deck label="Color grade" options={GRADES} value={grade} onChange={setGrade} />
      </div>
      <div className="flex flex-col rounded-3xl border border-border bg-surface p-4 sm:p-6">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Clapperboard className="size-4 text-accent" aria-hidden />
          Shot 01 · Director prompt
        </div>
        {/* Storyboard frame: the look changes with lighting/grade/camera so the deck feels live. It is a
            composition sketch, not a render — the real clip comes from LTX Video after "Generate this shot". */}
        <div className="relative mt-4 flex-1 overflow-hidden rounded-2xl border border-border bg-surface-elevated" style={{ minHeight: 220 }}>
          <Artwork seed={`shot-${camera}-${movement}-${lighting}-${grade}`} theme={lighting === "studio" ? "advertising" : grade === "bw" ? "editorial" : "cinematic"} />
          <div className="grain absolute inset-0" aria-hidden />
          <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">Storyboard sketch</span>
          <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">16:9 · LTX Video</span>
        </div>
        <p className="mt-3 rounded-2xl border border-border bg-surface-elevated p-4 text-[15px] leading-relaxed">{prompt}</p>
        <p className="mt-3 text-xs text-text-secondary">
          Cinema Studio composes the shot; generation runs through the same LTX Video workflow as Create Video, so the clip lands in your History.
        </p>
        <div className="mt-4">
          <Button asChild size="lg" className="shadow-accent" disabled={!scene.trim()}>
            <Link href={href}>
              Generate this shot
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Deck({ label, options, value, onChange }: { label: string; options: Option[]; value: string; onChange: (id: string) => void }) {
  return (
    <fieldset>
      <legend className="text-xs font-medium text-text-secondary">{label}</legend>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={option.id === value}
            className={cn(
              "h-8 rounded-lg border px-2.5 text-[13px] font-semibold",
              option.id === value ? "border-accent bg-accent-muted text-accent" : "border-border bg-surface-elevated text-text-primary hover:bg-surface-muted",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
