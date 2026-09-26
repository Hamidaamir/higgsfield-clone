import type { Metadata } from "next";
import Link from "next/link";

import { ConceptPage } from "@/components/discovery/concept-page";

export const metadata: Metadata = { title: "Academy" };

/** Each lesson is an outline that opens the tool it describes — the links are real. */
const LESSONS = [
  { title: "Prompting for photoreal stills", text: "What a model reads as detail, and what it ignores.", href: "/generate/image", cta: "Image Studio" },
  { title: "Making motion feel natural", text: "Why a still becomes a believable clip, or does not.", href: "/generate/video", cta: "Video Studio" },
  { title: "Directing a shot", text: "Lens, movement, light and grade as one instruction.", href: "/cinema-studio", cta: "Cinema Studio" },
  { title: "Voice that does not sound synthetic", text: "Script, pacing and voice choice as one decision.", href: "/generate/audio", cta: "Audio Studio" },
  { title: "Effects presets, explained", text: "What each preset actually writes into the prompt.", href: "/effects", cta: "Effects" },
  { title: "Editing with an instruction", text: "Describing a change instead of masking it.", href: "/edit/image", cta: "Edit & Enhance" },
];

export default function AcademyPage() {
  return (
    <ConceptPage
      eyebrow="Concept / Learn"
      title="Academy"
      description="Short, practical lessons on prompting, motion, directing and voice — each one ending inside the tool it teaches."
      note="Preview only. There is no course player, enrolment, progress, certificate or student record in this build. The lessons below are topic outlines; every link opens a workspace that genuinely works."
      seed="academy"
      primary={{ label: "Start in Image Studio", href: "/generate/image" }}
      secondary={{ label: "Browse the catalogs", href: "/image" }}
    >
      <section className="mt-12" aria-labelledby="lessons-heading">
        <h2 id="lessons-heading" className="editorial-display text-3xl">
          Lessons
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground-muted">
          Outlines, not recordings. Each one names where the work actually happens.
        </p>
        <div className="mt-8 grid gap-x-10 sm:grid-cols-2">
          {LESSONS.map((lesson) => (
            <article key={lesson.title} className="border-t border-border-default py-6">
              <h3 className="editorial-display text-2xl">{lesson.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{lesson.text}</p>
              <Link
                href={lesson.href}
                className="mt-3 inline-flex min-h-10 items-center text-sm text-accent-text underline underline-offset-4"
              >
                Open {lesson.cta} ↗
              </Link>
            </article>
          ))}
        </div>
      </section>
    </ConceptPage>
  );
}
