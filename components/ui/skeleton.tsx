// Skeleton — low-level placeholder block used during loading states.
//
// Renders a muted rectangle with a subtle shimmer so the user can see the
// app is loading without a jarring layout shift when real content arrives.
// Stateless and server-renderable — compose it inside any layout/page.
import { cn } from "@/lib/utils/cn";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      // `animate-pulse` gives a gentle opacity breathe.
      // `bg-muted` uses the warm-stone design token so skeletons feel like
      // part of the page rather than an alien grey block.
      // Consumers pass sizing classes via `className` (e.g. "h-4 w-32").
      className={cn(
        "animate-pulse rounded-[--radius-md] bg-muted",
        className,
      )}
      {...props}
    />
  );
}
