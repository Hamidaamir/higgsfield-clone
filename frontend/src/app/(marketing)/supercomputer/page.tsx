import type { Metadata } from "next";
import { Bot, Cpu, Megaphone, Workflow } from "lucide-react";

import { ProductPage } from "@/components/discovery/product-page";

export const metadata: Metadata = { title: "Supercomputer" };

export default function SupercomputerPage() {
  return (
    <ProductPage
      eyebrow="Agent"
      title="Supercomputer"
      description="One superagent for your entire creative stack — build, generate, market and automate from a single conversation."
      status="preview"
      statusNote="The agent surface is representative. Its building blocks — image, video and speech generation — are real and one click away."
      primary={{ label: "Generate an image", href: "/generate/image" }}
      secondary={{ label: "Text to speech", href: "/generate/audio" }}
      seed="supercomputer"
      features={[
        { icon: Bot, title: "Chat-driven", text: "Describe the outcome; the agent plans the shots, copy and assets." },
        { icon: Workflow, title: "Skills & connectors", text: "Generation, editing and publishing skills chained automatically." },
        { icon: Megaphone, title: "Marketing hooks", text: "Analyzes hooks and formats for each channel." },
        { icon: Cpu, title: "Runs on the same engine", text: "Every action maps to a generation you can see in History." },
      ]}
    />
  );
}
