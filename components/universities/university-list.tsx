"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient, ApiError } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { UniversityCard } from "./university-card";
import { Skeleton } from "@/components/ui/skeleton";

type University = components["schemas"]["University"];

function UniversityCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-5">
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
        await apiClient.get<components["schemas"]["UniversityList"]>(path);
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

  // Placeholder — wired to selection context in Task 3.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleSelect(_: University) {}

  return (
    <div className="space-y-6">
      <input
        type="search"
        aria-label="Search universities"
        placeholder="Search universities…"
        value={query}
        onChange={handleQueryChange}
        className="h-10 w-full max-w-sm rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
      />

      {error && !searching && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
          <button
            type="button"
            onClick={() => fetchUniversities(query)}
            className="mt-2 text-sm font-medium text-destructive underline underline-offset-2 hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {searching ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <UniversityCardSkeleton key={i} />
          ))}
        </div>
      ) : universities.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {query.trim()
              ? `No universities match “${query}”. Try a different search.`
              : "No universities are available right now."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {universities.map((u) => (
            <UniversityCard key={u.id} university={u} onSelect={handleSelect} />
          ))}
        </div>
      )}
    </div>
  );
}
