// Stat — a single proof-point on the landing page (e.g. "26 universities").
// Two-line vertical block: large display number in the editorial serif,
// small uppercase label underneath. Optional accent on the value's leading
// glyph to keep the trio in the social-proof bar visually rhythmic.
//
// `countUp` (default true) animates the numeric portion of `value` from 0
// up to its target when the element scrolls into view. Any non-numeric
// suffix on the value (e.g. "+", "%") is preserved during the count.
"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  // The headline value, e.g. "26", "40+", "100%".
  value: string;
  // The label underneath, e.g. "universities covered".
  label: string;
  // Optional small caption rendered below the label in the script font, used
  // for human-feeling annotations like "and counting".
  note?: string;
  // Animate the number from 0 → target on intersection. Defaults to true;
  // pass `false` for static stats (e.g. tables, dashboards) where the
  // count-up would be a distraction.
  countUp?: boolean;
}

// Splits a value like "40+" into its numeric prefix (40) and string suffix
// ("+"). Returns null if the value doesn't start with a parseable number,
// in which case the component renders the value verbatim with no animation.
function parseNumeric(
  value: string,
): { target: number; suffix: string } | null {
  const match = value.match(/^(\d+)(.*)$/);
  if (!match) return null;
  return { target: parseInt(match[1], 10), suffix: match[2] ?? "" };
}

export function Stat({
  value,
  label,
  note,
  countUp = true,
  className,
  ...props
}: StatProps) {
  const ref = useRef<HTMLSpanElement>(null);
  // Initial state is the final value so SSR + no-JS render sensibly. The
  // observer will swap to "0" + tween up only when JS + motion are enabled.
  const [display, setDisplay] = useState(value);

  // Effect deps are the stable primitives `countUp` + `value` (a string).
  // Earlier this depended on `parsed` (a fresh object every render), which
  // caused the effect to re-run on every state update — restarting the
  // observer mid-tween and stacking competing rAF loops, producing a
  // visible flicker as multiple tweens fought to write the display value.
  // The `cancelled` flag also pulls the rug out from any in-flight rAF
  // loop on unmount or value change so a stale tick can't overwrite a
  // newer setDisplay call.
  useEffect(() => {
    const el = ref.current;
    if (!el || !countUp) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const parsed = parseNumeric(value);
    if (!parsed) return;

    let cancelled = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        const start = performance.now();
        const dur = 1400;
        // Cubic ease-out so the count slows toward the target rather than
        // ticking at constant speed.
        const tick = (t: number) => {
          if (cancelled) return;
          const p = Math.min(1, (t - start) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          const n = Math.round(eased * parsed.target);
          setDisplay(`${n}${parsed.suffix}`);
          if (p < 1) requestAnimationFrame(tick);
        };
        // Snap to 0 immediately, then animate up.
        setDisplay(`0${parsed.suffix}`);
        requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );

    observer.observe(el);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [countUp, value]);

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 text-center sm:items-start sm:text-left",
        className,
      )}
      {...props}
    >
      <span
        ref={ref}
        className="font-display text-5xl leading-none tracking-tight text-foreground md:text-6xl"
      >
        {display}
      </span>
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      {note && <span className="font-script text-lg text-primary">{note}</span>}
    </div>
  );
}
