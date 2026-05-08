// Returns null when iso is absent so callers can supply their own null
// presentation (muted dash, em-dash, hidden row, etc.).
export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-ZA", { dateStyle: "long" }).format(d);
}
