// (auth) loading UI — shown while any /login, /signup, or /forgot-password
// page is streaming from the server. Skeleton mirrors the auth Card shape
// (heading + lead + two input rows + a CTA) so the swap on hydration
// doesn't shift layout.
import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>

      <div className="rounded-xl border border-border bg-background p-7 shadow-[var(--shadow-soft)] md:p-9">
        <div className="space-y-7">
          <div className="space-y-2">
            <Skeleton className="h-9 w-3/5" />
            <Skeleton className="h-4 w-4/5" />
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
            <Skeleton className="h-11 w-full rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
