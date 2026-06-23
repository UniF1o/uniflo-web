"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, GraduationCap, Building2 } from "lucide-react";
import { useSelection } from "@/lib/state/selection";
import { MATCH_STATUS_BADGE } from "@/lib/api/recommendations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { cn } from "@/lib/utils/cn";
import type {
  CareerProgrammesResponse,
  CareerProgrammeMatch,
  CareerUniversityGroup,
} from "@/lib/api/careers";
import type { MatchStatus } from "@/lib/api/recommendations";

const QUALIFICATION_LABELS: Record<string, string> = {
  degree: "Degree",
  diploma: "Diploma",
  higher_certificate: "Higher Certificate",
};

const STATUS_ORDER: MatchStatus[] = ["qualifies", "borderline", "not_yet"];

function CareerProgCard({
  prog,
  onApply,
}: {
  prog: CareerProgrammeMatch;
  onApply?: () => void;
}) {
  const status = prog.status as MatchStatus;
  const badge = MATCH_STATUS_BADGE[status];
  const canApply = status === "qualifies" || status === "borderline";
  const qualLabel = prog.qualification_type
    ? (QUALIFICATION_LABELS[prog.qualification_type] ?? prog.qualification_type)
    : null;

  return (
    <Card
      variant="paper"
      as="article"
      aria-label={prog.name}
      className={cn(
        "flex flex-col gap-3 p-5 transition-all duration-200",
        canApply &&
          "hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-[var(--shadow-soft)]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium leading-snug text-foreground">
          {prog.name}
        </h3>
        <Badge tone={badge.tone} className="shrink-0">
          {badge.label}
        </Badge>
      </div>

      {prog.faculty && (
        <p className="text-xs text-muted-foreground">{prog.faculty}</p>
      )}

      {(qualLabel || prog.duration_years) && (
        <p className="text-xs text-muted-foreground">
          {[
            qualLabel,
            prog.duration_years
              ? `${prog.duration_years} ${prog.duration_years === 1 ? "year" : "years"}`
              : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}

      {prog.notes && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {prog.notes}
        </p>
      )}

      {canApply && onApply && (
        <Button
          type="button"
          variant="secondary"
          onClick={onApply}
          className="mt-auto self-end px-4 py-1.5 text-xs"
          aria-label={`Apply for ${prog.name}`}
        >
          Apply
          <ArrowRight size={12} aria-hidden strokeWidth={2.5} />
        </Button>
      )}
    </Card>
  );
}

function UniversitySection({
  uniGroup,
  onApply,
}: {
  uniGroup: CareerUniversityGroup;
  onApply: (uniId: string, uniName: string, prog: CareerProgrammeMatch) => void;
}) {
  const groups = STATUS_ORDER.map((status) => ({
    status,
    programmes: uniGroup.programmes.filter((p) => p.status === status),
  })).filter((g) => g.programmes.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <GraduationCap
          size={16}
          aria-hidden
          className="shrink-0 text-primary"
        />
        <h2 className="text-sm font-semibold text-foreground">
          {uniGroup.university_name}
        </h2>
        <span className="text-xs text-muted-foreground">
          · Your {uniGroup.scoring_method === "uct_fps" ? "FPS" : "APS"}:{" "}
          {uniGroup.aps}/{uniGroup.aps_max}
        </span>
      </div>

      {groups.map(({ status, programmes }) => {
        const { label } = MATCH_STATUS_BADGE[status];
        return (
          <Section key={status} kicker={`${label} · ${programmes.length}`}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {programmes.map((prog) => (
                <CareerProgCard
                  key={prog.id}
                  prog={prog}
                  onApply={
                    prog.status === "qualifies" || prog.status === "borderline"
                      ? () =>
                          onApply(
                            uniGroup.university_id,
                            uniGroup.university_name,
                            prog,
                          )
                      : undefined
                  }
                />
              ))}
            </div>
          </Section>
        );
      })}
    </div>
  );
}

interface CareerProgrammesViewProps {
  data: CareerProgrammesResponse;
}

export function CareerProgrammesView({ data }: CareerProgrammesViewProps) {
  const router = useRouter();
  const { add, update, isSelected } = useSelection();

  function handleApply(
    uniId: string,
    uniName: string,
    prog: CareerProgrammeMatch,
  ) {
    const year = new Date().getFullYear() + 1;
    if (isSelected(uniId)) {
      update(uniId, {
        programme: prog.name,
        programmeId: prog.id,
        applicationYear: year,
      });
    } else {
      add({
        universityId: uniId,
        universityName: uniName,
        programme: prog.name,
        programmeId: prog.id,
        applicationYear: year,
      });
    }
    router.push("/applications/new");
  }

  if (data.tvet_only || data.universities.length === 0) {
    return (
      <Card
        variant="paper"
        className="flex flex-col items-center gap-3 px-6 py-10 text-center"
      >
        <Building2 size={32} aria-hidden className="text-primary/40" />
        <p className="text-sm font-medium text-foreground">
          Mainly a college or apprenticeship path
        </p>
        <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
          This career typically routes through a TVET college, nursing college,
          or registered apprenticeship rather than a university degree. Check
          your nearest TVET college or the relevant SETA for learnerships.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-10">
      {data.universities.map((uniGroup) => (
        <UniversitySection
          key={uniGroup.university_id}
          uniGroup={uniGroup}
          onApply={handleApply}
        />
      ))}

      <p className="text-xs leading-relaxed text-muted-foreground">
        Programme matching is based on published admission requirements and your
        current marks. The university makes the final admission decision —
        requirements may change and marks are provisional until certified.
      </p>
    </div>
  );
}
