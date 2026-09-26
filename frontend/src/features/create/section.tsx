import type { ReactNode } from "react";

/** Shared section frame so every Create block sits on the same rhythm. Server-safe. */
export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const id = title.toLowerCase().replace(/\s+/g, "-");
  return (
    <section aria-labelledby={id} className="border-t border-border-subtle py-12 sm:py-16">
      <div className="flex items-end justify-between gap-4">
        <h2 id={id} className="editorial-label">
          {title}
        </h2>
        {action}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** Six-up contact sheet on desktop, two-up on phones. */
export function ContactSheet({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">{children}</div>;
}
