"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";

import { AccountControls, AccountPanel } from "@/components/layout/account-controls";
import { StudioMenu } from "@/components/layout/studio-menu";
import { Wordmark } from "@/components/layout/wordmark";
import { ThemeMenu } from "@/components/theme/theme-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { activeSection, navSections, studioItems } from "@/lib/config/navigation";
import { cn } from "@/lib/utils";

/**
 * Editorial header: wordmark, four sections, theme and account. One hairline rule, no
 * background fill, no chrome. The active section is shown with accent text and nothing
 * else — a single restrained treatment.
 */
export function TopNav() {
  const pathname = usePathname();
  const current = activeSection(pathname);

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-canvas/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-4 px-4 sm:px-6">
        <Wordmark />

        <nav aria-label="Primary" className="hidden flex-1 justify-center lg:flex">
          <ul className="flex items-center gap-7">
            {navSections.map((section) =>
              section.id === "studio" ? (
                <li key={section.id}>
                  <StudioMenu active={current === "studio"} />
                </li>
              ) : (
                <li key={section.id}>
                  <Link
                    href={section.href as string}
                    aria-current={current === section.id ? "page" : undefined}
                    className={cn(
                      "inline-flex h-8 items-center text-[13px] transition-colors",
                      current === section.id
                        ? "text-accent-text"
                        : "text-foreground-muted hover:text-foreground",
                    )}
                  >
                    {section.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <ThemeMenu />
          <span className="mx-1 hidden h-4 w-px bg-border-subtle lg:block" aria-hidden />
          <Suspense fallback={<span className="h-8 w-24 skeleton-shimmer" aria-hidden />}>
            <div className="hidden lg:block">
              <AccountControls />
            </div>
          </Suspense>
          <MobileNav current={current} />
        </div>
      </div>
    </header>
  );
}

function MobileNav({ current }: { current: ReturnType<typeof activeSection> }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
          <Menu className="size-5" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-overlay lg:hidden" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-50 flex w-[88vw] max-w-sm flex-col border-l border-border-default bg-canvas focus:outline-none lg:hidden"
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-border-subtle px-4">
            <Dialog.Title className="editorial-label">Menu</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close navigation">
                <X className="size-5" />
              </Button>
            </Dialog.Close>
          </div>

          <nav aria-label="Mobile" className="flex-1 overflow-y-auto scrollbar-thin px-4 py-5">
            <ul className="flex flex-col">
              {navSections.map((section) =>
                section.id === "studio" ? (
                  // Studio is expanded inline: the four workspaces are one tap away, not nested.
                  <li key={section.id} className="py-3">
                    <p
                      className={cn(
                        "editorial-label",
                        current === "studio" && "text-accent-text",
                      )}
                    >
                      Studio
                    </p>
                    <ul className="mt-2 flex flex-col border-l border-border-subtle">
                      {studioItems.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={close}
                            aria-current={pathname === item.href ? "page" : undefined}
                            className={cn(
                              "flex items-center gap-3 py-2.5 pl-4 text-[15px] transition-colors",
                              pathname === item.href ? "text-accent-text" : "text-foreground",
                            )}
                          >
                            <item.icon className="size-4 shrink-0 text-foreground-subtle" aria-hidden />
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                ) : (
                  <li key={section.id} className="border-b border-border-subtle last:border-b-0">
                    <Link
                      href={section.href as string}
                      onClick={close}
                      aria-current={current === section.id ? "page" : undefined}
                      className={cn(
                        "block py-3.5 text-[17px] transition-colors",
                        current === section.id ? "text-accent-text" : "text-foreground",
                      )}
                    >
                      {section.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </nav>

          <div className="shrink-0 border-t border-border-subtle px-4 py-4">
            <Suspense fallback={<span className="block h-10 w-full skeleton-shimmer" aria-hidden />}>
              <AccountPanel onNavigate={close} />
            </Suspense>
            <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-4">
              <span className="editorial-label">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
