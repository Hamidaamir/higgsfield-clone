import type { Metadata } from "next";

import { ConceptPage } from "@/components/discovery/concept-page";

export const metadata: Metadata = { title: "Contests" };

export default function ContestsPage() {
  return (
    <ConceptPage
      eyebrow="Concept / Community"
      title="Contests"
      description="Recurring creative challenges: a shared prompt, a window to make something, and a public showcase of what people made."
      note="Preview only. There are no live contests, entries, deadlines, prizes, votes, leaderboards or winners in this build, and no submission backend to hold them. Anything you generate is saved to your own archive and nowhere else."
      seed="contests"
      primary={{ label: "Make something in Video Studio", href: "/generate/video" }}
      secondary={{ label: "See the curated showcase", href: "/community" }}
      points={[
        { title: "A shared prompt", text: "Everyone starts from the same creative brief." },
        { title: "A window to make it", text: "Challenges would open and close on a schedule." },
        { title: "A public showcase", text: "Entries would be browsable together rather than ranked in isolation." },
        { title: "Featured work", text: "Selected pieces would appear in Explore." },
      ]}
    />
  );
}
