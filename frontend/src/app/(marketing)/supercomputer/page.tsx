import type { Metadata } from "next";

import { ConceptPage } from "@/components/discovery/concept-page";

export const metadata: Metadata = { title: "Supercomputer" };

export default function SupercomputerPage() {
  return (
    <ConceptPage
      eyebrow="Concept / Agent"
      title="Supercomputer"
      description="One agent across the whole creative stack: describe an outcome and let it plan the shots, write the copy and produce the assets from a single conversation."
      note="Preview only. There is no agent, no conversation and no automation here, and no compute allocation, queue or cluster behind it. The building blocks it would call are real: image, video and speech generation each work today."
      seed="supercomputer"
      primary={{ label: "Generate an image", href: "/generate/image" }}
      secondary={{ label: "Text to speech", href: "/generate/audio" }}
      points={[
        { title: "Chat-driven", text: "Describe the outcome rather than operating each tool by hand." },
        { title: "Chained skills", text: "Generation, editing and delivery steps run in sequence." },
        { title: "Channel formats", text: "The same idea reshaped for each place it has to land." },
        { title: "One engine", text: "Every action would map to an ordinary generation in your archive." },
      ]}
    />
  );
}
