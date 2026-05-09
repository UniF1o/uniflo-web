"use client";

import { Check } from "lucide-react";
import type { components } from "@/lib/api/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

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
  isSelected: boolean;
  onSelect: (university: University) => void;
}

export function UniversityCard({
  university,
  isSelected,
  onSelect,
}: UniversityCardProps) {
  const status = getStatus(university);
  const days = status === "upcoming" ? daysUntil(university.open_date) : 0;

  const statusLabel =
    status === "open"
      ? "Open now"
      : status === "upcoming"
        ? `Opens in ${days} day${days === 1 ? "" : "s"}`
        : "Closed";

  // Map status → Badge tone so colours come from tokens, not Tailwind defaults.
  const statusTone =
    status === "open"
      ? "success"
      : status === "upcoming"
        ? "warning"
        : "neutral";

  const isClosed = status === "closed";

  return (
    <Card
      variant="paper"
      className={cn(
        "flex flex-col gap-4 p-5 transition-all duration-200",
        // Selected: tinted soft sky surface + cobalt ring; the ring keeps
        // the card visibly distinct from neighbours in the grid.
        isSelected
          ? "border-primary/50 bg-soft/60 ring-2 ring-primary/30"
          : "hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-[var(--shadow-soft)]",
        // Closed cards are dimmed to clarify they're not selectable.
        isClosed && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium leading-snug text-foreground">
          {university.name}
        </h3>
        <Badge tone={statusTone} dot={status === "open"}>
          {statusLabel}
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground">
        Applications open{" "}
        {formatDateRange(university.open_date, university.close_date)}
      </p>

      <Button
        variant={isSelected ? "primary" : "secondary"}
        disabled={isClosed}
        onClick={() => onSelect(university)}
        className="mt-auto self-end px-4 py-1.5 text-xs"
        aria-label={`${isSelected ? "Remove" : "Select"} ${university.name}`}
      >
        {isSelected && <Check size={12} aria-hidden strokeWidth={3} />}
        {isSelected ? "Selected" : "Select"}
      </Button>
    </Card>
  );
}
