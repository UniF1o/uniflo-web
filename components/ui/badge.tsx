// Badge — a small token-driven pill used for status, eyebrow labels, and
// inline tags. Five tonal variants tied to the design tokens; no ad-hoc
// Tailwind palette colours leak in, so a future palette swap stays clean.
import { cn } from "@/lib/utils/cn";

type BadgeTone = "info" | "success" | "warning" | "destructive" | "neutral";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  // Optional dot prefix rendered before the label. The dot uses the same tone
  // colour at full saturation, while the surrounding pill is tinted softer.
  dot?: boolean;
  // When true and `dot` is also true, the dot emits a soft concentric ping —
  // signals "this is a live, ongoing thing" (eg. the hero "for matrics" badge,
  // or a processing application). Reduced-motion strips the ping animation.
  pulse?: boolean;
}

// Tonal pairs: a subtly tinted background, a saturated foreground.
// All foregrounds clear AA against their tinted backgrounds.
const toneClasses: Record<BadgeTone, { bg: string; fg: string; dot: string }> =
  {
    info: {
      bg: "bg-soft",
      fg: "text-primary",
      dot: "bg-primary",
    },
    success: {
      bg: "bg-success/10",
      fg: "text-success",
      dot: "bg-success",
    },
    warning: {
      bg: "bg-warning/10",
      fg: "text-warning",
      dot: "bg-warning",
    },
    destructive: {
      bg: "bg-destructive/10",
      fg: "text-destructive",
      dot: "bg-destructive",
    },
    neutral: {
      bg: "bg-muted",
      fg: "text-muted-foreground",
      dot: "bg-muted-foreground",
    },
  };

export function Badge({
  tone = "neutral",
  dot = false,
  pulse = false,
  className,
  children,
  ...props
}: BadgeProps) {
  const t = toneClasses[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        t.bg,
        t.fg,
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          aria-hidden
          // The wrapper holds the solid dot; the ::after pseudo (added via the
          // pulse class below) renders the expanding ping ring on top.
          className={cn(
            "relative h-1.5 w-1.5 rounded-full",
            t.dot,
            pulse &&
              "after:absolute after:inset-0 after:rounded-[inherit] after:bg-[currentColor] after:[animation:ping_2.4s_cubic-bezier(0,0,0.2,1)_infinite] after:motion-reduce:hidden",
          )}
        />
      )}
      {children}
    </span>
  );
}
