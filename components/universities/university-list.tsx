"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search } from "lucide-react";
import { apiClient, ApiError } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { useSelection } from "@/lib/state/selection";
import { UniversityCard } from "./university-card";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type University = components["schemas"]["UniversityRead"];

function UniversityCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border p-5">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="ml-auto h-8 w-16 rounded-full" />
    </div>
  );
}

interface UniversityListProps {
  initialUniversities: University[];
}

export function UniversityList({ initialUniversities }: UniversityListProps) {
  const { add, remove, isSelected } = useSelection();
  const [query, setQuery] = useState("");
  const [universities, setUniversities] = useState(initialUniversities);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUniversities = useCallback(async (q: string) => {
    setSearching(true);
    setError(null);
    try {
      const path = q.trim()
        ? `/universities?q=${encodeURIComponent(q.trim())}`
        : "/universities";
      const data =
        await apiClient.get<components["schemas"]["UniversitiesListResponse"]>(
          path,
        );
      setUniversities(data.items);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? "Couldn't load universities. Please try again."
          : "Unable to connect. Check your internet connection.",
      );
    } finally {
      setSearching(false);
    }
  }, []);

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchUniversities(q), 300);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleSelect(university: University) {
    if (isSelected(university.id)) {
      remove(university.id);
    } else {
      add({ universityId: university.id, universityName: university.name });
    }
  }

  return (
    <div className="space-y-6">
      {/* Search field with a leading icon — the icon is purely decorative,
       * the native search input handles its own clear/submit affordances. */}
      <div className="relative max-w-sm">
        <Search
          size={16}
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="search"
          aria-label="Search universities"
          placeholder="Search universities…"
          value={query}
          onChange={handleQueryChange}
          className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-3.5 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_0_rgba(13,26,61,0.04)] placeholder:text-muted-foreground transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
        />
      </div>

      {error && !searching && (
        <Alert tone="destructive">
          <div className="flex flex-col gap-2">
            <span>{error}</span>
            <Button
              type="button"
              variant="ghost"
              onClick={() => fetchUniversities(query)}
              className="self-start px-0 text-destructive hover:bg-transparent hover:text-destructive/80"
            >
              Try again
            </Button>
          </div>
        </Alert>
      )}

      {searching ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <UniversityCardSkeleton key={i} />
          ))}
        </div>
      ) : universities.length === 0 ? (
        <Card variant="paper" className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {query.trim()
              ? `No universities match “${query}”. Try a different search.`
              : "No universities are available right now."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {universities.map((u) => (
            <UniversityCard
              key={u.id}
              university={u}
              isSelected={isSelected(u.id)}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
