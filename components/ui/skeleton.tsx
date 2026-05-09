// Skeleton — low-level placeholder block used during loading states.
//
// Renders a tinted rectangle with a soft shimmer so the user can see the
// app is loading without a jarring layout shift when real content arrives.
// Uses `--color-soft` (pale sky tint) so the placeholder feels on-brand
// rather than a generic grey block.
import { cn } from "@/lib/utils/cn";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-soft/70", className)}
      {...props}
    />
  );
}
