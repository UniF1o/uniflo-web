// FormSection — a titled card for one group of form fields.
//
// Gives every data-entry page the same rhythm: a serif title on a softly
// sky-tinted header band, an optional description and badge, then the
// fields on lifted paper. Replaces the bare uppercase labels that made the
// form pages read as walls of inputs.
import { Card } from "./card";
import { cn } from "@/lib/utils/cn";

interface FormSectionProps {
  title: string;
  description?: React.ReactNode;
  // Optional element on the title row's right edge (e.g. a "Saved" chip).
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  badge,
  children,
  className,
}: FormSectionProps) {
  return (
    <Card variant="paper" className={cn("overflow-hidden", className)}>
      <div className="border-b border-border bg-[linear-gradient(110deg,var(--color-soft)_0%,transparent_60%)] px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl tracking-tight text-foreground">
            {title}
          </h2>
          {badge}
        </div>
        {description && (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </Card>
  );
}
