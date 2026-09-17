import type { Metadata } from "next";

import { CatalogPage } from "@/components/discovery/catalog-page";

export const metadata: Metadata = { title: "AI Image" };

export default function ImageCatalogPage() {
  return <CatalogPage category="image" />;
}
