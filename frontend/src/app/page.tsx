import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ExplorePage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-widest text-text-secondary">Explore</p>
      <h1 className="display-heading mt-4 text-5xl sm:text-7xl">
        AI-native
        <br />
        <span className="text-accent">creative suite</span>
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-lg text-text-secondary">
        Generate images, videos and speech with the latest models. Explore content is coming in the visual
        fidelity milestone.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/generate/image">Start creating</Link>
        </Button>
        <Button asChild size="lg" variant="secondary">
          <Link href="/system">System status</Link>
        </Button>
      </div>
    </section>
  );
}
