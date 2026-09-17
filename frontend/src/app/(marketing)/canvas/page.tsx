import type { Metadata } from "next";
import { GitBranch, Layers, Share2, Workflow } from "lucide-react";

import { ProductPage } from "@/components/discovery/product-page";
import { CanvasDiagram } from "@/features/studios/canvas-diagram";

export const metadata: Metadata = { title: "Canvas" };

export default function CanvasPage() {
  return (
    <ProductPage
      eyebrow="New feature"
      badge="New"
      title={<>One canvas.<br />Every workflow.</>}
      description="Moodboard, chain workflows, and share with your team — all on one canvas."
      status="preview"
      statusNote="The node canvas is representative in this build. Each node maps to a real generator: start a chain from Create Image, then animate the result in Create Video."
      primary={{ label: "Start with an image", href: "/generate/image" }}
      secondary={{ label: "Animate an image", href: "/generate/video" }}
      seed="canvas"
      features={[
        { icon: Layers, title: "Moodboard", text: "Drop references and generations side by side." },
        { icon: Workflow, title: "Chain models", text: "Image → video → voice-over, connected as nodes." },
        { icon: GitBranch, title: "Branch & compare", text: "Fork a node to explore variations without losing the original." },
        { icon: Share2, title: "Share", text: "Invite teammates to comment and iterate on the same canvas." },
      ]}
    >
      <CanvasDiagram />
    </ProductPage>
  );
}
