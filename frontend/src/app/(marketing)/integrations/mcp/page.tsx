import type { Metadata } from "next";
import { Code2, Plug, Terminal, Wand2 } from "lucide-react";

import { ProductPage } from "@/components/discovery/product-page";

export const metadata: Metadata = { title: "Higgsfield MCP" };

const snippet = `{
  "mcpServers": {
    "higgsfield": {
      "command": "npx",
      "args": ["-y", "@higgsfield/mcp"],
      "env": { "HIGGSFIELD_API_KEY": "<your key>" }
    }
  }
}`;

export default function McpPage() {
  return (
    <ProductPage
      eyebrow="MCP & CLI"
      title={<>Higgsfield MCP<br />with GPT-6 Astra</>}
      description="Turn Claude, ChatGPT and your terminal into a creative engine: generate_image, generate_video and generate_audio as tools."
      status="preview"
      statusNote="The MCP server is not published in this build; the REST API it would wrap (POST /api/generations/image|video|audio) is the same one the web app uses."
      primary={{ label: "Try the web workflow", href: "/generate/image" }}
      secondary={{ label: "ChatGPT Plugin", href: "/integrations/chatgpt" }}
      seed="mcp"
      features={[
        { icon: Plug, title: "Three tools", text: "generate_image, generate_video, generate_audio with the same validation as the app." },
        { icon: Terminal, title: "CLI", text: "Script batches and pipelines from the terminal." },
        { icon: Code2, title: "Typed contracts", text: "Pydantic schemas on the server, JSON schemas for the tools." },
        { icon: Wand2, title: "Agent-ready", text: "Results land in History like any other generation." },
      ]}
    >
      <section id="use-cases" className="mt-12 grid gap-4 lg:grid-cols-2" aria-label="Configuration">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="text-base font-semibold">Install (Claude Desktop config)</h3>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-black/60 p-4 text-xs leading-relaxed text-text-primary">{snippet}</pre>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="text-base font-semibold">Example workflows</h3>
          <ul className="mt-3 space-y-2 text-sm text-text-secondary">
            <li>“Generate a 16:9 hero image for the landing page, then animate it into a 3s clip.”</li>
            <li>“Read the script and produce a warm narration with Aura’s Orion voice.”</li>
            <li>“Make four poster variations for the launch and pick the boldest.”</li>
          </ul>
        </div>
      </section>
    </ProductPage>
  );
}
