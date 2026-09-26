import type { Metadata } from "next";

import { ConceptPage } from "@/components/discovery/concept-page";

export const metadata: Metadata = { title: "ChatGPT plugin" };

export default function ChatGptPluginPage() {
  return (
    <ConceptPage
      eyebrow="Concept / Integration"
      title="ChatGPT plugin"
      description="Reach the studio from a chat: describe the clip you want, let the assistant pick the preset, and get the generation back in the conversation."
      note="Preview only. No plugin is published, nothing can be connected or installed, and there is no API key, workspace or sync state behind this page. The Effects library offers the same presets today, one click each."
      seed="chatgpt-plugin"
      primary={{ label: "Browse Effects", href: "/effects" }}
      secondary={{ label: "MCP concept", href: "/integrations/mcp" }}
      points={[
        { title: "Chat to create", text: "Describe the clip; the assistant chooses the preset and runs it." },
        { title: "Preset library", text: "The same camera, VFX and viral presets the Effects page lists." },
        { title: "Motion design", text: "Motion-graphics direction written as a sentence." },
        { title: "Back in the thread", text: "Results would return to the conversation that asked for them." },
      ]}
    />
  );
}
