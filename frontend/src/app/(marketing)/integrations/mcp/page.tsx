import type { Metadata } from "next";

import { ConceptPage } from "@/components/discovery/concept-page";

export const metadata: Metadata = { title: "MCP server" };

/** Illustrative only: no such package is published, and the placeholder names say so. */
const SKETCH = `{
  "mcpServers": {
    "<server-name>": {
      "command": "npx",
      "args": ["-y", "<package-not-published>"],
      "env": { "API_KEY": "<your key>" }
    }
  }
}`;

export default function McpPage() {
  return (
    <ConceptPage
      eyebrow="Concept / Integration"
      title="MCP server"
      description="The studio as tools an assistant can call: generate_image, generate_video and generate_audio reachable from a chat client or a terminal, with the same validation the web app uses."
      note="Preview only. No MCP server is published and nothing here can be installed or connected — the configuration below is a sketch, not a working snippet. The REST API such a server would wrap is real: it is the one this app calls for every generation."
      seed="mcp"
      primary={{ label: "Use the web workflow", href: "/generate/image" }}
      secondary={{ label: "ChatGPT concept", href: "/integrations/chatgpt" }}
      points={[
        { title: "Three tools", text: "Image, video and speech generation exposed as callable tools." },
        { title: "Terminal use", text: "Batches and pipelines scripted from a shell." },
        { title: "Typed contracts", text: "The same request schemas the API validates against." },
        { title: "One archive", text: "Results would land in the archive like any other generation." },
      ]}
    >
      <section className="mt-12 grid gap-10 lg:grid-cols-2" aria-labelledby="sketch-heading">
        <div>
          <h2 id="sketch-heading" className="editorial-display text-3xl">
            Configuration sketch
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
            What a client configuration would look like. The names are placeholders: there is no
            package to install and no key to issue.
          </p>
          <pre className="mt-5 overflow-x-auto border border-border-subtle bg-surface-subtle p-4 text-xs leading-relaxed text-foreground">
            {SKETCH}
          </pre>
        </div>
        <div>
          <h2 className="editorial-display text-3xl">Asks it would answer</h2>
          <ul className="mt-5 space-y-4 text-sm leading-relaxed text-foreground-muted">
            <li className="border-t border-border-default pt-4">
              &ldquo;Generate a 16:9 hero image for the landing page, then animate it into a short clip.&rdquo;
            </li>
            <li className="border-t border-border-default pt-4">
              &ldquo;Read this script and produce a warm narration in a low voice.&rdquo;
            </li>
            <li className="border-t border-border-default pt-4">
              &ldquo;Make four poster variations for the launch and keep the boldest.&rdquo;
            </li>
          </ul>
        </div>
      </section>
    </ConceptPage>
  );
}
