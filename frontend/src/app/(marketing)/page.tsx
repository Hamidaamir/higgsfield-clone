import { Check, Clapperboard, Cpu, Image as ImageIcon, Sparkles, Terminal, Video } from "lucide-react";
import Link from "next/link";

import { MediaCard } from "@/components/discovery/media-card";
import { ChipCloud, HeroPanel, QuickLinkTile, SectionHeader, ViewAllButton, WideBanner } from "@/components/discovery/primitives";
import { ExploreAccountCard } from "@/components/discovery/explore-account-card";
import { Badge } from "@/components/ui/badge";
import { featureCards, gallerySections, moreFeatures, projectCards, type GallerySection } from "@/lib/config/explore";
import { Artwork } from "@/components/discovery/artwork";

/** Public home: the Higgsfield-style Explore/discovery page (reference 211457 → 212104). */
export default function ExplorePage() {
  const [effects, video, image, marketing, soul] = gallerySections;
  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-8 pt-4 sm:px-6">
      {/* 1. Feature row */}
      <section aria-label="Featured" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {featureCards.map((card, i) => (
          <MediaCard
            key={card.seed}
            href={card.href}
            seed={card.seed}
            theme={card.theme}
            media={card.media}
            alt={card.title}
            overlay={card.overlay}
            overlayPosition={card.overlayPosition}
            title={card.title}
            subtitle={card.subtitle}
            priority={i < 2 || Boolean(card.media)}
          />
        ))}
      </section>

      {/* 2. Account card + quick tiles */}
      <section aria-label="Quick links" className="mt-8 grid gap-4 lg:grid-cols-[1.15fr_2fr]">
        <ExploreAccountCard />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <QuickLinkTile href="/generate/video" icon={<Video className="size-5" />} kind="Video" name="LTX Video" subtitle="Fast text and image to video" badge={<Badge variant="top">TOP</Badge>} />
          <QuickLinkTile href="/generate/image" icon={<ImageIcon className="size-5" />} kind="Image" name="FLUX.1 Schnell" subtitle="Generate high-quality visuals" />
          <QuickLinkTile href="/genjutsu" icon={<Sparkles className="size-5" />} name="Higgsfield Genjutsu" subtitle="One video, many versions" badge={<Badge variant="new">New</Badge>} />
          <QuickLinkTile href="/integrations/mcp" icon={<Terminal className="size-5" />} name="MCP & CLI" subtitle="Turn Claude into a creative engine" />
          <QuickLinkTile href="/cinema-studio" icon={<Clapperboard className="size-5" />} name="Cinema Studio 4.0" subtitle="Create cinematic scenes effortlessly" />
          <QuickLinkTile href="/supercomputer" icon={<Cpu className="size-5" />} name="Supercomputer" subtitle="One superagent for your creative stack" />
        </div>
      </section>

      {/* 3. MCP hero */}
      <HeroPanel
        className="mt-8"
        eyebrow="Higgsfield MCP with"
        title={
          <span className="inline-flex flex-wrap items-center justify-center gap-4">
            GPT-6 <span className="inline-flex size-12 items-center justify-center rounded-full border-2 border-text-secondary text-2xl sm:size-16">✱</span> ASTRA
          </span>
        }
        subtitle="Build games, motion graphics, and interactive 3D experiences with Higgsfield MCP"
        primary={{ label: "Install Higgsfield plugin", href: "/integrations/mcp" }}
        secondary={{ label: "Explore use cases", href: "/integrations/mcp#use-cases" }}
      />

      {/* 4. Visual effects */}
      <Gallery section={effects} mixed />

      {/* 5. Video */}
      <Gallery section={video} />

      {/* 6. Projects */}
      <section className="mt-14" aria-label="Community projects">
        <SectionHeader title="Explore the inside of every project" subtitle="See all prompts, assets, and how each project was created" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {projectCards.map((project) => (
            <MediaCard key={project.seed} href={project.href} seed={project.seed} theme={project.theme} alt={project.title}>
              <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/90 to-transparent px-3 pb-3 pt-8 text-xs text-white">
                <span className="flex size-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">H</span>
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-semibold">{project.title}</span>
                  <span className="text-white/70"> by {project.author}</span>
                </span>
                <span className="shrink-0 rounded-md bg-white/15 px-1.5 py-0.5 font-semibold">{project.visibility}</span>
              </div>
            </MediaCard>
          ))}
        </div>
        <ViewAllButton href="/community">Explore community</ViewAllButton>
      </section>

      {/* 7. Supercomputer */}
      <HeroPanel
        className="mt-14"
        tone="lime"
        title="Supercomputer"
        subtitle="One superagent for your entire creative stack"
        secondary={{ label: "Try Supercomputer", href: "/supercomputer" }}
      >
        <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
          <FloatingCard className="left-[6%] top-[18%]" label="UGC Creator" seed="sc-ugc" />
          <FloatingCard className="right-[8%] top-[10%]" label="Marketing" seed="sc-marketing" />
          <FloatingCard className="bottom-[8%] right-[18%]" label="Production" seed="sc-production" />
        </div>
      </HeroPanel>

      {/* 8. Image */}
      <Gallery section={image} />

      {/* 9. Canvas banner */}
      <WideBanner
        className="mt-14"
        eyebrow="New feature"
        title={
          <>
            One canvas.
            <br />
            Every workflow.
          </>
        }
        subtitle="Moodboard, chain workflows, and share with your team — all on one canvas"
        cta={{ label: "✦ Try Canvas", href: "/canvas" }}
        gradient="linear-gradient(100deg, #0aa7b8 0%, #0d5fb5 45%, #0b2f80 100%)"
        seed="canvas-banner"
      />

      {/* 10. Marketing */}
      <Gallery section={marketing} />

      {/* 11. Photodump banner */}
      <WideBanner
        className="mt-14"
        eyebrow="Photodump"
        title={
          <>
            Different scenes
            <br />
            same star
          </>
        }
        subtitle="Build your character. One click does the rest"
        cta={{ label: "Try Photodump", href: "/tools/photodump" }}
        gradient="linear-gradient(100deg, #1a1a1a 0%, #3a3a3a 50%, #6b6b6b 100%)"
        seed="photodump-banner"
      />

      {/* 12. Soul cinema */}
      <Gallery section={soul} />

      {/* 13. Chip cloud */}
      <ChipCloud title="Explore more AI features" items={moreFeatures} />
    </div>
  );
}

function Gallery({ section, mixed = false }: { section: GallerySection; mixed?: boolean }) {
  return (
    <section className="mt-14" aria-label={section.title}>
      <SectionHeader
        title={section.title}
        subtitle={section.subtitle}
        action={
          section.cta ? (
            <Link href={section.cta.href} className="inline-flex h-11 items-center rounded-xl bg-accent px-5 text-[15px] font-semibold text-accent-foreground shadow-accent hover:bg-accent-hover">
              {section.cta.label}
            </Link>
          ) : undefined
        }
      />
      <div className={mixed ? "grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5" : "grid grid-cols-2 gap-4 xl:grid-cols-4"}>
        {section.items.map((item) => (
          <MediaCard key={item.seed} href={item.href} seed={item.seed} theme={item.theme} media={item.media} alt={item.alt} ratio={mixed ? (item.portrait ? "3 / 4" : "4 / 5") : "16 / 10"}>
            {item.chip ? (
              <span className="absolute bottom-3 left-3 rounded-full border border-white/20 bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
                {item.chip}
              </span>
            ) : null}
          </MediaCard>
        ))}
      </div>
      <ViewAllButton href={section.viewAll.href}>{section.viewAll.label}</ViewAllButton>
    </section>
  );
}

function FloatingCard({ className, label, seed }: { className: string; label: string; seed: string }) {
  return (
    <div className={`absolute w-56 rounded-2xl border border-white/15 bg-black/60 p-3 text-left backdrop-blur ${className}`}>
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
        <Check className="size-3.5 text-accent" aria-hidden />
        {label}
      </p>
      <div className="relative h-24 overflow-hidden rounded-xl">
        <Artwork seed={seed} theme={seed.includes("ugc") ? "character" : seed.includes("marketing") ? "advertising" : "cinematic"} />
      </div>
    </div>
  );
}
