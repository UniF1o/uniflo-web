"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "./status-badge";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime } from "@/lib/utils/format";
import type { components } from "@/lib/api/schema";

type ApplicationRead = components["schemas"]["ApplicationRead"];

interface ApplicationListProps {
  initialItems: ApplicationRead[];
  // id → name lookup built server-side from GET /universities
  universityNames: Record<string, string>;
}

export function ApplicationList({
  initialItems,
  universityNames,
}: ApplicationListProps) {
  const [items, setItems] = useState<ApplicationRead[]>(initialItems);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(false);

  async function refresh() {
    setIsRefreshing(true);
    setRefreshError(false);
    try {
      const data = await apiClient.get<ApplicationRead[]>("/applications");
      setItems(data);
    } catch {
      setRefreshError(true);
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{items.length}</span>{" "}
          {items.length === 1 ? "application" : "applications"}
        </p>
        <Button
          variant="ghost"
          onClick={refresh}
          disabled={isRefreshing}
          aria-label="Refresh applications"
        >
          <RefreshCw
            size={13}
            aria-hidden
            className={cn("shrink-0", isRefreshing && "animate-spin")}
          />
          {isRefreshing ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {refreshError && (
        <Alert tone="destructive">Could not refresh. Please try again.</Alert>
      )}

      {/* Each application is its own elevated row card. Row cards lift on
       * hover so the "View" affordance is felt. Using a list of cards
       * (rather than a single divided list) means each row gets its own
       * shadow + radius and reads more clearly on mobile. */}
      <ul className="flex flex-col gap-3">
        {items.map((app) => {
          const uniName =
            universityNames[app.university_id] ?? app.university_id;
          return (
            <li key={app.id}>
              <Link
                href={`/applications/${app.id}`}
                aria-label={`View application for ${uniName}`}
                className="block focus:outline-none"
              >
                <Card
                  variant="paper"
                  className="group flex flex-col gap-2 px-5 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-[var(--shadow-soft)] sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {uniName}
                      </p>
                      {app.status && <StatusBadge status={app.status} />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {app.programme} · {app.application_year}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <span className="text-xs text-muted-foreground">
                      {app.updated_at
                        ? formatRelativeTime(app.updated_at)
                        : "—"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                      View
                      <ArrowRight
                        size={12}
                        aria-hidden
                        className="transition-transform duration-200 group-hover:translate-x-0.5"
                      />
                    </span>
                  </div>
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
