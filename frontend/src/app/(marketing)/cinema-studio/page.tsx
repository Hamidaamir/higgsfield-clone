import type { Metadata } from "next";
import Link from "next/link";

import { ShotComposer } from "@/features/studios/shot-composer";

export const metadata: Metadata = { title: "Cinema Studio" };

export default function CinemaStudioPage() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border-subtle py-5">
        <div>
          <h1 className="editorial-label">Cinema Studio</h1>
          <p className="mt-1 text-[13px] text-foreground-muted">Build a shot before you generate it.</p>
        </div>
        <Link href="/generate/video" className="text-[13px] text-foreground-muted transition-colors hover:text-accent-text">
          Video Studio
        </Link>
      </header>
      <p className="max-w-2xl pt-6 text-[15px] leading-relaxed text-foreground-muted">
        A director’s vocabulary — lens, movement, light and grade — composed into one
        instruction. Cinema Studio writes the shot; Video Studio generates it.
      </p>
      <ShotComposer />
    </div>
  );
}
