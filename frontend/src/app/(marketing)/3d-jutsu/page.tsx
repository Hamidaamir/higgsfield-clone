import type { Metadata } from "next";

import { ConceptPage } from "@/components/discovery/concept-page";

export const metadata: Metadata = { title: "3D Jutsu" };

export default function ThreeDJutsuPage() {
  return (
    <ConceptPage
      eyebrow="Concept / Video"
      title="3D Jutsu"
      description="Block out a scene in three dimensions — characters, props, environment and camera — then render it as a cinematic clip."
      note="Preview only. There is no 3D scene generation, viewer, camera rig or mesh export in this build. Cinema Studio composes a shot from the same cinematic language and hands it to the video generator that does run."
      seed="3d-jutsu"
      primary={{ label: "Open Cinema Studio", href: "/cinema-studio" }}
      secondary={{ label: "Video Studio", href: "/generate/video" }}
      points={[
        { title: "Block out a scene", text: "Place characters, props and environment in a three-dimensional space." },
        { title: "Place the camera", text: "Frame the shot with a chosen lens and movement." },
        { title: "Reusable assets", text: "Keep characters and sets consistent from shot to shot." },
        { title: "Render to video", text: "Turn the blocked scene into a finished clip." },
      ]}
    />
  );
}
