import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MATCH_STATUS_BADGE } from "@/lib/api/recommendations";
import { cn } from "@/lib/utils/cn";
import type { ProgrammeMatch } from "@/lib/api/recommendations";

const QUALIFICATION_LABELS: Record<string, string> = {
  degree: "Degree",
  diploma: "Diploma",
  higher_certificate: "Higher Certificate",
};

interface CourseCardProps {
  programme: ProgrammeMatch;
  onApply?: (programme: ProgrammeMatch) => void;
}

export function CourseCard({ programme, onApply }: CourseCardProps) {
  const badge = MATCH_STATUS_BADGE[programme.status];
  const canApply =
    programme.status === "qualifies" || programme.status === "borderline";
  const qualLabel = programme.qualification_type
    ? (QUALIFICATION_LABELS[programme.qualification_type] ??
      programme.qualification_type)
    : null;

  return (
    <Card
      variant="paper"
      as="article"
      aria-label={programme.name}
      className={cn(
        "flex flex-col gap-3 p-5 transition-all duration-200",
        canApply &&
          "hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-[var(--shadow-soft)]",
      )}
    >
      {/* Header: name + status badge */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium leading-snug text-foreground">
          {programme.name}
        </h3>
        <Badge tone={badge.tone} className="shrink-0">
          {badge.label}
        </Badge>
      </div>

      {/* Faculty */}
      <p className="text-xs text-muted-foreground">{programme.faculty}</p>

      {/* Qualification type + duration */}
      {(qualLabel || programme.duration_years) && (
        <p className="text-xs text-muted-foreground">
          {[
            qualLabel,
            programme.duration_years
              ? `${programme.duration_years} ${programme.duration_years === 1 ? "year" : "years"}`
              : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}

      {/* Gap list — unmet requirements, verbatim from the backend */}
      {programme.unmet_rules.length > 0 && (
        <ul
          aria-label="Unmet requirements"
          className="space-y-1 rounded-lg border border-border bg-muted/40 px-3.5 py-2.5"
        >
          {programme.unmet_rules.map((rule, i) => (
            <li
              key={i}
              className="text-xs leading-relaxed text-muted-foreground"
            >
              {rule.requirement}: you have {rule.have}
              {rule.shortfall ? ` (${rule.shortfall} short)` : ""}
            </li>
          ))}
        </ul>
      )}

      {/* Additional notes (e.g. "Also requires: NBT") */}
      {programme.notes && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {programme.notes}
        </p>
      )}

      {/* Apply CTA — only on qualifies/borderline */}
      {canApply && onApply && (
        <Button
          type="button"
          variant="secondary"
          onClick={() => onApply(programme)}
          className="mt-auto self-end px-4 py-1.5 text-xs"
          aria-label={`Apply for ${programme.name}`}
        >
          Apply
          <ArrowRight size={12} aria-hidden strokeWidth={2.5} />
        </Button>
      )}
    </Card>
  );
}
