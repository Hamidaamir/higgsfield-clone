import Link from "next/link";

import { Badge, navBadgeVariant } from "@/components/ui/badge";
import { LogoMark } from "@/components/layout/logo";
import type { MegaMenu as MegaMenuData } from "@/lib/config/nav";

interface MegaMenuProps {
  menu: MegaMenuData;
  onNavigate?: () => void;
}

/** Two-column dropdown (Features / Models) matching the reference nav menus. */
export function MegaMenu({ menu, onNavigate }: MegaMenuProps) {
  return (
    <div className="grid max-h-[min(78vh,820px)] w-[880px] max-w-[calc(100vw-2rem)] grid-cols-2 gap-x-6 overflow-y-auto rounded-2xl border border-border bg-surface-elevated p-4 shadow-menu scrollbar-thin">
      <section aria-label="Features">
        <h3 className="px-2 pb-2 text-[13px] font-medium text-text-secondary">Features</h3>
        <ul className="space-y-0.5">
          {menu.features.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className="group flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-muted"
              >
                <span className="relative flex size-11 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-text-primary group-hover:bg-surface-hover">
                  <item.icon className="size-5" aria-hidden />
                  {item.badge ? (
                    <Badge variant={navBadgeVariant(item.badge)} className="absolute -left-1 -top-1.5">
                      {item.badge}
                    </Badge>
                  ) : null}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-text-primary">{item.label}</span>
                  <span className="block truncate text-[13px] text-text-secondary">{item.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section aria-label="Models">
        <h3 className="px-2 pb-2 text-[13px] font-medium text-text-secondary">Models</h3>
        <ul className="space-y-0.5">
          {menu.models.map((model) => (
            <li key={model.id}>
              <Link
                href={model.href}
                onClick={onNavigate}
                className="group flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-muted"
              >
                <span className="relative flex size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-text-primary">
                  <LogoMark className="size-5" />
                  {model.badge ? (
                    <Badge variant={navBadgeVariant(model.badge)} className="absolute -left-1 -top-1.5">
                      {model.badge}
                    </Badge>
                  ) : null}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-text-primary">{model.name}</span>
                  <span className="block truncate text-[13px] text-text-secondary">{model.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
