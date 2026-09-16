import Link from "next/link";

import { footerColumns } from "@/lib/config/nav";

const socialLinks = ["X / Twitter", "Youtube", "LinkedIn", "Tiktok"];
const legalLinks = [
  { label: "Help center", href: "/academy" },
  { label: "Cookie Notice", href: "/pricing" },
  { label: "Terms", href: "/pricing" },
  { label: "Privacy", href: "/pricing" },
];

/** Full-bleed lime sitemap footer from the reference (`212104.png`). */
export function SiteFooter() {
  return (
    <footer className="mt-16">
      <div className="bg-accent px-4 py-12 text-accent-foreground sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(6,minmax(0,1fr))]">
          <p className="display-heading text-3xl sm:text-4xl">
            AI-native
            <br />
            creative suite
          </p>
          {footerColumns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h3 className="mb-4 text-[15px] text-black/55">{column.title}</h3>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-[15px] hover:underline">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-14 flex flex-col gap-4 text-[15px] sm:flex-row sm:items-center sm:justify-between">
          <p>535 Mission St, 14th floor, San Francisco, CA, 94105</p>
          <ul className="flex flex-wrap gap-6 font-medium">
            {socialLinks.map((label) => (
              <li key={label}>
                <span className="cursor-default">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex flex-col gap-3 px-4 py-5 text-[13px] text-text-secondary sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>© 2026 Higgsfield clone — assessment build, not affiliated with Higgsfield, Inc.</p>
        <ul className="flex flex-wrap gap-5">
          <li className="text-text-primary">🇺🇸 English</li>
          {legalLinks.map((link) => (
            <li key={link.label}>
              <Link href={link.href} className="hover:text-text-primary">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
