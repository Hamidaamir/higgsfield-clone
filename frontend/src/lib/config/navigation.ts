import { AudioLines, Image as ImageIcon, Video, Wand2, type LucideIcon } from "lucide-react";

/**
 * Shell information architecture. Every navigation decision (labels, destinations, which
 * section a route belongs to) lives here so components never hand-roll pathname checks.
 *
 * Labels are presentation only — routes, API contracts and database concepts are unchanged.
 * "Archive" is the History page; "Create" is the home surface that R2 will build out.
 */

export type SectionId = "create" | "studio" | "archive" | "explore";

export interface StudioItem {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

/** The four real creative workspaces. Each maps to an existing, working route. */
export const studioItems: StudioItem[] = [
  {
    label: "Image Studio",
    description: "Generate still imagery from a prompt",
    href: "/generate/image",
    icon: ImageIcon,
  },
  {
    label: "Video Studio",
    description: "Create motion from text or a reference",
    href: "/generate/video",
    icon: Video,
  },
  {
    label: "Audio Studio",
    description: "Generate speech from a script",
    href: "/generate/audio",
    icon: AudioLines,
  },
  {
    label: "Edit & Enhance",
    description: "Transform an existing image",
    href: "/edit/image",
    icon: Wand2,
  },
];

export interface NavSection {
  id: SectionId;
  label: string;
  /** Sections without an href open a panel instead of navigating (Studio). */
  href?: string;
}

export const navSections: NavSection[] = [
  { id: "create", label: "Create", href: "/" },
  { id: "studio", label: "Studio" },
  { id: "archive", label: "Archive", href: "/history" },
  { id: "explore", label: "Explore", href: "/community" },
];

/**
 * Route → section. Ordered longest-prefix-first; the first match wins, so
 * `/edit/image` resolves to Studio before any shorter prefix can claim it.
 */
const SECTION_ROUTES: { prefix: string; section: SectionId }[] = [
  { prefix: "/generate", section: "studio" },
  { prefix: "/edit", section: "studio" },
  { prefix: "/history", section: "archive" },
  { prefix: "/projects", section: "archive" },
  { prefix: "/community", section: "explore" },
  { prefix: "/effects", section: "explore" },
  { prefix: "/image", section: "explore" },
  { prefix: "/video", section: "explore" },
  { prefix: "/audio", section: "explore" },
  { prefix: "/models", section: "explore" },
  { prefix: "/tools", section: "explore" },
  { prefix: "/cinema-studio", section: "explore" },
  { prefix: "/marketing-studio", section: "explore" },
  { prefix: "/canvas", section: "explore" },
  { prefix: "/genjutsu", section: "explore" },
  { prefix: "/supercomputer", section: "explore" },
  { prefix: "/3d-jutsu", section: "explore" },
  { prefix: "/academy", section: "explore" },
  { prefix: "/contests", section: "explore" },
  { prefix: "/integrations", section: "explore" },
];

/** The highlighted section for a pathname, or null where no section applies (auth, settings, pricing). */
export function activeSection(pathname: string): SectionId | null {
  if (pathname === "/") return "create";
  const match = SECTION_ROUTES.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return match?.section ?? null;
}

export interface FooterGroup {
  title: string;
  links: { label: string; href: string }[];
}

/** Marketing-only footer. Every link is a route that exists — no placeholder legal or social links. */
export const footerGroups: FooterGroup[] = [
  {
    title: "Create",
    links: studioItems.map(({ label, href }) => ({ label, href })),
  },
  {
    title: "Explore",
    links: [
      { label: "Community", href: "/community" },
      { label: "Effects", href: "/effects" },
      { label: "Image", href: "/image" },
      { label: "Video", href: "/video" },
      { label: "Audio", href: "/audio" },
    ],
  },
  {
    title: "Studios",
    links: [
      { label: "Cinema Studio", href: "/cinema-studio" },
      { label: "Marketing Studio", href: "/marketing-studio" },
      { label: "Canvas", href: "/canvas" },
    ],
  },
  {
    title: "Product",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "Enterprise", href: "/enterprise" },
      { label: "Academy", href: "/academy" },
      { label: "System status", href: "/system" },
    ],
  },
];
