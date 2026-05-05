import type { components } from "@/lib/api/schema";
import { cn } from "@/lib/utils/cn";

type ApplicationStatus = components["schemas"]["ApplicationStatus"];

const BADGE: Record<ApplicationStatus, { label: string; className: string }> = {
  pending: {
    label: "Queued",
    className: "bg-muted text-muted-foreground",
  },
  processing: {
    label: "Submitting…",
    className: "bg-blue-100 text-blue-700",
  },
  submitted: {
    label: "Submitted",
    className: "bg-emerald-50 text-emerald-600",
  },
  failed: {
    label: "Failed",
    className: "bg-destructive/10 text-destructive",
  },
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const { label, className } = BADGE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
    >
      {label}
    </span>
  );
}
