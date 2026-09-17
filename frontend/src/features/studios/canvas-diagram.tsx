import { AudioLines, Image as ImageIcon, Type, Video } from "lucide-react";
import Link from "next/link";

const nodes = [
  { id: "prompt", label: "Prompt", sub: "Let's create an engaging video for our brand", icon: Type, href: "/generate/image", x: 0, y: 40 },
  { id: "image", label: "Image Generation", sub: "FLUX.1 Schnell · 1:1", icon: ImageIcon, href: "/generate/image", x: 1, y: 0 },
  { id: "video", label: "Video Generation", sub: "LTX Video · image to video", icon: Video, href: "/generate/video", x: 2, y: 40 },
  { id: "audio", label: "Voice-over", sub: "Aura 1 · Luna", icon: AudioLines, href: "/generate/audio", x: 3, y: 0 },
];

/** Static, honest node-graph illustration; every node links to the real generator it represents. */
export function CanvasDiagram() {
  return (
    <section className="mt-12 overflow-x-auto rounded-3xl border border-border bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:28px_28px] p-6" aria-label="Workflow canvas">
      <div className="relative mx-auto h-[260px] min-w-[880px]">
        <svg className="absolute inset-0 h-full w-full" aria-hidden>
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M ${i * 230 + 200} ${nodes[i].y + 56} C ${i * 230 + 260} ${nodes[i].y + 56}, ${i * 230 + 200} ${nodes[i + 1].y + 56}, ${i * 230 + 236} ${nodes[i + 1].y + 56}`} fill="none" stroke="#d6ff00" strokeWidth="2" strokeDasharray="6 6" />
          ))}
        </svg>
        {nodes.map((node) => (
          <Link
            key={node.id}
            href={node.href}
            className="absolute flex w-[200px] flex-col gap-2 rounded-2xl border border-border bg-surface-elevated p-3 shadow-card transition-colors hover:border-accent"
            style={{ left: node.x * 230, top: node.y }}
          >
            <span className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
              <node.icon className="size-3.5 text-accent" aria-hidden />
              {node.label}
            </span>
            <span className="rounded-lg bg-surface-muted px-2 py-3 text-xs text-text-primary">{node.sub}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">Open node →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
