"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Compass, ChevronLeft, ChevronRight } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getCareers } from "@/lib/api/careers";
import type { CareerRead, CareersListResponse } from "@/lib/api/careers";
import { CareerCard } from "@/components/careers/career-card";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

function CareerSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-paper)]">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
}

interface CareersViewProps {
  initialData: CareersListResponse | null;
  initialNoRecord: boolean;
}

export function CareersView({
  initialData,
  initialNoRecord,
}: CareersViewProps) {
  const router = useRouter();

  const [data, setData] = useState<CareersListResponse | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [noRecord, setNoRecord] = useState(initialNoRecord);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);

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

  const fetchCareers = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNoRecord(false);
    setData(null);
    setSelectedIndustry(null);
    try {
      const result = await getCareers();
      setData(result);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setNoRecord(true);
      } else {
        setError("Couldn't load career matches. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  function handleViewProgrammes(career: CareerRead) {
    router.push(`/careers/${career.id}`);
  }

  // Unique sorted industries from the result — drives the filter strip.
  const industries = data
    ? [...new Set(data.careers.map((c) => c.industry))].sort()
    : [];

  const visibleCareers = data
    ? data.careers.filter(
        (c) => !selectedIndustry || c.industry === selectedIndustry,
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Industry filter chips — shown when results are available */}
      {data && industries.length > 1 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              chipsRef.current?.scrollBy({ left: -200, behavior: "smooth" })
            }
            aria-label="Scroll industries left"
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
            aria-label="Filter by industry"
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
              onClick={() => setSelectedIndustry(null)}
              className={cn(
                "inline-flex shrink-0 items-center rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                selectedIndustry === null
                  ? "bg-primary text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
              )}
            >
              All industries
            </button>
            {industries.map((industry) => (
              <button
                key={industry}
                type="button"
                onClick={() =>
                  setSelectedIndustry(
                    selectedIndustry === industry ? null : industry,
                  )
                }
                className={cn(
                  "inline-flex shrink-0 items-center rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                  selectedIndustry === industry
                    ? "bg-primary text-background"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                {industry}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              chipsRef.current?.scrollBy({ left: 200, behavior: "smooth" })
            }
            aria-label="Scroll industries right"
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-opacity hover:bg-muted",
              !showRight && "pointer-events-none opacity-0",
            )}
          >
            <ChevronRight size={12} aria-hidden />
          </button>
        </div>
      )}

      {/* Match count summary — explore mode (no subjects yet) browses all SA
          careers; otherwise the list is matched to the learner's subjects. */}
      {data && (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {visibleCareers.length}
          </span>{" "}
          {visibleCareers.length === 1 ? "career" : "careers"}{" "}
          {data.explore
            ? "to explore — each shows the subjects to choose from Grade 10"
            : "match your subjects"}
          {selectedIndustry ? ` in ${selectedIndustry}` : ""}
        </p>
      )}

      {/* Error */}
      {error && !loading && (
        <Alert tone="destructive">
          <div className="flex flex-col gap-2">
            <span>{error}</span>
            <Button
              type="button"
              variant="ghost"
              onClick={fetchCareers}
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
          <Compass size={32} aria-hidden className="text-primary/40" />
          <p className="text-sm font-medium text-foreground">
            Add your subjects to discover careers
          </p>
          <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
            We match careers to the subjects you already take — no marks needed,
            just your subject choices.
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CareerSkeleton key={i} />
          ))}
        </div>
      )}

      {/* No match for current industry filter */}
      {!loading &&
        data &&
        data.careers.length > 0 &&
        visibleCareers.length === 0 && (
          <Card variant="paper" className="px-6 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No careers to show for this industry filter.
            </p>
          </Card>
        )}

      {/* Career grid */}
      {!loading && visibleCareers.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCareers.map((career) => (
              <CareerCard
                key={career.id}
                career={career}
                onViewProgrammes={handleViewProgrammes}
              />
            ))}
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Compensation ranges are indicative and vary by employer, city, and
            sector — they are not guarantees. Subject matching is based on your
            NSC subjects, not marks. Career insights are researched as of
            2025/26.
          </p>
        </>
      )}
    </div>
  );
}
