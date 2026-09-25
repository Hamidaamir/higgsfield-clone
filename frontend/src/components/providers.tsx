"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";

import { ThemeProvider, useTheme } from "@/components/theme/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>{children}</TooltipProvider>
        <ThemedToaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

/** Sonner needs the resolved theme explicitly; tokens handle the rest. */
function ThemedToaster() {
  const { resolved } = useTheme();
  return (
    <Toaster
      theme={resolved}
      position="top-right"
      offset={72}
      toastOptions={{
        classNames: {
          toast: "!bg-surface-raised !border-border-default !text-foreground",
          description: "!text-foreground-muted",
        },
      }}
    />
  );
}
