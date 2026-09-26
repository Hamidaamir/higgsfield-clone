/** A real generation produced on this stack and shipped with the app (see `public/showcase`). */
export interface ShowcaseMedia {
  kind: "image" | "video";
  src: string;
  /** Poster frame for videos; images reuse `src`. */
  poster?: string;
}
