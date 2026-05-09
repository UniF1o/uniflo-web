// SectionHeading — the eyebrow + headline + optional sub-line that opens
// every section on the landing page. Single source of truth for section
// rhythm: spacing, font choices, and the optional accent squiggle under
// one accented word.
//
// Pass `accentText` to highlight a single word (or short phrase) in the
// coral accent colour with a hand-drawn squiggle underneath. The headline
// before/after the accent is rendered as plain text.
import { Squiggle } from "@/components/ui/motifs";
import { cn } from "@/lib/utils/cn";

interface SectionHeadingProps {
  eyebrow?: string;
  // The headline text. If `accentText` is provided, the first occurrence of
  // it will be wrapped in the accent colour + squiggle treatment.
  title: string;
  accentText?: string;
  // Sub-line rendered under the headline.
  description?: string;
  // Center-align the heading block (used for full-width sections like FAQ).
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  accentText,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  // Split the title around the accent text, if provided. Falls back to the
  // raw title when there's no match (e.g. punctuation got in the way).
  const parts =
    accentText && title.includes(accentText) ? title.split(accentText) : null;

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow && (
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {eyebrow}
        </span>
      )}
      <h2 className="max-w-3xl font-display text-3xl leading-[1.05] tracking-tight text-foreground md:text-5xl">
        {parts ? (
          <>
            {parts[0]}
            <span className="relative inline-block">
              <span className="text-primary">{accentText}</span>
              {/* Squiggle sits below the baseline so it reads as an
               * underline scribble, not a strikethrough. */}
              <Squiggle className="pointer-events-none absolute -bottom-2 left-0 h-3 w-full text-primary" />
            </span>
            {parts.slice(1).join(accentText)}
          </>
        ) : (
          title
        )}
      </h2>
      {description && (
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}
