// Sprout — minimal sprout doodle used as the brand mark's accent dot and
// in the footer. Two leaves curling up from a single stem, drawn loose so
// it reads as hand-made. Inherits `currentColor`.
import { SVGProps } from "react";

export function Sprout({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="presentation"
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...props}
    >
      {/* Stem */}
      <path
        d="M12 22 V 11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Left leaf */}
      <path
        d="M12 14 C 8 14, 4 10, 5 4 C 11 5, 13 9, 12 14 Z"
        fill="currentColor"
      />
      {/* Right leaf */}
      <path
        d="M12 12 C 16 12, 20 8, 19 2 C 13 3, 11 7, 12 12 Z"
        fill="currentColor"
        opacity="0.7"
      />
    </svg>
  );
}
