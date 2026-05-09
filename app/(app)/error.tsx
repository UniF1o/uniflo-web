// (app) error boundary — rendered when any nested authenticated page throws
// during SSR or React rendering.
//
// Next.js requires this file to be a Client Component (it receives a `reset`
// callback that re-renders the segment without a full page reload). The boundary
// is intentionally minimal: it doesn't try to debug the failure inline, just
// gives the student a clean recovery path (retry) and an exit (dashboard).
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DotCluster } from "@/components/ui/motifs";

interface ErrorProps {
  // The thrown value. Next.js wraps non-Error throws so this is always an Error.
  error: Error & { digest?: string };
  // Re-renders the segment that threw, giving us a "try again" button.
  reset: () => void;
}

export default function AppError({ error, reset }: ErrorProps) {
  // Log to the browser console so dev sessions still see the stack trace.
  // Sentry hookup is intentionally deferred — this file just handles the UX.
  useEffect(() => {
    console.error("[(app)/error]", error);
  }, [error]);

  return (
    <div className="grid place-items-center py-16 md:py-24">
      <Card
        variant="elevated"
        className="relative w-full max-w-md overflow-hidden p-8 text-center md:p-10"
      >
        {/* Tiny decorative motif so the page doesn't feel like a 500-style
         * dead-end. Cobalt picks up the brand. */}
        <DotCluster aria-hidden className="mx-auto h-8 w-12 text-primary" />

        <div className="mt-5 space-y-2">
          <h1 className="font-display text-3xl tracking-tight text-foreground md:text-4xl">
            Something went wrong.
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We couldn&rsquo;t load this page. It might be a temporary network
            hiccup. Try again, or head back to your dashboard.
          </p>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button type="button" onClick={reset}>
            Try again
          </Button>
          <Link href="/dashboard" className="contents">
            <Button variant="ghost">Back to dashboard</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
