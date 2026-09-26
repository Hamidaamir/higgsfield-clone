import type { Metadata } from "next";

import { ConceptPage } from "@/components/discovery/concept-page";

/*
 * The route keeps its historical path so existing links and tests stay valid, but the concept
 * is named for what it does. "Genjutsu" was another product's name for this idea; Forma does
 * not own it and does not implement it, so nothing here claims it either way.
 */
export const metadata: Metadata = { title: "Motion transfer" };

export default function MotionTransferPage() {
  return (
    <ConceptPage
      eyebrow="Concept / Video"
      title="Motion transfer"
      description="Reality manipulation for footage you already have: transfer the motion of one clip into a new scene, or swap a detail while camera, timing and performance stay exactly as filmed."
      note="Preview only. Video-to-video editing has no free provider in this build, so nothing on this page generates. Image-to-video with LTX Video is the closest workflow that actually runs."
      seed="genjutsu"
      primary={{ label: "Animate an image instead", href: "/generate/video" }}
      secondary={{ label: "Video catalog", href: "/video" }}
      points={[
        { title: "Motion transfer", text: "Take the motion from one clip and apply it to a new scene." },
        { title: "Object swap", text: "Replace a product, outfit or prop while the shot stays as filmed." },
        { title: "Keep the take", text: "No reshoot: the camera move, timing and performance are preserved." },
        { title: "Many versions", text: "One upload in, many variations out." },
      ]}
    />
  );
}
