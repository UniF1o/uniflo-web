"use client";

// JourneyRail — the five-stage progress rail on the dashboard.
//
// Profile → Marks → Documents → Apply → Track, each node linked to its page.
// Completed nodes are filled cobalt with a check; the current node carries a
// pulsing ring so the eye lands on it; upcoming nodes stay quiet. Labels sit
// under the nodes on all breakpoints — they're single short words, so they
// fit even at 390px.
import Link from "next/link";
import { Check } from "lucide-react";
import { useJourney } from "@/lib/journey/journey";
import { cn } from "@/lib/utils/cn";

export function JourneyRail({ className }: { className?: string }) {
  const { loading, stages } = useJourney();

  if (loading) return null;

  return (
    <ol className={cn("flex items-start", className)}>
      {stages.map((stage, i) => {
        const isLast = i === stages.length - 1;
        return (
          <li
            key={stage.id}
            className={cn("flex items-start", !isLast && "flex-1")}
          >
            <Link
              href={stage.href}
              aria-current={stage.state === "current" ? "step" : undefined}
              className="group flex w-12 flex-col items-center gap-1.5 sm:w-16"
            >
              <span
                className={cn(
                  "relative grid h-8 w-8 place-items-center rounded-full border-2 transition-colors sm:h-9 sm:w-9",
                  stage.state === "complete" &&
                    "border-primary bg-primary text-primary-foreground",
                  stage.state === "current" &&
                    "border-primary bg-card text-primary",
                  stage.state === "upcoming" &&
                    "border-border bg-card text-muted-foreground group-hover:border-primary/40",
                )}
              >
                {stage.state === "complete" ? (
                  <Check size={14} strokeWidth={3} aria-hidden />
                ) : (
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      stage.state === "current" ? "bg-primary" : "bg-border",
                    )}
                  />
                )}
                {/* Soft pulse behind the current node only. */}
                {stage.state === "current" && (
                  <span
                    aria-hidden
                    className="absolute inset-0 -z-10 animate-[ping_2.4s_ease-out_infinite] rounded-full bg-primary/30"
                  />
                )}
              </span>
              <span
                className={cn(
                  "text-[0.65rem] font-medium tracking-wide sm:text-xs",
                  stage.state === "current"
                    ? "text-primary"
                    : stage.state === "complete"
                      ? "text-foreground"
                      : "text-muted-foreground",
                )}
              >
                {stage.label}
              </span>
            </Link>

            {/* Connector — coloured up to the last completed node. Offset to
             * the node's vertical centre. */}
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  "mt-4 h-0.5 flex-1 rounded-full sm:mt-[1.125rem]",
                  stage.state === "complete" ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
