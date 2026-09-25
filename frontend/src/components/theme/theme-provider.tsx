"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";

import {
  applyTheme,
  readStoredTheme,
  resolveTheme,
  storeTheme,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme";

/*
 * The preference lives outside React (localStorage + the OS media query), so it is exposed
 * through useSyncExternalStore rather than effect-driven state. Snapshots are cached because
 * useSyncExternalStore requires a stable value between notifications.
 */
const listeners = new Set<() => void>();
let cachedPreference: ThemePreference | null = null;
let cachedResolved: ResolvedTheme | null = null;

function emit() {
  cachedPreference = null;
  cachedResolved = null;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  // The OS theme only matters while the viewer has not chosen explicitly; `storage`
  // keeps other tabs of the same app in sync.
  media.addEventListener("change", emit);
  window.addEventListener("storage", emit);
  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", emit);
    window.removeEventListener("storage", emit);
  };
}

function preferenceSnapshot(): ThemePreference {
  cachedPreference ??= readStoredTheme();
  return cachedPreference;
}

function resolvedSnapshot(): ResolvedTheme {
  cachedResolved ??= resolveTheme(preferenceSnapshot());
  return cachedResolved;
}

// The server cannot know either value; React re-renders with the client snapshot on hydration.
const serverPreference = (): ThemePreference => "system";
const serverResolved = (): ResolvedTheme => "light";

interface ThemeContextValue {
  /** What the viewer chose: an explicit theme, or "system" to follow the OS. */
  preference: ThemePreference;
  /** The theme actually rendering right now. */
  resolved: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const preference = useSyncExternalStore(subscribe, preferenceSnapshot, serverPreference);
  const resolved = useSyncExternalStore(subscribe, resolvedSnapshot, serverResolved);

  const setPreference = useCallback((next: ThemePreference) => {
    applyTheme(next);
    storeTheme(next);
    emit();
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside <ThemeProvider>");
  return context;
}
