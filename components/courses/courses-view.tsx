"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import {
  getRecommendations,
  MATCH_STATUS_BADGE,
} from "@/lib/api/recommendations";
import type {
  RecommendationsResponse,
  ProgrammeMatch,
} from "@/lib/api/recommendations";
import type { RecordType } from "@/lib/api/academic-records";
import { RECORD_TYPE_LABELS } from "@/lib/api/academic-records";
import { useSelection } from "@/lib/state/selection";
import { CourseCard } from "@/components/courses/course-card";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import type { components } from "@/lib/api/schema";

type University = components["schemas"]["UniversityRead"];
type MatchStatus = components["schemas"]["MatchStatus"];

const STATUS_ORDER: MatchStatus[] = ["qualifies", "borderline", "not_yet"];

function scoreLabel(scoringMethod: string | null | undefined): string {
  return scoringMethod === "uct_fps" ? "FPS" : "APS";
}

function recordTypeLabel(recordTypeUsed: string): string {
  if (recordTypeUsed in RECORD_TYPE_LABELS) {
    return RECORD_TYPE_LABELS[recordTypeUsed as RecordType].toLowerCase();
  }
  return recordTypeUsed.replace(/_/g, " ");
}

function CourseSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-paper)]">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
}

interface CoursesViewProps {
  universities: University[];
  defaultUniversityId: string;
  initialData: RecommendationsResponse | null;
  initialNoRecord: boolean;
}

export function CoursesView({
  universities,
  defaultUniversityId,
  initialData,
  initialNoRecord,
}: CoursesViewProps) {
  const router = useRouter();
  const { add, update, isSelected } = useSelection();

  const [selectedUniId, setSelectedUniId] = useState(defaultUniversityId);
  const [data, setData] = useState<RecommendationsResponse | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [noRecord, setNoRecord] = useState(initialNoRecord);
  const [error, setError] = useState<string | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [notYetExpanded, setNotYetExpanded] = useState(false);

  const chipsRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = chipsRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 0);
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    updateArrows();
  }, [data, updateArrows]);

  const selectedUni = universities.find((u) => u.id === selectedUniId);

  const fetchRecommendations = useCallback(async (universityId: string) => {
    setLoading(true);
    setError(null);
    setNoRecord(false);
    setData(null);
    setSelectedFaculty(null);
    setNotYetExpanded(false);
    try {
      const result = await getRecommendations(universityId);
      setData(result);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setNoRecord(true);
      } else {
        setError("Couldn't load course matches. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  function handleUniChange(universityId: string) {
    setSelectedUniId(universityId);
    fetchRecommendations(universityId);
  }

  function handleApply(programme: ProgrammeMatch) {
    const year = data?.intake_year ?? new Date().getFullYear();
    if (isSelected(selectedUniId)) {
      update(selectedUniId, {
        programme: programme.name,
        applicationYear: year,
      });
    } else {
      add({
        universityId: selectedUniId,
        universityName: selectedUni?.name ?? "",
        programme: programme.name,
        applicationYear: year,
      });
    }
    router.push("/applications/new");
  }

  // Unique sorted faculties from all programmes — drives the filter strip.
  const faculties = data
    ? [...new Set(data.programmes.map((p) => p.faculty))].sort()
    : [];

  const visibleProgrammes = data
    ? data.programmes.filter(
        (p) => !selectedFaculty || p.faculty === selectedFaculty,
      )
    : [];

  const groups =
    visibleProgrammes.length > 0
      ? STATUS_ORDER.map((status) => ({
          status,
          programmes: visibleProgrammes.filter((p) => p.status === status),
        })).filter((g) => g.programmes.length > 0)
      : [];

  const hasResults = !loading && groups.length > 0;

  return (
    <div className="space-y-6">
      {/* University picker */}
      <div className="max-w-sm">
        <label
          htmlFor="university-picker"
          className="mb-1.5 block text-xs font-medium text-muted-foreground"
        >
          University
        </label>
        <select
          id="university-picker"
          value={selectedUniId}
          onChange={(e) => handleUniChange(e.target.value)}
          className="h-11 w-full rounded-lg border border-border bg-background px-3.5 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_0_rgba(13,26,61,0.04)] transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
        >
          {universities.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      {/* Score summary + record type */}
      {data && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-sm text-foreground">
            Your {scoreLabel(selectedUni?.scoring_method)}:{" "}
            <span className="font-semibold tabular-nums">
              {data.aps} / {data.aps_max}
            </span>
          </p>
          <span
            aria-hidden
            className="hidden h-1 w-1 rounded-full bg-border sm:block"
          />
          <p className="text-xs text-muted-foreground">
            Matched on your {recordTypeLabel(data.record_type_used)} results
          </p>
        </div>
      )}

      {/* Faculty filter chips — only shown when results are available */}
      {data && faculties.length > 1 && (
        <div className="flex items-center gap-2">
          {/* Left arrow — always occupies its space; invisible + inert when not needed */}
          <button
            type="button"
            onClick={() =>
              chipsRef.current?.scrollBy({ left: -180, behavior: "smooth" })
            }
            aria-label="Scroll faculties left"
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-opacity hover:bg-muted",
              !showLeft && "pointer-events-none opacity-0",
            )}
          >
            <ChevronLeft size={12} aria-hidden />
          </button>

          <div
            ref={chipsRef}
            onScroll={updateArrows}
            className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label="Filter by faculty"
            style={{
              maskImage:
                showLeft && showRight
                  ? "linear-gradient(to right, transparent 0, black 24px, black calc(100% - 24px), transparent 100%)"
                  : showLeft
                    ? "linear-gradient(to right, transparent 0, black 24px)"
                    : showRight
                      ? "linear-gradient(to right, black calc(100% - 24px), transparent 100%)"
                      : undefined,
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedFaculty(null)}
              className={cn(
                "inline-flex shrink-0 items-center rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                selectedFaculty === null
                  ? "bg-primary text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
              )}
            >
              All faculties
            </button>
            {faculties.map((faculty) => (
              <button
                key={faculty}
                type="button"
                onClick={() =>
                  setSelectedFaculty(
                    selectedFaculty === faculty ? null : faculty,
                  )
                }
                className={cn(
                  "inline-flex shrink-0 items-center rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                  selectedFaculty === faculty
                    ? "bg-primary text-background"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                {faculty}
              </button>
            ))}
          </div>

          {/* Right arrow */}
          <button
            type="button"
            onClick={() =>
              chipsRef.current?.scrollBy({ left: 180, behavior: "smooth" })
            }
            aria-label="Scroll faculties right"
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-opacity hover:bg-muted",
              !showRight && "pointer-events-none opacity-0",
            )}
          >
            <ChevronRight size={12} aria-hidden />
          </button>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <Alert tone="destructive">
          <div className="flex flex-col gap-2">
            <span>{error}</span>
            <Button
              type="button"
              variant="ghost"
              onClick={() => fetchRecommendations(selectedUniId)}
              className="self-start px-0 text-destructive hover:bg-transparent hover:text-destructive/80"
            >
              Try again
            </Button>
          </div>
        </Alert>
      )}

      {/* No academic record */}
      {noRecord && !loading && (
        <Card
          variant="paper"
          className="flex flex-col items-center gap-3 px-6 py-10 text-center"
        >
          <BookOpen size={32} aria-hidden className="text-primary/40" />
          <p className="text-sm font-medium text-foreground">
            Add your subjects to see what you qualify for
          </p>
          <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
            We need your Grade 11 or Grade 12 marks to match you to programmes.
          </p>
          <Link
            href="/academic-records"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80"
          >
            Go to Academic Records
          </Link>
        </Card>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-8">
          {["Qualifies", "Borderline"].map((label) => (
            <Section key={label} kicker={label}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <CourseSkeleton key={i} />
                ))}
              </div>
            </Section>
          ))}
        </div>
      )}

      {/* No programmes seeded */}
      {!loading &&
        !error &&
        !noRecord &&
        data &&
        data.programmes.length === 0 && (
          <Card variant="paper" className="px-6 py-10 text-center">
            <p className="text-sm font-medium text-foreground">
              Course matching is not available yet for this university.
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Check back soon as we add more universities to the matching
              engine.
            </p>
          </Card>
        )}

      {/* No match for current faculty filter */}
      {!loading &&
        data &&
        data.programmes.length > 0 &&
        visibleProgrammes.length === 0 && (
          <Card variant="paper" className="px-6 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No programmes in this faculty to show.
            </p>
          </Card>
        )}

      {/* Results */}
      {hasResults && (
        <div className="space-y-8">
          {groups.map(({ status, programmes }) => {
            const { label } = MATCH_STATUS_BADGE[status];
            const isNotYet = status === "not_yet";

            return (
              <Section key={status} kicker={`${label} · ${programmes.length}`}>
                {isNotYet && !notYetExpanded ? (
                  // Collapsed "Not yet" — a single quiet row instead of a wall of cards.
                  <button
                    type="button"
                    onClick={() => setNotYetExpanded(true)}
                    className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-5 py-4 text-left transition-colors hover:border-foreground/20"
                  >
                    <span className="text-sm text-muted-foreground">
                      {programmes.length}{" "}
                      {programmes.length === 1 ? "programme" : "programmes"} you
                      don&apos;t qualify for yet
                    </span>
                    <ChevronDown
                      size={16}
                      aria-hidden
                      className="shrink-0 text-muted-foreground"
                    />
                  </button>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {programmes.map((p) => (
                        <CourseCard
                          key={p.id}
                          programme={p}
                          onApply={
                            p.status === "qualifies" ||
                            p.status === "borderline"
                              ? handleApply
                              : undefined
                          }
                        />
                      ))}
                    </div>
                    {isNotYet && (
                      <button
                        type="button"
                        onClick={() => setNotYetExpanded(false)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <ChevronUp size={14} aria-hidden />
                        Collapse
                      </button>
                    )}
                  </>
                )}
              </Section>
            );
          })}

          <p className="text-xs leading-relaxed text-muted-foreground">
            Matching is based on published programme requirements and your
            current marks. The university makes the final admission decision —
            requirements may change and marks are provisional until certified.
          </p>
        </div>
      )}
    </div>
  );
}
