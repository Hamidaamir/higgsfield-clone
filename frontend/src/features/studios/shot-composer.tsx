"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { composerHref } from "@/lib/generation-links";
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

const SCENE_MAX_LENGTH = 400;

/**
 * Cinema Studio's control deck. It composes one director-grade sentence and hands it to the
 * video generator through the shared link helper — nothing here calls a provider.
 */
export function ShotComposer() {
  const [scene, setScene] = useState("A lone figure walks through an empty subway station at night");
  const [camera, setCamera] = useState(CAMERAS[1].id);
  const [movement, setMovement] = useState(MOVEMENTS[1].id);
  const [lighting, setLighting] = useState(LIGHTING[1].id);
  const [grade, setGrade] = useState(GRADES[0].id);

  const trimmed = scene.trim();
  const prompt = useMemo(() => {
    const pick = (list: Option[], id: string) => list.find((o) => o.id === id)?.phrase ?? "";
    return [
      scene.trim(),
      pick(CAMERAS, camera),
      pick(MOVEMENTS, movement),
      pick(LIGHTING, lighting),
      pick(GRADES, grade),
      "cinematic",
    ]
      .filter(Boolean)
      .join(", ");
  }, [scene, camera, movement, lighting, grade]);

  const href = composerHref({ type: "video", prompt, model: "ltx-video", aspect: "16:9" });

  return (
    <div className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
      <section aria-label="Shot direction">
        <h2 className="editorial-label border-b border-border-subtle pb-3">Direction</h2>

        <div className="mt-6">
          <label htmlFor="cinema-scene" className="editorial-label">
            Scene
          </label>
          <textarea
            id="cinema-scene"
            value={scene}
            onChange={(e) => setScene(e.target.value)}
            rows={3}
            maxLength={SCENE_MAX_LENGTH}
            placeholder="Describe what happens in the shot"
            aria-invalid={trimmed.length === 0 || undefined}
            className="mt-2.5 min-h-20 w-full resize-none border border-border-default bg-surface-raised px-3 py-2 text-[13px] leading-relaxed text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25 placeholder:text-foreground-subtle"
          />
        </div>

        <Deck label="Camera & lens" options={CAMERAS} value={camera} onChange={setCamera} />
        <Deck label="Movement" options={MOVEMENTS} value={movement} onChange={setMovement} />
        <Deck label="Lighting" options={LIGHTING} value={lighting} onChange={setLighting} />
        <Deck label="Colour grade" options={GRADES} value={grade} onChange={setGrade} />
      </section>

      <section aria-label="Shot treatment" className="lg:sticky lg:top-20 lg:self-start">
        <h2 className="editorial-label border-b border-border-subtle pb-3">Shot treatment</h2>

        {/* The composed sentence itself is the output of this page — shown in full, because it
            is exactly what the video generator will receive. */}
        <p className="mt-6 border-l-2 border-accent bg-surface-subtle py-4 pl-4 pr-3 text-[15px] leading-relaxed text-foreground">
          {trimmed ? prompt : "Describe the scene to compose a shot."}
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-border-subtle pt-4 text-[13px]">
          <div>
            <dt className="editorial-label text-foreground-subtle">Generates in</dt>
            <dd className="mt-1 text-foreground">Video Studio · LTX Video</dd>
          </div>
          <div>
            <dt className="editorial-label text-foreground-subtle">Aspect</dt>
            <dd className="mt-1 text-foreground">16:9</dd>
          </div>
        </dl>

        <p className="mt-6 text-[13px] leading-relaxed text-foreground-muted">
          Cinema Studio writes the direction; it does not generate. The button below opens Video
          Studio with this prompt already filled in, and the clip is made — and saved to your
          archive — there.
        </p>

        {trimmed ? (
          <Button asChild size="lg" className="mt-6 rounded-none shadow-none">
            <Link href={href}>Open in Video Studio</Link>
          </Button>
        ) : (
          // A disabled anchor is not a thing, so the link is replaced rather than styled off.
          <Button size="lg" disabled className="mt-6 rounded-none shadow-none">
            Open in Video Studio
          </Button>
        )}
      </section>
    </div>
  );
}

function Deck({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <fieldset className="mt-6 border-t border-border-subtle pt-4">
      <legend className="editorial-label">{label}</legend>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={option.id === value}
            className={cn(
              "min-h-9 border px-3 text-[13px] transition-colors",
              option.id === value
                ? "border-accent-text bg-accent-subtle text-accent-text"
                : "border-border-default text-foreground-muted hover:bg-surface-subtle hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
