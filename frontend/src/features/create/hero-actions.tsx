"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

/**
 * The hero's primary action. Signed in, it scrolls to the four workflows rather than
 * assuming a medium; signed out, it goes to signup with `next` pointing back here so the
 * visitor lands on Create with the same choice in front of them.
 */
export function HeroActions() {
  const { user, isLoading } = useAuth();
  const primaryHref = user ? "#creative-modes" : "/signup?next=%2F";

  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      <Button asChild size="lg" className="rounded-none shadow-none">
        <Link href={primaryHref} aria-disabled={isLoading || undefined}>
          Start creating
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </Button>
      <Link
        href="/community"
        className="inline-flex h-12 items-center border-b border-transparent px-1 text-[15px] text-foreground-muted transition-colors hover:border-accent hover:text-foreground"
      >
        Explore work
      </Link>
    </div>
  );
}
