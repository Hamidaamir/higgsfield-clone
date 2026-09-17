import type { Metadata } from "next";
import { Box, Camera, Layers, Video } from "lucide-react";

import { ProductPage } from "@/components/discovery/product-page";

export const metadata: Metadata = { title: "3D Jutsu" };

export default function ThreeDJutsuPage() {
  return (
    <ProductPage
      eyebrow="New"
      badge="New"
      title="3D Jutsu"
      description="Create 3D scenes and turn them into videos."
      status="preview"
      statusNote="3D scene generation has no free provider. Compose the shot in Cinema Studio and render it with LTX Video instead."
      primary={{ label: "Open Cinema Studio", href: "/cinema-studio" }}
      secondary={{ label: "Create Video", href: "/generate/video" }}
      seed="3d-jutsu"
      features={[
        { icon: Box, title: "Block out a scene", text: "Place characters, props and environment in 3D." },
        { icon: Camera, title: "Place the camera", text: "Frame the shot with real lenses and movement." },
        { icon: Layers, title: "Reusable assets", text: "Keep characters and sets consistent across shots." },
        { icon: Video, title: "Render to video", text: "Turn the scene into a cinematic clip." },
      ]}
      gallery={Array.from({ length: 4 }, (_, i) => ({ seed: `3d-jutsu-g${i}`, href: "/generate/video", alt: `3D Jutsu example ${i + 1}` }))}
    />
  );
}
