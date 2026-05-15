// Global 404 — rendered for any unmatched URL across the entire app.
//
// Lives at the root so a single screen catches misses across both the
// public marketing tree and the authenticated (app) routes. Carries the
// brand washes + sprout motif so a wrong URL still feels like Uniflo.
import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/layout/brand-mark";
import { Card } from "@/components/ui/card";
import { buttonClasses } from "@/components/ui/button";
import { Sprout } from "@/components/ui/motifs";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      {/* Same atmospheric washes as the landing page so 404 lands on the
       * brand surface, not a stark white default. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[80vh] bg-[radial-gradient(ellipse_70%_60%_at_85%_5%,_var(--color-soft)_0%,_transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[120vh] bg-[radial-gradient(ellipse_55%_50%_at_92%_50%,_var(--color-primary)_0%,_transparent_65%)] opacity-[0.06]"
      />

      <header className="flex h-16 items-center px-6 md:px-10">
        <BrandMark />
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <Card
          variant="elevated"
          className="relative w-full max-w-md overflow-hidden p-8 text-center md:p-10"
        >
          <Sprout
            aria-hidden
            className="mx-auto h-9 w-9 origin-bottom text-primary [animation:sway_6s_ease-in-out_infinite] motion-reduce:animate-none"
          />

          <div className="mt-6 space-y-2">
            <p className="font-display text-6xl leading-none tracking-tight text-primary md:text-7xl">
              404
            </p>
            <h1 className="font-display text-2xl tracking-tight text-foreground md:text-3xl">
              We can&rsquo;t find that page.
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              The link might be stale or the page may have moved. Head home and
              we&rsquo;ll get you back on track.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/" className={buttonClasses({ variant: "primary" })}>
              Back home
            </Link>
            <Link
              href="/dashboard"
              className={buttonClasses({ variant: "ghost" })}
            >
              Go to dashboard
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
