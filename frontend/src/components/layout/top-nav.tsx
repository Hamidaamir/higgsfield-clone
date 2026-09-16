"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Globe, Menu, Sparkles, Tag, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { AccountControls } from "@/components/layout/account-controls";
import { Logo } from "@/components/layout/logo";
import { MegaMenu } from "@/components/layout/mega-menu";
import { Badge, navBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { megaMenus, primaryNav, type MegaMenuKey } from "@/lib/config/nav";
import { cn } from "@/lib/utils";

const HOVER_CLOSE_DELAY_MS = 120;

export function TopNav() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<MegaMenuKey | null>(null);
  const closeTimer = useRef<number | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpenMenu(null), HOVER_CLOSE_DELAY_MS);
  }, [cancelClose]);

  const closeMenu = useCallback(() => setOpenMenu(null), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenMenu(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href.split("?")[0]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="relative flex h-14 items-center gap-2 px-3 sm:px-4">
        <Logo />

        <nav aria-label="Primary" className="relative hidden min-w-0 flex-1 lg:block">
          <ul className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
            {primaryNav.map((item) => {
              const active = isActive(item.href);
              const hasMenu = Boolean(item.menu);
              const expanded = hasMenu && openMenu === item.menu;
              return (
                <li
                  key={item.label}
                  className="shrink-0"
                  onMouseEnter={() => {
                    cancelClose();
                    setOpenMenu(item.menu ?? null);
                  }}
                  onMouseLeave={scheduleClose}
                >
                  <Link
                    href={item.href}
                    aria-haspopup={hasMenu ? "menu" : undefined}
                    aria-expanded={hasMenu ? expanded : undefined}
                    onFocus={() => setOpenMenu(item.menu ?? null)}
                    onClick={closeMenu}
                    className={cn(
                      "flex h-8 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium transition-colors",
                      active
                        ? "text-accent"
                        : expanded
                          ? "bg-surface-muted text-text-primary"
                          : "text-text-secondary hover:text-text-primary",
                    )}
                  >
                    {item.label}
                    {item.badge ? <Badge variant={navBadgeVariant(item.badge)}>{item.badge}</Badge> : null}
                  </Link>
                </li>
              );
            })}
          </ul>

          {openMenu ? (
            <div
              className="absolute left-0 top-full z-50 pt-2"
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
            >
              <MegaMenu menu={megaMenus[openMenu]} onNavigate={closeMenu} />
            </div>
          ) : null}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <Link
            href="/pricing"
            className="relative hidden h-8 items-center gap-1.5 rounded-lg bg-surface-muted px-3 text-[13px] font-semibold text-text-primary hover:bg-surface-hover md:flex"
          >
            <Tag className="size-3.5" aria-hidden />
            Pricing
            <Badge variant="promo" className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 text-[9px]">
              30% OFF
            </Badge>
          </Link>
          <Link
            href="/enterprise"
            className="hidden h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold text-text-secondary hover:text-text-primary md:flex"
          >
            <Sparkles className="size-3.5" aria-hidden />
            Enterprise
          </Link>
          <button
            type="button"
            aria-label="Language"
            className="hidden size-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-muted hover:text-text-primary md:flex"
          >
            <Globe className="size-4" />
          </button>
          <span className="mx-1 hidden h-5 w-px bg-border md:block" aria-hidden />
          <AccountControls />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}

function MobileNav() {
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
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-[86vw] max-w-sm flex-col border-l border-border bg-surface p-4 shadow-menu focus:outline-none lg:hidden">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold">Menu</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close navigation">
                <X className="size-5" />
              </Button>
            </Dialog.Close>
          </div>
          <nav aria-label="Mobile" className="mt-4 flex-1 overflow-y-auto scrollbar-thin">
            <ul className="space-y-0.5">
              {primaryNav.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={close}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2.5 text-[15px] font-medium hover:bg-surface-muted",
                      pathname === item.href ? "text-accent" : "text-text-primary",
                    )}
                  >
                    {item.label}
                    {item.badge ? <Badge variant={navBadgeVariant(item.badge)}>{item.badge}</Badge> : null}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/pricing" onClick={close} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[15px] font-medium hover:bg-surface-muted">
                  Pricing <Badge variant="promo">30% OFF</Badge>
                </Link>
              </li>
              <li>
                <Link href="/enterprise" onClick={close} className="block rounded-lg px-3 py-2.5 text-[15px] font-medium hover:bg-surface-muted">
                  Enterprise
                </Link>
              </li>
            </ul>
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
