import type { Metadata } from "next";
import { MessageSquare, Sparkles, Video, Zap } from "lucide-react";

import { ProductPage } from "@/components/discovery/product-page";

export const metadata: Metadata = { title: "ChatGPT Plugin" };

export default function ChatGptPluginPage() {
  return (
    <ProductPage
      eyebrow="New"
      badge="New"
      title="ChatGPT Plugin"
      description="Viral video presets and motion design straight from a chat, with free generations."
      status="preview"
      statusNote="The plugin itself is not published in this build. The Effects library gives you the same presets with one click."
      primary={{ label: "Browse effects", href: "/effects" }}
      secondary={{ label: "Higgsfield MCP", href: "/integrations/mcp" }}
      seed="chatgpt-plugin"
      features={[
        { icon: MessageSquare, title: "Chat to create", text: "Describe the clip; the plugin picks the preset and generates." },
        { icon: Video, title: "Viral presets", text: "Crash zoom, eyes-in, flip phone and more." },
        { icon: Sparkles, title: "Motion design", text: "After Effects-style motion graphics from a sentence." },
        { icon: Zap, title: "Free generations", text: "Included free generations for new users." },
      ]}
    />
  );
}
