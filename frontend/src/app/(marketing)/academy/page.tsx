import type { Metadata } from "next";
import { BookOpen, GraduationCap, Lightbulb, PlayCircle } from "lucide-react";

import { ProductPage } from "@/components/discovery/product-page";

export const metadata: Metadata = { title: "Academy" };

const courses = [
  { title: "Prompting for photoreal stills", level: "Beginner", minutes: 12, href: "/generate/image", seed: "academy-1" },
  { title: "Image to video: making motion feel natural", level: "Intermediate", minutes: 18, href: "/generate/video", seed: "academy-2" },
  { title: "Directing with Cinema Studio", level: "Intermediate", minutes: 15, href: "/cinema-studio", seed: "academy-3" },
  { title: "Voice-overs that don't sound robotic", level: "Beginner", minutes: 9, href: "/generate/audio", seed: "academy-4" },
  { title: "Effects presets, explained", level: "Beginner", minutes: 7, href: "/effects", seed: "academy-5" },
  { title: "Product ads with Marketing Studio", level: "Advanced", minutes: 22, href: "/marketing-studio", seed: "academy-6" },
];

export default function AcademyPage() {
  return (
    <ProductPage
      eyebrow="Learn"
      title="Academy"
      description="Short, practical lessons on prompting, motion, directing and voice — each one ends inside the tool it teaches."
      status="preview"
      statusNote="Lessons are outlines that link into the working generators; there is no video course player in this build."
      primary={{ label: "Start with images", href: "/generate/image" }}
      secondary={{ label: "Browse tools", href: "/image" }}
      seed="academy"
      features={[
        { icon: GraduationCap, title: "Guided paths", text: "Beginner to advanced tracks across image, video and audio." },
        { icon: PlayCircle, title: "Learn by doing", text: "Every lesson opens the relevant generator pre-filled." },
        { icon: Lightbulb, title: "Prompt guide", text: "Structures that reliably produce cinematic results." },
        { icon: BookOpen, title: "Model notes", text: "What each model is good at and what to avoid." },
      ]}
      gallery={courses.map((c) => ({ seed: c.seed, href: c.href, alt: `${c.title} (${c.level}, ${c.minutes} min)` }))}
      galleryTitle="Courses"
    />
  );
}
