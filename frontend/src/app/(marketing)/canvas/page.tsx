import type { Metadata } from "next";

import { ConceptPage } from "@/components/discovery/concept-page";
import { CanvasDiagram } from "@/features/studios/canvas-diagram";

export const metadata: Metadata = { title: "Canvas" };

export default function CanvasPage() {
  return (
    <ConceptPage
      eyebrow="Concept / Workflow"
      title="Canvas"
      description="One surface for a whole workflow: references and generations side by side, models chained into each other, and branches kept next to the version they came from."
      note="Preview only. The diagram below is an illustration — there is no board to edit, nothing to drag, connect, zoom, branch, save or share. Each step it names is a workspace that already works on its own."
      seed="canvas"
      primary={{ label: "Start with an image", href: "/generate/image" }}
      secondary={{ label: "Animate an image", href: "/generate/video" }}
      points={[
        { title: "Moodboard", text: "References and generations arranged beside each other." },
        { title: "Chained models", text: "Image into video into voice-over, as one connected run." },
        { title: "Branch and compare", text: "Fork a step to explore a variation without losing the original." },
        { title: "Shared", text: "A board a team could comment on and iterate together." },
      ]}
    >
      <CanvasDiagram />
    </ConceptPage>
  );
}
