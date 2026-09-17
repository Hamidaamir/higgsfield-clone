"use client";

import { Check } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { artFor } from "@/lib/photos";

const perks = ["Real image, video and speech generation", "Free to sign up — no card, no credits to buy", "Everything you make is saved to History"];

/** Sign-up card from the reference; once signed in it becomes the "continue creating" card. */
export function ExploreAccountCard() {
  const { user, isLoading } = useAuth();
  return (
    <section
      aria-label={user ? "Continue creating" : "Sign up"}
      className="relative overflow-hidden rounded-3xl border border-border bg-surface-elevated"
      style={{ backgroundImage: artFor(user ? "explore-welcome" : "explore-discount") }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-transparent" aria-hidden />
      <div className="relative flex h-full flex-col justify-between gap-6 p-6 sm:p-8">
        <div>
          <h2 className="display-heading text-3xl sm:text-4xl">
            {isLoading ? "Sign up and get your" : user ? `Welcome back, ${user.name.split(" ")[0]}` : "Sign up and get your"}
            <br />
            <span className="text-accent">{user && !isLoading ? "pick up where you left off" : "extra discount"}</span>
          </h2>
          <ul className="mt-4 space-y-1.5 text-sm text-text-secondary">
            {perks.map((perk) => (
              <li key={perk} className="flex items-center gap-2">
                <Check className="size-3.5 text-accent" aria-hidden />
                {perk}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-wrap gap-2">
          {user && !isLoading ? (
            <>
              <Button asChild size="lg">
                <Link href="/generate/image">Create an image</Link>
              </Button>
              <Button asChild size="lg" variant="white">
                <Link href="/history">Open History</Link>
              </Button>
            </>
          ) : (
            <Button asChild size="lg" className="shadow-accent">
              <Link href="/signup">Sign up and get your discount</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
