// SectionHeading — the eyebrow + headline + optional sub-line that opens
// every section on the landing page. Single source of truth for section
// rhythm: spacing, font choices, and the optional accent squiggle under
// one accented word.
//
// Pass `accentText` to highlight a single word (or short phrase) in the
// cobalt primary colour with a hand-drawn squiggle underneath. The squiggle
// "draws" itself in via stroke-dashoffset once the heading scrolls into
// view (stroke-dasharray rule lives in globals.css under .section-squiggle).
"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { Squiggle } from "@/components/ui/motifs";
import { cn } from "@/lib/utils/cn";

// Avoid the SSR warning for useLayoutEffect by falling back to useEffect
// on the server. The hook only runs on the client either way.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface SectionHeadingProps {
  eyebrow?: string;
  // The headline text. If `accentText` is provided, the first occurrence of
  // it will be wrapped in the accent colour + squiggle treatment.
  title: string;
  accentText?: string;
  // Sub-line rendered under the headline.
  description?: string;
  // Center-align the heading block (used for full-width sections like FAQ).
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  accentText,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  // Split the title around the accent text, if provided. Falls back to the
  // raw title when there's no match (e.g. punctuation got in the way).
  const parts =
    accentText && title.includes(accentText) ? title.split(accentText) : null;

  // Drives the squiggle stroke-dashoffset transition. The wrapper around
  // the squiggle gets `.in-view` once the squiggle has scrolled past the
  // top half of the viewport, which triggers the CSS transition defined in
  // globals.css. State is mutated directly on the DOM (classList) rather
  // than via React state to keep the reveal mechanic out of the render
  // cycle (and out of the react-hooks/set-state-in-effect lint rule).
  // Reduced motion bypasses the observer entirely — the global rule in
  // globals.css forces stroke-dashoffset to 0 in that case.
  const squiggleRef = useRef<HTMLSpanElement>(null);

  useIsoLayoutEffect(() => {
    if (!parts) return;
    const el = squiggleRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("in-view");
      return;
    }
    // If the squiggle is already on screen at mount (e.g. above the fold
    // hero), draw it immediately so it doesn't sit empty.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 48) {
      el.classList.add("in-view");
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("in-view");
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [parts]);

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow && (
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {eyebrow}
        </span>
      )}
      <h2 className="max-w-3xl font-display text-3xl leading-[1.05] tracking-tight text-foreground md:text-5xl">
        {parts ? (
          <>
            {parts[0]}
            <span className="relative inline-block">
              <span className="text-primary">{accentText}</span>
              {/* The squiggle wrapper carries the `section-squiggle` class
               * — globals.css applies the dasharray + transition to its
               * inner <path>. Toggling `in-view` triggers the draw. */}
              <span
                ref={squiggleRef}
                aria-hidden
                className="section-squiggle pointer-events-none absolute -bottom-2 left-0 block h-3 w-full text-primary"
              >
                <Squiggle className="h-full w-full" />
              </span>
            </span>
            {parts.slice(1).join(accentText)}
          </>
        ) : (
          title
        )}
      </h2>
      {description && (
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}
