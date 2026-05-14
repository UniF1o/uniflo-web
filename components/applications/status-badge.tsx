// StatusBadge — thin wrapper around the token-driven `Badge` for application
// status pills. Maps the four status values from the OpenAPI schema onto a
// `tone` + `label` pair so callers don't have to remember the mapping.
import { Badge } from "@/components/ui/badge";
import type { components } from "@/lib/api/schema";

type ApplicationStatus = components["schemas"]["ApplicationStatus"];
type BadgeTone = "info" | "success" | "warning" | "destructive" | "neutral";

const STATUS_MAP: Record<
  ApplicationStatus,
  { label: string; tone: BadgeTone; dot: boolean }
> = {
  // Queued — not yet picked up by the worker. Neutral so it doesn't claim
  // urgency, no dot since "nothing's happening yet".
  pending: { label: "Queued", tone: "neutral", dot: false },
  // Submitting — the worker is actively driving the university portal.
  // Info tone (cobalt) + dot signals motion.
  processing: { label: "Submitting…", tone: "info", dot: true },
  // Submitted — the happy path. Success tone + dot for the "done" feel.
  submitted: { label: "Submitted", tone: "success", dot: true },
  // Failed — needs the user's attention. Destructive tone, no dot (the
  // colour itself does the work; a dot here feels celebratory).
  failed: { label: "Failed", tone: "destructive", dot: false },
};

export function StatusBadge({ status }: { status: ApplicationStatus | null }) {
  if (!status) return null;
  const { label, tone, dot } = STATUS_MAP[status];
  return (
    <Badge tone={tone} dot={dot}>
      {label}
    </Badge>
  );
}
