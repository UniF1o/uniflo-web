// Root error boundary — catches throws on the marketing landing and the
// auth flow (which sit outside the (app) route group).
//
// Next.js requires this to be a Client Component because it receives a
// `reset` callback from the framework. Kept minimal — surface a clear
// recovery path, no stack trace in the UI.
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/layout/brand-mark";
import { Card } from "@/components/ui/card";
import { Button, buttonClasses } from "@/components/ui/button";
import { DotCluster } from "@/components/ui/motifs";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[root/error]", error);
  }, [error]);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[80vh] bg-[radial-gradient(ellipse_70%_60%_at_85%_5%,_var(--color-soft)_0%,_transparent_60%)]"
      />

      <header className="flex h-16 items-center px-6 md:px-10">
        <BrandMark />
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <Card
          variant="elevated"
          className="relative w-full max-w-md overflow-hidden p-8 text-center md:p-10"
        >
          <DotCluster aria-hidden className="mx-auto h-8 w-12 text-primary" />

          <div className="mt-6 space-y-2">
            <h1 className="font-display text-3xl tracking-tight text-foreground md:text-4xl">
              Something broke.
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We hit an unexpected error loading the page. Try again, or head
              home and start fresh.
            </p>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button type="button" onClick={reset}>
              Try again
            </Button>
            <Link href="/" className={buttonClasses({ variant: "ghost" })}>
              Back home
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
