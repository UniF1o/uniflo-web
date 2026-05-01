"use client";

import type { components } from "@/lib/api/schema";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

type University = components["schemas"]["University"];

function getStatus(u: University): "open" | "upcoming" | "closed" {
  if (!u.is_active) return "closed";
  const now = Date.now();
  const open = new Date(u.open_date).getTime();
  const close = new Date(u.close_date).getTime();
  if (now < open) return "upcoming";
  if (now > close) return "closed";
  return "open";
}

function formatDateRange(open: string, close: string): string {
  const fmt = (d: string) =>
    new Intl.DateTimeFormat("en-ZA", {
      day: "numeric",
      month: "long",
    }).format(new Date(d));
  return `${fmt(open)} – ${fmt(close)}`;
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

interface UniversityCardProps {
  university: University;
  onSelect: (university: University) => void;
}

export function UniversityCard({ university, onSelect }: UniversityCardProps) {
  const status = getStatus(university);
  const days = status === "upcoming" ? daysUntil(university.open_date) : 0;

  const statusLabel =
    status === "open"
      ? "Open now"
      : status === "upcoming"
        ? `Opens in ${days} day${days === 1 ? "" : "s"}`
        : "Closed";

  const statusClass = cn(
    "rounded-full px-2.5 py-0.5 text-xs font-medium",
    status === "open" &&
      "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
    status === "upcoming" &&
      "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
    status === "closed" && "bg-muted text-muted-foreground",
  );

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-background p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium leading-snug text-foreground">
          {university.name}
        </h3>
        <span className={statusClass}>{statusLabel}</span>
      </div>

      <p className="text-xs text-muted-foreground">
        Applications open{" "}
        {formatDateRange(university.open_date, university.close_date)}
      </p>

      <Button
        variant="ghost"
        disabled={status === "closed"}
        onClick={() => onSelect(university)}
        className="mt-auto self-end px-4 py-1.5 text-xs"
      >
        Select
      </Button>
    </div>
  );
}
