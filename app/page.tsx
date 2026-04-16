// Public landing page at `/`. Lives outside both route groups — no navbar or
// sidebar. Gives unauthenticated visitors the value proposition and two clear
// paths: start an application (/signup) or sign back in (/login).
//
// This is a minimal placeholder. The full marketing site is post-MVP.
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandMark } from "@/components/layout/brand-mark";

export default function Home() {
  return (
    <div className="relative flex min-h-dvh flex-col">
      {/* Atmospheric radial wash anchoring the top-right corner. Two layers:
       * a soft terracotta bloom for warmth, and a cooler indigo haze lower
       * down so the right side of a wide viewport never reads as blank.
       * Pointer-events disabled so neither layer ever swallows clicks. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[70vh] bg-[radial-gradient(ellipse_80%_70%_at_85%_10%,_var(--color-accent)_0%,_transparent_60%)] opacity-30"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[100vh] bg-[radial-gradient(ellipse_50%_50%_at_90%_60%,_var(--color-primary)_0%,_transparent_70%)] opacity-[0.06]"
      />

      <header className="flex h-16 items-center px-6 md:px-10">
        <BrandMark />
        <div className="flex-1" />
        <Link
          href="/login"
          className="rounded-full px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
        >
          Sign in
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-start justify-center gap-8 px-6 py-16 md:px-10 md:py-24">
        <div className="max-w-3xl space-y-6">
          {/* Eyebrow label — small pill above the headline grounds the hero. */}
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            For South African students
          </span>

          {/* Display headline — tight leading so the two lines read as one idea. */}
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight text-foreground md:text-7xl">
            Apply to every university.
            <br />
            <span className="text-accent">Fill in one form.</span>
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Uniflo handles the paperwork so you can focus on choosing where to
            study. Enter your details once, review every application, and we
            submit on your behalf.
          </p>
        </div>

        {/* CTA row — primary button is dark/saturated to anchor the eye;
         * secondary is a ghost link so it doesn't compete. */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/signup"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform duration-200 hover:translate-x-0.5"
          >
            Start your application
            <ArrowRight
              size={16}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm text-foreground transition-colors hover:bg-muted"
          >
            I already have an account
          </Link>
        </div>
      </main>

      <footer className="border-t border-border px-6 py-6 text-xs text-muted-foreground md:px-10">
        <p>© {new Date().getFullYear()} Uniflo — Apply smarter.</p>
      </footer>
    </div>
  );
}
