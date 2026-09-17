import type { Metadata } from "next";

import { CatalogPage } from "@/components/discovery/catalog-page";

export const metadata: Metadata = { title: "AI Audio" };

export default function AudioCatalogPage() {
  return <CatalogPage category="audio" />;
}
