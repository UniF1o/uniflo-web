"use client";

// JourneyMini — the journey at a glance, lives in the sidebar footer.
//
// Five connected dots plus a "Next:" line so the student's place in the
// journey is visible from every page. Falls back to the brand tagline while
// the journey is still loading so the footer never jumps between states of
// different heights.
import Link from "next/link";
import { useJourney } from "@/lib/journey/journey";
import { Sprout } from "@/components/ui/motifs";
import { cn } from "@/lib/utils/cn";

export function JourneyMini() {
  const { loading, stages, nextStep } = useJourney();

  if (loading) {
    return (
      <div className="text-xs leading-relaxed text-muted-foreground">
        <p className="flex items-center gap-1.5 font-display text-sm text-foreground">
          One application
          <Sprout className="h-3.5 w-3.5 text-primary" />
        </p>
        <p>Every university.</p>
      </div>
    );
  }

  const completeCount = stages.filter((s) => s.state === "complete").length;

  return (
    <div className="space-y-2.5">
      <p className="flex items-center justify-between font-display text-sm text-foreground">
        <span className="flex items-center gap-1.5">
          Your journey
          <Sprout className="h-3.5 w-3.5 text-primary" />
        </span>
        <span className="text-xs text-muted-foreground">
          {completeCount}/{stages.length}
        </span>
      </p>

      {/* Dot track — one segment per stage, coloured by state. */}
      <div aria-hidden className="flex items-center gap-1">
        {stages.map((stage) => (
          <span
            key={stage.id}
            title={stage.label}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              stage.state === "complete" && "bg-primary",
              stage.state === "current" && "bg-primary/40",
              stage.state === "upcoming" && "bg-foreground/15",
            )}
          />
        ))}
      </div>

      {nextStep ? (
        <Link
          href={nextStep.href}
          className={cn(
            "block truncate text-xs underline-offset-2 hover:underline",
            nextStep.urgent
              ? "font-medium text-warning"
              : "text-muted-foreground hover:text-primary",
          )}
        >
          Next: {nextStep.title}
        </Link>
      ) : (
        <p className="text-xs text-muted-foreground">All steps complete.</p>
      )}
    </div>
  );
}
