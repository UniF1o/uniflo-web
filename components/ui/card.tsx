// Card — a layout primitive used everywhere a bordered or elevated surface
// is needed. Three visual variants:
//
//   paper    — the default. Hairline border on cream paper. Use for lists,
//              dashboards, anything that should sit calmly on the page.
//   elevated — adds a soft drop shadow so the card lifts off the page. Use
//              for the dashboard mockup, hover states, or any moment that
//              needs to feel "important".
//   feature  — a richer surface with a sky → cream gradient and the larger
//              radius-2xl. Use sparingly — closing CTAs, hero callouts.
//
// All variants accept `className` for layout overrides (padding, gap, etc.)
// rather than baking spacing into the variant.
import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

type CardVariant = "paper" | "elevated" | "feature";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  // Render as a different element (e.g. <article>) without giving up styling.
  as?: keyof React.JSX.IntrinsicElements;
}

const variantClasses: Record<CardVariant, string> = {
  paper:
    "rounded-xl border border-border bg-background shadow-[var(--shadow-paper)]",
  elevated:
    "rounded-xl border border-border bg-background shadow-[var(--shadow-soft)]",
  feature:
    "rounded-2xl border border-foreground/10 bg-[linear-gradient(135deg,var(--color-soft)_0%,var(--color-background)_60%,var(--color-muted)_100%)] shadow-[var(--shadow-soft)]",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "paper", as = "div", className, children, ...props }, ref) => {
    const Component = as as React.ElementType;
    return (
      <Component
        ref={ref}
        className={cn(variantClasses[variant], className)}
        {...props}
      >
        {children}
      </Component>
    );
  },
);

Card.displayName = "Card";
