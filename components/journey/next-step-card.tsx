"use client";

// NextStepCard — the one highlighted action of the moment.
//
// Reads the journey's computed next step and renders it as the dashboard's
// hero card: kicker, serif title, one supporting line, one CTA. When the
// next step is an action-required application, the card flips to the warning
// tone so a paused run is unmissable.
import Link from "next/link";
import { ArrowRight, BellRing } from "lucide-react";
import { useJourney } from "@/lib/journey/journey";
import { buttonClasses } from "@/components/ui/button";
import { Sprout } from "@/components/ui/motifs";
import { cn } from "@/lib/utils/cn";

export function NextStepCard({ className }: { className?: string }) {
  const { loading, nextStep } = useJourney();

  if (loading || !nextStep) return null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-6 shadow-[var(--shadow-soft)] sm:p-7",
        nextStep.urgent
          ? "border-warning/40 bg-warning/5"
          : "border-border bg-card",
        className,
      )}
    >
      {/* Corner sprout — quiet brand presence, clipped by the card. */}
      {!nextStep.urgent && (
        <Sprout
          aria-hidden
          className="absolute -right-3 -top-3 h-20 w-20 rotate-12 text-primary/10"
        />
      )}

      <div className="relative space-y-3">
        <p
          className={cn(
            "flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em]",
            nextStep.urgent ? "text-warning" : "text-primary",
          )}
        >
          {nextStep.urgent ? (
            <BellRing size={13} aria-hidden />
          ) : (
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary" />
          )}
          {nextStep.urgent ? "Action needed" : "Next step"}
        </p>

        <h2 className="font-display text-2xl leading-tight tracking-tight text-foreground sm:text-3xl">
          {nextStep.title}
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          {nextStep.body}
        </p>

        <div className="pt-1">
          <Link
            href={nextStep.href}
            className={buttonClasses({
              variant: nextStep.urgent ? "primary" : "accent",
            })}
          >
            {nextStep.cta}
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
