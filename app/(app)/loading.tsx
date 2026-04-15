// (app) loading UI — shown while any page inside (app) is streaming from the server.
//
// Next.js automatically wraps this in a Suspense boundary. Because it lives
// at the route-group level, the navbar and sidebar stay mounted during
// navigation — only the main content area swaps out for this skeleton.
import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      // Approximates a typical page shape (heading + card grid) to reduce
      // layout shift when the real content arrives.
      className="flex flex-col gap-6"
    >
      {/* Visually hidden label so screen-reader users hear "Loading" while
       * the skeleton is on screen. */}
      <span className="sr-only">Loading…</span>

      <div className="space-y-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    </div>
  );
}
