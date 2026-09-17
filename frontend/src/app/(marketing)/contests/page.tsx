import type { Metadata } from "next";
import { Award, CalendarClock, Trophy, Users } from "lucide-react";

import { ProductPage } from "@/components/discovery/product-page";

export const metadata: Metadata = { title: "Contests" };

export default function ContestsPage() {
  return (
    <ProductPage
      eyebrow="Community"
      title="Contests"
      description="Weekly creative challenges with prompts, deadlines and a community leaderboard."
      status="preview"
      statusNote="Contest submissions and leaderboards are representative. Make an entry with any generator and it stays in your History."
      primary={{ label: "Make an entry", href: "/generate/video" }}
      secondary={{ label: "See the showcase", href: "/community" }}
      seed="contests"
      features={[
        { icon: Trophy, title: "Global Film Festival", text: "Short films made with AI. $1,000,000 prize pool in the reference product." },
        { icon: CalendarClock, title: "Weekly prompts", text: "A new theme every Monday; entries close Sunday night." },
        { icon: Users, title: "Community voting", text: "Likes and jury picks decide the winners." },
        { icon: Award, title: "Creator partners", text: "Winners are featured on Explore." },
      ]}
      gallery={Array.from({ length: 4 }, (_, i) => ({ seed: `contest-g${i}`, href: "/community", alt: `Contest entry ${i + 1}` }))}
      galleryTitle="Recent entries"
    />
  );
}
