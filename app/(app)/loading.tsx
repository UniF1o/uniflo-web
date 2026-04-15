// (app) loading UI — shown automatically by Next.js while a page inside the
// (app) route group is being server-rendered.
//
// Next looks for a `loading.tsx` sibling of a page and mounts it inside a
// React Suspense boundary while the page's data fetches. Keeping this at
// the (app) level means the navbar/sidebar chrome stays mounted during
// navigation — only the main content area gets replaced with the skeleton.
import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      // The skeleton mirrors the typical shape of a page inside the shell:
      // a heading, a supporting paragraph, and a grid of content cards. It
      // won't be pixel-identical to any real page, but it pre-allocates the
      // vertical space so the page doesn't jump when it loads.
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
