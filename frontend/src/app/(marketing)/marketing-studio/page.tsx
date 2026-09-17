import type { Metadata } from "next";
import { Image as ImageIcon, Link2, Megaphone, Sparkles } from "lucide-react";

import { ProductPage } from "@/components/discovery/product-page";
import { MarketingComposer } from "@/features/studios/marketing-composer";

export const metadata: Metadata = { title: "Marketing Studio" };

export default function MarketingStudioPage() {
  return (
    <ProductPage
      eyebrow="Studio"
      title="Marketing Studio"
      description="UGC, product shots, ads, posters and motion — from a product name and a template."
      status="available"
      primary={{ label: "Pick a template", href: "#composer" }}
      secondary={{ label: "See examples", href: "/community" }}
      seed="marketing-studio"
      features={[
        { icon: ImageIcon, title: "Product shots", text: "Studio, lifestyle and poster templates rendered with SDXL Lightning." },
        { icon: Megaphone, title: "UGC & motion", text: "Creator clips, unboxings and hero motion with LTX Video." },
        { icon: Link2, title: "Product URL import", text: "Paste a product link to pull name and imagery — preview only in this build." },
        { icon: Sparkles, title: "Saved to History", text: "Every render is a normal generation you can reuse and retry." },
      ]}
    >
      <div id="composer">
        <MarketingComposer />
      </div>
    </ProductPage>
  );
}
