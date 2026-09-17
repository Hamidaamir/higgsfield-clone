import type { Metadata } from "next";
import { Move3d, Replace, Sparkles, Video } from "lucide-react";

import { ProductPage } from "@/components/discovery/product-page";

export const metadata: Metadata = { title: "Genjutsu" };

export default function GenjutsuPage() {
  return (
    <ProductPage
      eyebrow="New model"
      badge="New"
      title="Higgsfield Genjutsu"
      description="Reality Manipulation — transfer motion into new scenes, or swap details while everything else stays as filmed."
      status="preview"
      statusNote="Genjutsu is a proprietary video-to-video model with no free API. The closest working workflow is image-to-video with LTX Video."
      primary={{ label: "Animate an image instead", href: "/generate/video" }}
      secondary={{ label: "All video tools", href: "/video" }}
      seed="genjutsu"
      features={[
        { icon: Move3d, title: "Motion transfer", text: "Take the motion from one clip and apply it to a new scene." },
        { icon: Replace, title: "One-click object swap", text: "Swap a product, outfit or prop while the shot stays as filmed." },
        { icon: Video, title: "Keep the take", text: "No reshoot: camera, timing and performance are preserved." },
        { icon: Sparkles, title: "Many versions", text: "One upload in, endless new visions out." },
      ]}
      gallery={Array.from({ length: 4 }, (_, i) => ({ seed: `genjutsu-g${i}`, href: "/generate/video", alt: `Genjutsu example ${i + 1}` }))}
    />
  );
}
