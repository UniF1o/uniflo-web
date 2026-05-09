// (app) loading UI — shown while any page inside (app) is streaming from the server.
//
// Next.js automatically wraps this in a Suspense boundary. Because it lives
// at the route-group level, the navbar and sidebar stay mounted during
// navigation — only the main content area swaps out for this skeleton.
//
// Skeleton shape mirrors the most-visited authenticated page (the dashboard:
// hero ring + summary, then a 3-card grid) so the layout shift on hydration
// is minimal even on slower routes.
import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-10">
      {/* Visually hidden label so screen-reader users hear "Loading" while
       * the skeleton is on screen. */}
      <span className="sr-only">Loading…</span>

      {/* Header strip — eyebrow badge + headline + lead paragraph. */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-28 rounded-full" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>

      {/* Hero strip — circular ring + summary text, mirroring the dashboard
       * completeness component. */}
      <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:gap-8">
        <Skeleton className="h-36 w-36 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-8 w-3/5" />
          <Skeleton className="h-4 w-4/5 max-w-md" />
        </div>
      </div>

      {/* Three-card grid — the most common content shape across the app. */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[170px] w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
