"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useSelection } from "@/lib/state/selection";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function SelectionBar() {
  const { entries } = useSelection();
  const router = useRouter();
  const count = entries.length;

  return (
    // Always in the DOM so the CSS slide-up transition plays. Off-screen
    // when empty via translate-y-full; pointer-events-none prevents
    // invisible clicks. md:left-64 leaves room for the desktop sidebar.
    <div
      aria-hidden={count === 0}
      className={cn(
        // Frosted-glass treatment so any card sliding under the bar stays
        // visible. shadow-soft lifts it off the page; the top border is a
        // hairline so the bar reads as floating, not stuck to the edge.
        "fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/85 backdrop-blur-md shadow-[var(--shadow-soft)] transition-transform duration-300 ease-out md:left-64 supports-[backdrop-filter]:bg-background/70",
        count > 0 ? "translate-y-0" : "pointer-events-none translate-y-full",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-8">
        <div className="flex items-center gap-3">
          {/* Cobalt counter pill — broadcasts how many universities are in
           * the basket without needing the user to read the sentence. */}
          <span className="grid h-9 min-w-9 place-items-center rounded-full bg-primary/10 px-2 font-display text-base font-medium text-primary">
            {count}
          </span>
          <p className="text-sm text-muted-foreground">
            {count === 1 ? "university" : "universities"} selected
          </p>
        </div>
        <Button
          variant="accent"
          disabled={count === 0}
          onClick={() => router.push("/applications/new")}
        >
          Continue
          <ArrowRight size={14} aria-hidden />
        </Button>
      </div>
    </div>
  );
}
