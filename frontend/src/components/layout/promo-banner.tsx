"use client";

import { Tag, X } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import { siteConfig } from "@/lib/config/site";

const STORAGE_KEY = "hf.promo-banner.dismissed";
const listeners = new Set<() => void>();

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function dismissBanner() {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* private mode: the banner simply returns on the next visit */
  }
  listeners.forEach((listener) => listener());
}

export function PromoBanner() {
  // Server snapshot hides the banner so SSR and hydration agree; the client
  // snapshot reads the per-viewer preference.
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => true);
  if (dismissed) return null;

  return (
    <div className="relative flex h-10 items-center justify-center gap-3 bg-accent px-12 text-[13px] font-medium text-accent-foreground">
      <Tag className="size-3.5" aria-hidden />
      <span className="truncate">{siteConfig.promoBanner.text}</span>
      <Link
        href={siteConfig.promoBanner.href}
        className="hidden shrink-0 rounded-md bg-white/85 px-2.5 py-1 text-xs font-semibold hover:bg-white sm:inline-block"
      >
        {siteConfig.promoBanner.cta}
      </Link>
      <button
        type="button"
        onClick={dismissBanner}
        aria-label="Dismiss banner"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 hover:bg-black/10"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
