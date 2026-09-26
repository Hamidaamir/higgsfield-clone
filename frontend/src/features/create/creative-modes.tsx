import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { studioItems } from "@/lib/config/navigation";

/** Short, Create-page phrasing for each workflow; the shell keeps its own terser wording. */
const BLURBS: Record<string, string> = {
  "/generate/image": "Generate still imagery from an idea.",
  "/generate/video": "Turn prompts and references into motion.",
  "/generate/audio": "Give words a voice.",
  "/edit/image": "Transform an image you already have.",
};

/**
 * The four real workflows as an editorial index — ruled rows rather than cards, so the
 * page reads like a contents page. Driven by `studioItems`, the same source the Studio
 * panel uses, so navigation never drifts between the two.
 */
export function CreativeModes() {
  return (
    <section id="creative-modes" aria-labelledby="creative-modes-heading" className="scroll-mt-20 border-t border-border-subtle py-12 sm:py-16">
      <h2 id="creative-modes-heading" className="editorial-label">
        Creative modes
      </h2>

      <ul className="mt-6 grid gap-x-12 border-t border-border-subtle sm:grid-cols-2">
        {studioItems.map((item, index) => (
          <li key={item.href} className="border-b border-border-subtle">
            <Link
              href={item.href}
              className="group flex items-center gap-5 py-6 transition-colors hover:bg-surface-subtle/60 sm:py-7"
            >
              <span className="editorial-label w-6 shrink-0 tabular-nums group-hover:text-accent-text">
                {String(index + 1).padStart(2, "0")}
              </span>
              <item.icon
                className="size-5 shrink-0 text-foreground-subtle transition-colors group-hover:text-accent-text"
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="editorial-display block text-2xl transition-colors group-hover:text-accent-text sm:text-[1.75rem]">
                  {item.label}
                </span>
                <span className="mt-1 block text-[13px] text-foreground-muted">
                  {BLURBS[item.href] ?? item.description}
                </span>
              </span>
              <ArrowRight
                className="size-4 shrink-0 text-foreground-subtle transition-transform duration-300 group-hover:translate-x-1 group-hover:text-accent-text"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
