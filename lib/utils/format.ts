// Returns null when iso is absent so callers can supply their own null
// presentation (muted dash, em-dash, hidden row, etc.).
export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-ZA", { dateStyle: "long" }).format(d);
}

// "just now" / "5m ago" / "2h ago" / "3d ago". Used in lists where a full
// date is overkill but the user still needs to see freshness at a glance.
export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
