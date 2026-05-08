// Squiggle — hand-drawn underline used beneath a single accent word in a
// heading. Inherits `currentColor` so it tints to whatever text colour
// surrounds it. The SVG ratio is fixed at 200×16; sizing comes from the
// caller via Tailwind classes (`h-3 w-32`, etc.).
import { SVGProps } from "react";

export function Squiggle({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="presentation"
      aria-hidden
      viewBox="0 0 200 16"
      fill="none"
      preserveAspectRatio="none"
      className={className}
      {...props}
    >
      <path
        d="M2 11 C 25 2, 50 14, 75 8 S 125 2, 150 10 S 195 4, 198 8"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
