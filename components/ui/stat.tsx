// Stat — a single proof-point on the landing page (e.g. "26 universities").
// Two-line vertical block: large display number in the editorial serif,
// small uppercase label underneath. Optional accent on the value's leading
// glyph to keep the trio in the social-proof bar visually rhythmic.
import { cn } from "@/lib/utils/cn";

interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  // The headline value, e.g. "26", "40+", "100%".
  value: string;
  // The label underneath, e.g. "universities covered".
  label: string;
  // Optional small caption rendered below the label in the script font, used
  // for human-feeling annotations like "and counting".
  note?: string;
}

export function Stat({ value, label, note, className, ...props }: StatProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 text-center sm:items-start sm:text-left",
        className,
      )}
      {...props}
    >
      <span className="font-display text-5xl leading-none tracking-tight text-foreground md:text-6xl">
        {value}
      </span>
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      {note && <span className="font-script text-lg text-primary">{note}</span>}
    </div>
  );
}
