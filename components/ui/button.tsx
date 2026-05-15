// Button — primary interactive element used across the app.
//
// Variants:
//   primary   — solid cobalt background, cream text. The default brand action.
//   accent    — solid coral with a popped shadow. Reserved for the single
//               most important action on the page (the marketing CTA, the
//               "Submit applications" button). Carries a subtle hover lift.
//   secondary — cream surface with a navy border and label. Use when both
//               actions are equally weighted.
//   ghost     — transparent with a hairline border. Tertiary actions.
//
// `loading` disables the button and shows a spinner.
// `fullWidth` makes the button span its container — useful in stacked forms.
//
// `buttonClasses` is exported separately so a Next `<Link>` can carry the
// same visual treatment without nesting a <button> inside an <a> (which is
// invalid HTML). Use the helper any time the click target is navigation:
//   <Link href="/x" className={buttonClasses({ variant: "accent" })}>Go</Link>
import { cn } from "@/lib/utils/cn";

export type ButtonVariant = "primary" | "accent" | "secondary" | "ghost";

interface ButtonClassOptions {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  className?: string;
}

export function buttonClasses({
  variant = "primary",
  fullWidth = false,
  className,
}: ButtonClassOptions = {}): string {
  return cn(
    // Shared base — every variant inherits these utilities.
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",

    // primary — solid cobalt. Subtle vertical lift on hover.
    variant === "primary" &&
      "bg-primary text-primary-foreground shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:bg-primary/95 active:translate-y-0",

    // accent — navy CTA with shadow-pop. Tiny rotate on hover signals
    // hand-applied/playful intent. A diagonal shimmer sweep runs every
    // few seconds via the ::after pseudo so the button reads "alive"
    // even when idle. motion-reduce strips the shimmer.
    variant === "accent" &&
      "relative overflow-hidden bg-accent text-accent-foreground shadow-[var(--shadow-pop)] hover:-translate-y-0.5 hover:[transform:translateY(-2px)_rotate(-0.5deg)] active:[transform:translateY(0)_rotate(0)] after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(120deg,transparent_35%,rgba(255,255,255,0.35)_50%,transparent_65%)] after:[animation:shimmer_4.5s_ease-in-out_infinite] after:[animation-delay:1.2s] motion-reduce:after:hidden",

    // secondary — cream-on-navy outline. Reads as "another good option".
    variant === "secondary" &&
      "border border-foreground/15 bg-background text-foreground shadow-[var(--shadow-paper)] hover:border-foreground/30 hover:bg-muted",

    // ghost — minimal, lets surrounding content breathe.
    variant === "ghost" && "text-foreground hover:bg-muted",

    fullWidth && "w-full",
    className,
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  loading = false,
  fullWidth = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={buttonClasses({ variant, fullWidth, className })}
      {...props}
    >
      {/* Spinner rendered when loading=true. aria-hidden keeps it silent for
       * screen readers — the disabled state already communicates "busy". */}
      {loading && (
        <svg
          aria-hidden
          className="h-4 w-4 shrink-0 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
