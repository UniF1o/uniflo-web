// Sticker — a rotated stamp-style label used to mark something complete in
// the dashboard mockup ("Submitted ✓"). Looks hand-applied: ringed border,
// slight rotation, dotted outer halo. Inline SVG keeps it scalable and
// theme-aware via `currentColor`.
import { SVGProps } from "react";

interface StickerProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  label?: string;
}

export function Sticker({
  label = "Submitted",
  className,
  ...props
}: StickerProps) {
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox="0 0 140 140"
      fill="none"
      className={className}
      {...props}
    >
      {/* Outer dotted halo gives the stamp a hand-applied feel. */}
      <circle
        cx="70"
        cy="70"
        r="64"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="1 5"
        opacity="0.55"
      />
      {/* Inner ring — solid stroke, slightly thicker. */}
      <circle cx="70" cy="70" r="54" stroke="currentColor" strokeWidth="2.5" />
      {/* Tick mark above the label. */}
      <path
        d="M52 64 L 64 76 L 88 52"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Label — uses the display font so it feels editorial, not utilitarian. */}
      <text
        x="70"
        y="98"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize="18"
        fill="currentColor"
        letterSpacing="0.15em"
      >
        {label.toUpperCase()}
      </text>
    </svg>
  );
}
