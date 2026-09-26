"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { studioItems } from "@/lib/config/navigation";
import { cn } from "@/lib/utils";

/**
 * The Studio panel: the four real workspaces, nothing else. It replaces the old dense
 * mega menu deliberately — catalogs and preview tools live in Explore, not here, so this
 * panel never implies a workspace exists when it does not.
 *
 * Radix Popover supplies the dialog semantics, Escape handling and outside-click behaviour;
 * the contents are ordinary links so Tab order and "open in new tab" work as expected.
 */
export function StudioMenu({ active }: { active: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-8 items-center gap-1 text-[13px] transition-colors",
            active ? "text-accent-text" : "text-foreground-muted hover:text-foreground",
          )}
        >
          Studio
          <ChevronDown
            className={cn("size-3.5 transition-transform", open && "rotate-180")}
            aria-hidden
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={14}
        className="w-[min(92vw,26rem)] rounded-none border-border-default p-0 shadow-float"
      >
        <p className="editorial-label border-b border-border-subtle px-4 py-3">Studio</p>
        <ul className="p-1.5">
          {studioItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className="group flex items-start gap-3 px-2.5 py-2.5 transition-colors hover:bg-surface-subtle"
              >
                <item.icon
                  className="mt-0.5 size-4 shrink-0 text-foreground-subtle transition-colors group-hover:text-accent-text"
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">{item.label}</span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-foreground-muted">
                    {item.description}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
