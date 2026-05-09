// DashboardMockup — a stylised, pure-Tailwind preview of the application
// status dashboard, used as the hero illustration.
//
// Animation layers (all gated by motion-reduce / prefers-reduced-motion):
//   • float-mockup — the rotated card breathes up and down
//   • stamp-in     — Submitted sticker plonks in with a tiny overshoot
//   • progress-fill — the cobalt progress bar fills on load
//   • caret-step   — a vertical caret walks down the rows
//   • row-pulse    — the row the caret is sitting on glows softly
//
// The caret/pulse loop is driven by a small client-side interval so the
// "current row" stays in sync with the caret without juggling staggered
// CSS delays across three siblings. Server-rendered fallback (caret hidden,
// no current row) renders cleanly when JS is disabled.
"use client";

import { useEffect, useState } from "react";
import { Sticker, DotCluster } from "@/components/ui/motifs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

interface MockRow {
  university: string;
  programme: string;
  tone: "success" | "warning" | "info";
  label: string;
}

const ROWS: MockRow[] = [
  {
    university: "University of Cape Town",
    programme: "BSc Computer Science",
    tone: "success",
    label: "Submitted",
  },
  {
    university: "Wits University",
    programme: "BCom Accounting",
    tone: "warning",
    label: "Processing",
  },
  {
    university: "Stellenbosch University",
    programme: "BEng Mechatronic",
    tone: "info",
    label: "Ready to submit",
  },
];

// How long each row sits as the "current" row before the caret moves on.
// 8s caret-step keyframe ÷ 3 rows ≈ 2.7s per stop.
const ROW_DWELL_MS = 2700;

export function DashboardMockup() {
  // Tracks which row should glow. Starts at the first row so SSR + first
  // paint look identical and there's no flash. The interval cycles it on
  // mount only when reduced-motion is not requested.
  const [currentRow, setCurrentRow] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setCurrentRow((i) => (i + 1) % ROWS.length);
    }, ROW_DWELL_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative isolate w-full max-w-md">
      {/* Soft sky tint slab behind the mock — the rotation here is the
       * opposite direction of the card's, so they pinch toward each other
       * and feel layered rather than stacked. */}
      <div
        aria-hidden
        className="absolute -inset-x-3 -inset-y-4 -z-10 rotate-[-2deg] rounded-3xl bg-soft/70"
      />

      {/* Decorative dot scatter — sits just outside the upper-left corner
       * to break the rectangle. */}
      <DotCluster className="absolute -left-6 -top-6 h-8 w-12 text-primary" />

      {/* Submitted stamp — stamps in with overshoot 2.1s after mount so it
       * lands after the hero copy has settled. The translate-y in the keyframe
       * ends at rotate(12deg) so the resting transform stays consistent with
       * the original static rotate-12. */}
      <Sticker
        label="Submitted"
        // opacity-0 + animation: stamp-in handles the entrance. After the
        // animation completes (forwards), the final keyframe leaves opacity:1
        // + rotate(12deg) so the sticker stays pinned. Reduced motion shows
        // it immediately at its rest state.
        className={cn(
          "absolute -right-8 -top-10 h-24 w-24 rotate-12 text-primary opacity-0 drop-shadow-sm",
          "[animation:stamp-in_0.9s_cubic-bezier(0.34,1.56,0.64,1)_forwards]",
          "[animation-delay:2.1s]",
          "motion-reduce:opacity-100 motion-reduce:animate-none",
        )}
      />

      <div
        className={cn(
          "rounded-2xl border border-foreground/10 bg-background p-5 shadow-[var(--shadow-soft)]",
          // Floats while keeping the slight resting rotation. The keyframe
          // ranges 1.2deg ↔ 1.6deg so the hover is felt as drift, not spin.
          "[animation:float-mockup_7s_ease-in-out_infinite]",
          "motion-reduce:animate-none motion-reduce:rotate-[1.2deg]",
        )}
      >
        {/* Window chrome — three dots so it reads as a UI window. */}
        <div className="flex items-center gap-1.5 pb-4">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
          <span className="ml-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Applications · 2026
          </span>
        </div>

        {/* Mock rows — relative parent so the caret can be absolutely positioned
         * against the row stack and walk down it. */}
        <ul className="relative flex flex-col gap-3">
          {/* Walking caret — small vertical bar that steps down through the
           * three rows on a continuous loop. The keyframe percentages are
           * tuned to the row height + gap (≈56px). Hidden on motion-reduce. */}
          <span
            aria-hidden
            className={cn(
              "absolute -left-3.5 top-3 h-7 w-1.5 rounded-full bg-primary",
              "shadow-[0_0_0_4px_rgba(31,78,216,0.15)]",
              "[animation:caret-step_8s_ease-in-out_infinite]",
              "motion-reduce:hidden",
            )}
          />

          {ROWS.map((row, i) => {
            const isCurrent = i === currentRow;
            return (
              <li
                key={row.university}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg border border-border bg-background/80 px-3.5 py-3 transition-colors",
                  // Pulse only on the row the caret is sitting on. Pulled out
                  // of the keyframes since we drive the active state via JS.
                  isCurrent &&
                    "[animation:row-pulse_2.4s_ease-in-out_infinite] motion-reduce:animate-none",
                )}
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {row.university}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {row.programme}
                  </span>
                </div>
                <Badge tone={row.tone} dot>
                  {row.label}
                </Badge>
              </li>
            );
          })}
        </ul>

        {/* Faux progress strip at the bottom — fill width animates from 0%
         * to 60% on mount via progress-fill. Reduced motion sets it to the
         * final 60% state immediately. */}
        <div className="mt-5 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>3 of 5 universities</span>
          <div className="relative h-1.5 w-32 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "absolute inset-y-0 left-0 w-[60%] rounded-full bg-accent",
                "origin-left [animation:progress-fill_2.4s_cubic-bezier(0.22,1,0.36,1)_forwards]",
                "[animation-delay:1.6s]",
                "motion-reduce:animate-none motion-reduce:w-[60%]",
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
