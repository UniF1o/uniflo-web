"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ImageIcon, RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "./status-badge";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime } from "@/lib/utils/format";
import { parseJobError } from "@/lib/api/phase-3";
import { getFailureCopy } from "@/lib/applications/failure-copy";
import type { components } from "@/lib/api/schema";

type ApplicationRead = components["schemas"]["ApplicationRead"];

// Build the tooltip text for a row's status badge. For failures we surface
// the friendly copy from the shared map so the list and detail page never
// diverge.
function buildBadgeTitle(
  app: ApplicationRead,
  universityName: string,
): string | undefined {
  if (app.status !== "failed") return undefined;
  const job = app.latest_job;
  if (!job) return undefined;
  const error = parseJobError(job.last_error);
  if (!error) return undefined;
  return getFailureCopy(error.code, {
    message: error.message,
    universityName,
  }).headline;
}

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
          const hasScreenshot = !!app.latest_job?.screenshot_url;
          const badgeTitle = buildBadgeTitle(app, uniName);
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
                      {app.status && (
                        <span title={badgeTitle}>
                          <StatusBadge status={app.status} />
                        </span>
                      )}
                      {hasScreenshot && (
                        <span
                          title="Confirmation screenshot available"
                          aria-label="Confirmation screenshot available"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                        >
                          <ImageIcon size={12} aria-hidden />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {app.programme} · {app.application_year}
                      {app.choices && app.choices.length > 1 && (
                        <span className="ml-1">
                          · +{app.choices.length - 1} more{" "}
                          {app.choices.length - 1 === 1 ? "choice" : "choices"}
                        </span>
                      )}
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
