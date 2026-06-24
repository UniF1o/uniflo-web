"use client";

import { useState } from "react";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import type { CareerRead } from "@/lib/api/careers";

export interface CareerCardProps {
  career: CareerRead;
  onViewProgrammes: (career: CareerRead) => void;
}

export function CareerCard({ career, onViewProgrammes }: CareerCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      variant="paper"
      as="article"
      aria-label={career.title}
      className="flex flex-col gap-3 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-[var(--shadow-soft)]"
    >
      {/* Title + demand badge */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium leading-snug text-foreground">
          {career.title}
        </h3>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[0.65rem] font-medium",
            career.employability.demand.toLowerCase().startsWith("very high")
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : career.employability.demand.toLowerCase().startsWith("high")
                ? "bg-sky-500/10 text-sky-700 dark:text-sky-400"
                : "bg-muted text-muted-foreground",
          )}
        >
          <TrendingUp size={10} aria-hidden />
          {career.employability.demand.split(" — ")[0]}
        </span>
      </div>

      {/* Description with see more */}
      <div>
        <p
          className={cn(
            "text-xs leading-relaxed text-muted-foreground",
            !expanded && "line-clamp-3",
          )}
        >
          {career.description}
        </p>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-0.5 text-[0.65rem] font-medium text-primary hover:text-primary/80"
        >
          {expanded ? "See less" : "See more"}
        </button>
      </div>

      {/* Compensation */}
      <p className="text-xs font-medium text-foreground">
        {career.compensation.display}{" "}
        <span className="font-normal text-muted-foreground">indicative</span>
      </p>

      {/* Employability outlook */}
      <p className="text-xs leading-relaxed text-muted-foreground">
        {career.employability.outlook}
      </p>

      {/* Required subjects */}
      {career.required_subjects && career.required_subjects.length > 0 && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Requires: </span>
          {career.required_subjects.join(", ")}
        </p>
      )}

      {/* Programmes CTA */}
      <Button
        type="button"
        variant="secondary"
        onClick={() => onViewProgrammes(career)}
        className="mt-auto self-end px-4 py-1.5 text-xs"
        aria-label={`View programmes for ${career.title}`}
      >
        Programmes
        <ArrowRight size={12} aria-hidden strokeWidth={2.5} />
      </Button>
    </Card>
  );
}
