import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { PrintFrame } from "@/components/editorial/print-frame";
import { Button } from "@/components/ui/button";
import { COMMUNITY_POSTS } from "@/lib/config/community";
import { ContactSheet, Section } from "@/features/create/section";

/** A restrained selection from the curated showcase — never presented as the visitor's own work. */
const PIECES = COMMUNITY_POSTS.slice(0, 4);

/**
 * What anonymous visitors see in place of Recent Creations: four curated pieces, each
 * labelled with the model behind it, plus a single sign-up action. All media is local.
 */
export function StudioShowcase() {
  return (
    <Section
      title="From the studio"
      action={
        <Link
          href="/community"
          className="group inline-flex items-center gap-1.5 text-[13px] text-foreground-muted transition-colors hover:text-accent-text"
        >
          See more
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      }
    >
      <ContactSheet>
        {PIECES.map((post) => (
          <Link
            key={post.slug}
            href="/community"
            className="group min-w-0"
          >
            <PrintFrame
              src={post.media?.kind === "image" ? post.media.src : undefined}
              alt={post.title}
              seed={post.seed}
              theme={post.theme}
              ratio="4 / 5"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
              className="transition-transform duration-500 group-hover:-translate-y-1"
            />
            <p className="mt-2.5 truncate text-[13px] text-foreground">{post.title}</p>
            {/* Only claim a real output when the real asset is what is actually on screen;
                video pieces fall back to a rendered plate, so they say what they are. */}
            <p className="mt-0.5 truncate text-[11px] text-foreground-subtle">
              {post.model}
              {post.media?.kind === "image" ? " · real output" : " · concept artwork"}
            </p>
          </Link>
        ))}
      </ContactSheet>

      <div className="mt-10 flex flex-col items-start gap-4 border-t border-border-subtle pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md text-sm text-foreground-muted">
          Create an account to start making your own — everything you generate is saved to your archive.
        </p>
        <Button asChild size="lg" className="shrink-0 rounded-none shadow-none">
          <Link href="/signup?next=%2F">
            Start creating
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </Section>
  );
}
