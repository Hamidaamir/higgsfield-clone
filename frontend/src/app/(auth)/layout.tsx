import type { ReactNode } from "react";

/** Auth pages render the two-pane card over a dimmed backdrop, like the reference modal. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <section className="relative flex min-h-[calc(100vh-3.5rem)] items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,var(--accent-subtle),transparent_70%)]"
      />
      {children}
    </section>
  );
}
