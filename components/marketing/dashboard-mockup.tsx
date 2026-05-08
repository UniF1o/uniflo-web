// DashboardMockup — a stylised, pure-Tailwind preview of the application
// status dashboard, used as the hero illustration. No real data, no real
// screenshots: this is a hand-built scene meant to communicate "look how
// calm and organised your applications can feel".
//
// Mounted slightly rotated and floated above a soft sky-tinted slab so it
// reads as a thing held up to the page rather than a boxed UI shot.
import { Sticker, DotCluster } from "@/components/ui/motifs";
import { Badge } from "@/components/ui/badge";

interface MockRow {
  university: string;
  programme: string;
  tone: "success" | "warning" | "info";
  label: string;
}

const ROWS: MockRow[] = [
  {
    university: "University of Cape Town",
    programme: "BSc Computer Science",
    tone: "success",
    label: "Submitted",
  },
  {
    university: "Wits University",
    programme: "BCom Accounting",
    tone: "warning",
    label: "Processing",
  },
  {
    university: "Stellenbosch University",
    programme: "BEng Mechatronic",
    tone: "info",
    label: "Ready to submit",
  },
];

export function DashboardMockup() {
  return (
    <div className="relative isolate w-full max-w-md">
      {/* Soft sky tint slab behind the mock — the rotation here is the
       * opposite direction of the card's, so they pinch toward each other
       * and feel layered rather than stacked. */}
      <div
        aria-hidden
        className="absolute -inset-x-3 -inset-y-4 -z-10 rotate-[-2deg] rounded-3xl bg-soft/70"
      />

      {/* Decorative dot scatter — sits just outside the upper-left corner
       * to break the rectangle. */}
      <DotCluster className="absolute -left-6 -top-6 h-8 w-12 text-accent" />

      {/* Submitted stamp — overlapping the top-right corner. The rotation
       * sells the hand-applied feel. */}
      <Sticker
        label="Submitted"
        className="absolute -right-8 -top-10 h-24 w-24 rotate-12 text-accent drop-shadow-sm"
      />

      <div className="rotate-[1.2deg] rounded-2xl border border-foreground/10 bg-background p-5 shadow-[var(--shadow-soft)]">
        {/* Window chrome — three dots so it reads as a UI window. */}
        <div className="flex items-center gap-1.5 pb-4">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
          <span className="ml-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Applications · 2026
          </span>
        </div>

        {/* Mock rows — each row reads as a real application card. */}
        <ul className="flex flex-col gap-3">
          {ROWS.map((row) => (
            <li
              key={row.university}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/80 px-3.5 py-3"
            >
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-foreground">
                  {row.university}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {row.programme}
                </span>
              </div>
              <Badge tone={row.tone} dot>
                {row.label}
              </Badge>
            </li>
          ))}
        </ul>

        {/* Faux progress strip at the bottom — the coral fill ties back to
         * the brand accent. */}
        <div className="mt-5 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>3 of 5 universities</span>
          <div className="relative h-1.5 w-32 overflow-hidden rounded-full bg-muted">
            <div className="absolute inset-y-0 left-0 w-3/5 rounded-full bg-accent" />
          </div>
        </div>
      </div>
    </div>
  );
}
