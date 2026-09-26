"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { CatalogPlate } from "@/components/discovery/catalog-plate";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { COMMUNITY_POSTS, communityRecreateHref } from "@/lib/config/community";

type Filter = "all" | "image" | "video";
export function CommunityGallery() {
  const [filter, setFilter] = useState<Filter>("all");
  const posts = COMMUNITY_POSTS.filter((post) => filter === "all" || post.kind === filter);
  return (
    <section className="mt-10" aria-label="Curated showcase">
      <div className="flex flex-wrap items-center justify-between gap-4 border-y border-border-default py-3">
        <h2 className="editorial-label text-foreground-muted">The showcase</h2>
        <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
          <TabsList aria-label="Filter showcase" className="h-auto rounded-none border-0 bg-transparent p-0">
            {([['all', 'All'], ['image', 'Images'], ['video', 'Videos']] as const).map(([value, label]) => (
              <TabsTrigger key={value} value={value} className="h-10 rounded-none px-4 font-medium uppercase data-[state=active]:bg-accent-subtle data-[state=active]:text-accent-text">{label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <div className="mt-8 grid items-start gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, i) => (
          <article key={post.slug} data-kind={post.kind} className="min-w-0 border-b border-border-subtle pb-5">
            <CatalogPlate seed={post.seed} theme={post.theme} media={post.media} alt={post.title}
              ratio={post.kind === 'video' ? '4 / 3' : '4 / 5'} priority={i === 0} />
            <p className="mt-4 text-xs text-foreground-muted">{post.kind === 'image' ? 'Image' : 'Video'} · {post.media ? 'Studio sample' : 'Concept artwork'}</p>
            <h3 className="editorial-display mt-2 text-2xl">{post.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{post.prompt}</p>
            <p className="mt-3 text-xs text-foreground-muted">{post.media ? 'Made with' : 'Suggested model'} · {post.model}</p>
            <Link href={communityRecreateHref(post)} aria-label={`Recreate ${post.title}`}
              className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm text-accent-text underline decoration-border-default underline-offset-4 hover:decoration-current">
              Recreate <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
