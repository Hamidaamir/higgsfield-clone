import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";

import { AppProviders } from "@/components/providers";
import { PromoBanner } from "@/components/layout/promo-banner";
import { TopNav } from "@/components/layout/top-nav";
import { siteConfig } from "@/lib/config/site";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
  description: siteConfig.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${archivo.variable}`}>
      <body className="flex min-h-screen flex-col">
        <AppProviders>
          <PromoBanner />
          <TopNav />
          <main className="flex-1">{children}</main>
        </AppProviders>
      </body>
    </html>
  );
}
