// Marquee — infinite right-to-left horizontal scroll. Children are
// duplicated once so translating by -50% lands on the seam invisibly,
// which is what makes the loop feel continuous.
//
// Speed is chosen via a coarse `speed` prop that maps to a CSS custom
// property; tweak the mapping rather than asking callers for raw seconds.
// Hovering the track pauses it (so users can read a card), and
// `prefers-reduced-motion` hides the animation entirely — the children
// then render as a stationary, scrollable row.
import { Children } from "react";
import { cn } from "@/lib/utils/cn";

interface MarqueeProps {
  children: React.ReactNode;
  // Pixels-per-second feel: slow ≈ leisurely, medium ≈ steady, fast = brisk.
  speed?: "slow" | "medium" | "fast";
  // Show a soft fade at the left/right edges so items appear from
  // nowhere rather than popping in at a hard line.
  edgeFade?: boolean;
  className?: string;
}

const SPEED_DURATION: Record<NonNullable<MarqueeProps["speed"]>, string> = {
  slow: "60s",
  medium: "40s",
  fast: "25s",
};

export function Marquee({
  children,
  speed = "medium",
  edgeFade = true,
  className,
}: MarqueeProps) {
  const items = Children.toArray(children);

  return (
    <div
      // `group/marquee` lets the inner track react to hover on the parent.
      // The custom property feeds into the keyframe duration.
      className={cn(
        "group/marquee relative isolate w-full overflow-hidden",
        className,
      )}
      style={{ ["--marquee-duration" as string]: SPEED_DURATION[speed] }}
    >
      {edgeFade && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent md:w-24"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent md:w-24"
          />
        </>
      )}

      <div
        // `w-max` so the track is wider than the container; `flex` so we can
        // gap the duplicated items consistently. `motion-reduce` short-circuits
        // the animation per OS preference.
        className={cn(
          "flex w-max items-stretch gap-4 py-4",
          "animate-[marquee_var(--marquee-duration)_linear_infinite]",
          "group-hover/marquee:[animation-play-state:paused]",
          "motion-reduce:animate-none",
        )}
      >
        {/* Render the children twice so the visual loop is seamless. The
         * second pass is aria-hidden so screen readers don't read it twice. */}
        {items.map((child, i) => (
          <div key={`a-${i}`} className="shrink-0">
            {child}
          </div>
        ))}
        {items.map((child, i) => (
          <div key={`b-${i}`} aria-hidden className="shrink-0">
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
