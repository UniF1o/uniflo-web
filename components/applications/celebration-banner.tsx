"use client";

// One-shot post-submit celebration banner.
//
// Renders when the page is loaded with `?just_submitted=true`. After the
// first render the component strips the query param via `router.replace`
// so a manual refresh doesn't re-show the banner. Subtle by design — the
// real hero on the detail page is the screenshot proof.

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { DotCluster } from "@/components/ui/motifs";

export function CelebrationBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const justSubmitted = search.get("just_submitted") === "true";

  // Local copy of the flag — the banner stays visible for the lifetime of
  // this client component instance even after the URL is rewritten so the
  // visual moment isn't snapped away mid-render.
  const [visible, setVisible] = useState(justSubmitted);

  useEffect(() => {
    if (!justSubmitted) return;
    // Drop the query param so refresh / back-button don't replay the moment.
    const params = new URLSearchParams(search.toString());
    params.delete("just_submitted");
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    // The effect deliberately depends only on justSubmitted — the search
    // params object identity changes every navigation and we only want this
    // to run when the flag flips from false → true on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justSubmitted]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="relative overflow-hidden rounded-2xl border border-primary/15 bg-[linear-gradient(135deg,var(--color-soft)_0%,var(--color-background)_70%)] px-5 py-4 shadow-[var(--shadow-soft)]"
    >
      <DotCluster
        aria-hidden
        className="absolute -right-2 -top-2 h-8 w-12 text-primary/60"
      />
      <div className="flex items-center gap-3">
        <span aria-hidden className="text-2xl">
          🎉
        </span>
        <p className="font-script text-2xl leading-none text-primary">
          You&apos;re applied
        </p>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Track each application below. We&apos;ll update the status as the
        portals confirm.
      </p>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Dismiss celebration"
        className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <span aria-hidden>×</span>
      </button>
    </div>
  );
}
