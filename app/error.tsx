"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-20">
      <h1 className="font-serif text-4xl">The desk hit a problem loading this page.</h1>
      <p className="mt-3 text-sm leading-6 text-muted">Nothing was sent to a real firm. You can try the page again.</p>
      <Button className="mt-6" onClick={() => reset()}>
        Try again
      </Button>
    </main>
  );
}
