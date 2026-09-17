"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";

import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;
export const TabsContent = TabsPrimitive.Content;

export const TabsList = forwardRef<ElementRef<typeof TabsPrimitive.List>, ComponentPropsWithoutRef<typeof TabsPrimitive.List>>(
  function TabsList({ className, ...props }, ref) {
    return (
      <TabsPrimitive.List
        ref={ref}
        className={cn("inline-flex h-10 items-center gap-1 rounded-xl border border-border bg-surface p-1", className)}
        {...props}
      />
    );
  },
);

export const TabsTrigger = forwardRef<
  ElementRef<typeof TabsPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(function TabsTrigger({ className, ...props }, ref) {
  // Every Tabs in this app is a segmented filter with no TabsContent panel, so the Radix
  // aria-controls would point at a missing id (an axe "critical"). Callers rendering
  // TabsContent can pass aria-controls explicitly to restore it.
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      aria-controls={undefined}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold text-text-secondary transition-colors hover:text-text-primary data-[state=active]:bg-surface-muted data-[state=active]:text-text-primary",
        className,
      )}
      {...props}
    />
  );
});
