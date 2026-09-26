import type { Metadata } from "next";
import Link from "next/link";
import { CommunityGallery } from "@/features/community/community-gallery";

export const metadata: Metadata = { title: "Explore" };
export default function CommunityPage() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-8 sm:py-12">
      <p className="editorial-label text-accent-text">04 / Discovery</p>
      <h1 className="editorial-display mt-3 text-5xl sm:text-6xl">Explore</h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-foreground-muted">Discover ideas, models and creative directions. A curated selection of studio samples and concept artwork, with prompts to make your own.</p>
      <nav aria-label="Discovery catalogs" className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm">
        {['Image', 'Video', 'Audio'].map((label) => <Link key={label} href={`/${label.toLowerCase()}`} className="py-2 underline decoration-border-default underline-offset-4 hover:text-accent-text">{label} catalog ↗</Link>)}
      </nav>
      <CommunityGallery />
    </div>
  );
}
