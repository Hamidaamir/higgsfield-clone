import { Wordmark } from "@/components/layout/wordmark";
import { ThemeMenu } from "@/components/theme/theme-menu";

/**
 * Minimal header for the authentication pages: the wordmark home link and the theme control,
 * nothing else. Product navigation and account controls are deliberately absent so signing in
 * stays focused, while the page still reads as the same product.
 */
export function AuthHeader() {
  return (
    <header className="border-b border-border-subtle">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-4 sm:px-6">
        <Wordmark />
        <ThemeMenu />
      </div>
    </header>
  );
}
