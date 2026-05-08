// DashedPath — a soft hand-drawn dashed curve used as a connector between
// stats or as a section tail. Two variants supported via the `variant` prop:
//   - "horizontal" — wide, gentle curve dipping down then up
//   - "wave" — a longer, fuller wave used as a section divider
// Inherits `currentColor` for tinting.
import { SVGProps } from "react";

interface DashedPathProps extends SVGProps<SVGSVGElement> {
  variant?: "horizontal" | "wave";
}

export function DashedPath({
  variant = "horizontal",
  className,
  ...props
}: DashedPathProps) {
  const d =
    variant === "wave"
      ? "M0 20 C 80 4, 160 36, 240 18 S 400 6, 480 22"
      : "M2 12 C 30 2, 70 22, 110 12 S 190 4, 220 14";

  return (
    <svg
      role="presentation"
      aria-hidden
      viewBox={variant === "wave" ? "0 0 480 40" : "0 0 220 24"}
      fill="none"
      preserveAspectRatio="none"
      className={className}
      {...props}
    >
      <path
        d={d}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="2 6"
        fill="none"
      />
    </svg>
  );
}
