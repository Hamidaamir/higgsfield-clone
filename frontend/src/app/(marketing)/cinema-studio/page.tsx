import type { Metadata } from "next";
import { Aperture, Clapperboard, Film, Lightbulb, Palette, Users } from "lucide-react";

import { ProductPage } from "@/components/discovery/product-page";
import { ShotComposer } from "@/features/studios/shot-composer";

export const metadata: Metadata = { title: "Cinema Studio" };

export default function CinemaStudioPage() {
  return (
    <ProductPage
      eyebrow="Studio"
      title="Cinema Studio 4.0"
      description="Create cinematic scenes effortlessly. Camera, lens, movement, lighting and color — composed into a director prompt and shot with LTX Video."
      status="available"
      primary={{ label: "Compose a shot", href: "#composer" }}
      secondary={{ label: "Create Video", href: "/generate/video" }}
      seed="cinema-studio"
      features={[
        { icon: Aperture, title: "Camera & lens", text: "Wide, standard, telephoto or anamorphic — each lens changes the look of the shot." },
        { icon: Clapperboard, title: "Movement", text: "Dolly, orbit, handheld and crane presets written the way a DP would brief them." },
        { icon: Lightbulb, title: "Lighting", text: "Golden hour, neon, noir, overcast and studio setups." },
        { icon: Palette, title: "Color grade", text: "Teal & orange, 35mm film, black & white or pastel." },
        { icon: Film, title: "Real generation", text: "Shots render through the same free LTX Video workflow and are saved to History." },
        { icon: Users, title: "Reusable elements", text: "Characters, locations and props as reusable elements are on the roadmap — preview only." },
      ]}
    >
      <div id="composer">
        <ShotComposer />
      </div>
    </ProductPage>
  );
}
