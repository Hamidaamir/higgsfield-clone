import { siteConfig } from "@/lib/config/site";

/** Cloudinary delivery URLs accept an `fl_attachment` flag that forces a download without JS. */
export function downloadUrl(url: string, filename?: string): string {
  const marker = "/upload/";
  const index = url.indexOf(marker);
  if (index === -1 || !url.includes("res.cloudinary.com")) return url;
  const flag = filename ? `fl_attachment:${filename}` : "fl_attachment";
  return `${url.slice(0, index + marker.length)}${flag}/${url.slice(index + marker.length)}`;
}

export function aspectRatioStyle(width: number | null, height: number | null): { aspectRatio: string } {
  return { aspectRatio: width && height ? `${width} / ${height}` : "1 / 1" };
}

export function ratioToStyle(ratio: string): { aspectRatio: string } {
  const [w, h] = ratio.split(":").map(Number);
  return { aspectRatio: w && h ? `${w} / ${h}` : "1 / 1" };
}

/** Saved files are named after the product, so a download says where it came from. */
export const DOWNLOAD_PREFIX = siteConfig.name.toLowerCase();
