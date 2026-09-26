import Link from "next/link";

import { Wordmark } from "@/components/layout/wordmark";
import { footerGroups } from "@/lib/config/navigation";
import { siteConfig } from "@/lib/config/site";

/**
 * Minimal editorial footer for public/discovery routes only. Every link points at a route
 * that exists — no invented legal pages, social accounts, addresses or status services.
 * Application routes render no footer so the workspace stays focused.
 */
export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border-subtle">
      <div className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_repeat(4,minmax(0,1fr))]">
          <div>
            <Wordmark />
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-foreground-muted">
              {siteConfig.description}
            </p>
          </div>

          {footerGroups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="editorial-label">{group.title}</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-foreground-muted transition-colors hover:text-accent-text"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="mt-12 border-t border-border-subtle pt-6 text-xs text-foreground-subtle">
          Assessment build — not affiliated with Higgsfield, Inc.
        </p>
      </div>
    </footer>
  );
}
