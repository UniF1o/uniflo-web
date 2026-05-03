"use client";

import { useRouter } from "next/navigation";
import { useSelection } from "@/lib/state/selection";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function SelectionBar() {
  const { entries } = useSelection();
  const router = useRouter();
  const count = entries.length;

  return (
    // Always in the DOM so the CSS slide-up transition plays. Off-screen when
    // empty via translate-y-full; pointer-events-none prevents invisible clicks.
    <div
      aria-hidden={count === 0}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background transition-transform duration-200 md:left-64",
        count > 0 ? "translate-y-0" : "pointer-events-none translate-y-full",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{count}</span>{" "}
          {count === 1 ? "university" : "universities"} selected
        </p>
        <Button
          variant="primary"
          disabled={count === 0}
          onClick={() => router.push("/applications/new")}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
