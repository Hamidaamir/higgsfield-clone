"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { GenerationTypeIcon } from "@/components/generation/generation-type-icon";
import { MediaCard } from "@/components/discovery/media-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { COMMUNITY_POSTS, communityRecreateHref } from "@/lib/config/community";

type Filter = "all" | "image" | "video";

/** Curated showcase grid with prompt/model details and a real "Recreate" deep link. */
export function CommunityGallery() {
  const [filter, setFilter] = useState<Filter>("all");
  const posts = COMMUNITY_POSTS.filter((p) => filter === "all" || p.kind === filter);
  return (
    <section className="mt-8" aria-label="Community showcase">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList aria-label="Filter showcase">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="video">Videos</TabsTrigger>
          <TabsTrigger value="image">Images</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {posts.map((post, i) => (
          <article key={post.slug} className="group flex flex-col">
            <MediaCard href={communityRecreateHref(post)} seed={post.seed} theme={post.theme} media={post.media} alt={post.title} ratio="4 / 5" priority={i < 4}>
              <span className="absolute right-3 top-3 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-semibold text-white">{post.kind === "video" ? "Video" : "Image"}</span>
              {post.media ? (
                <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-accent backdrop-blur">Real output</span>
              ) : null}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-10 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="line-clamp-3 text-xs text-white/85">{post.prompt}</p>
              </div>
            </MediaCard>
            <div className="mt-2.5 flex items-center gap-2 text-xs">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-secondary">
                <GenerationTypeIcon type={post.kind} className="size-3" />
              </span>
              <span className="min-w-0 flex-1 truncate">
                <span className="font-semibold">{post.title}</span>
                <span className="text-text-secondary"> · {post.model}</span>
              </span>
              <Link href={communityRecreateHref(post)} className="inline-flex shrink-0 items-center gap-1 rounded-md bg-surface-muted px-2 py-1 font-semibold hover:bg-surface-hover">
                <RotateCcw className="size-3" aria-hidden />
                Recreate
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
