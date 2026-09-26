import { AudioLines, Image as ImageIcon, Type, Video } from "lucide-react";
import Link from "next/link";

const STEPS = [
  { id: "prompt", label: "Prompt", sub: "Describe the idea", icon: Type, href: "/generate/image" },
  { id: "image", label: "Image", sub: "FLUX.1 Schnell", icon: ImageIcon, href: "/generate/image" },
  { id: "video", label: "Video", sub: "LTX Video, image to video", icon: Video, href: "/generate/video" },
  { id: "audio", label: "Voice-over", sub: "Aura 1", icon: AudioLines, href: "/generate/audio" },
];

/**
 * A printed diagram of the chain a canvas would hold, not a canvas. Nothing here can be
 * dragged, connected, zoomed or saved — each step is simply a link to the workspace that
 * really performs it, which is also why it is laid out as a sequence rather than a board.
 */
export function CanvasDiagram() {
  return (
    <section className="mt-12" aria-labelledby="chain-heading">
      <h2 id="chain-heading" className="editorial-display text-3xl">
        The chain, drawn
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground-muted">
        An illustration of one workflow, not an editable canvas. Each step below opens the
        workspace that does that job today.
      </p>
      <ol className="mt-8 grid gap-x-6 gap-y-0 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <li key={step.id} className="border-t border-border-default py-6">
            <p className="editorial-label text-foreground-subtle">Step {index + 1}</p>
            <h3 className="editorial-display mt-2 flex items-center gap-2 text-2xl">
              <step.icon className="size-4 text-foreground-subtle" aria-hidden />
              {step.label}
            </h3>
            <p className="mt-2 text-sm text-foreground-muted">{step.sub}</p>
            <Link
              href={step.href}
              className="mt-3 inline-flex min-h-10 items-center text-sm text-accent-text underline underline-offset-4"
            >
              Open this step ↗
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
