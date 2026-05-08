// DotCluster — small confetti of dots used to mark celebratory moments
// (above a hero accent, beside a success state). Six dots arranged in a
// scattered pattern. Inherits `currentColor`.
import { SVGProps } from "react";

export function DotCluster({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="presentation"
      aria-hidden
      viewBox="0 0 60 40"
      fill="currentColor"
      className={className}
      {...props}
    >
      <circle cx="6" cy="22" r="2.5" />
      <circle cx="18" cy="8" r="3" />
      <circle cx="30" cy="28" r="2" />
      <circle cx="40" cy="14" r="2.8" />
      <circle cx="52" cy="6" r="2" />
      <circle cx="54" cy="30" r="2.5" />
    </svg>
  );
}
