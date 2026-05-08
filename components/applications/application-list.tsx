"use client";

import { useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { cn } from "@/lib/utils/cn";
import type { components } from "@/lib/api/schema";

type ApplicationWithJob = components["schemas"]["ApplicationWithJob"];

interface ApplicationListProps {
  initialItems: ApplicationWithJob[];
  // id → name lookup built server-side from GET /universities
  universityNames: Record<string, string>;
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function ApplicationList({
  initialItems,
  universityNames,
}: ApplicationListProps) {
  const [items, setItems] = useState(initialItems);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(false);

  async function refresh() {
    setIsRefreshing(true);
    setRefreshError(false);
    try {
      const data = await apiClient.get<{ items: ApplicationWithJob[] }>(
        "/applications",
      );
      setItems(data.items);
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
        <p role="alert" className="text-sm text-destructive">
          Could not refresh. Please try again.
        </p>
      )}

      <div className="divide-y divide-border rounded-lg border border-border">
        {items.map((app) => {
          const uniName =
            universityNames[app.university_id] ?? app.university_id;
          return (
            <div
              key={app.id}
              className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:gap-4"
            >
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {uniName}
                  </p>
                  <StatusBadge status={app.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {app.programme} · {app.application_year}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(app.updated_at)}
                </span>
                <Link
                  href={`/applications/${app.id}`}
                  className="text-xs font-medium text-primary hover:underline"
                  aria-label={`View application for ${uniName}`}
                >
                  View →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
