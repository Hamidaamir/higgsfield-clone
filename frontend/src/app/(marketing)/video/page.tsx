import type { Metadata } from "next";

import { CatalogPage } from "@/components/discovery/catalog-page";

export const metadata: Metadata = { title: "AI Video" };

export default function VideoCatalogPage() {
  return <CatalogPage category="video" />;
}
