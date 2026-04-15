// Button — primary interactive element used across auth screens and forms.
//
// Variants:
//   primary — solid indigo background, cream text. Main call-to-action.
//   ghost   — transparent with a border. Secondary / alternative actions.
//
// The `loading` prop disables the button and shows a spinning indicator
// while an async operation (e.g. a Supabase auth call) is in flight.
import { cn } from "@/lib/utils/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
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
      className={cn(
        // Base — shared across all variants
        "inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" &&
          "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "ghost" &&
          "border border-border text-foreground hover:bg-muted",
        fullWidth && "w-full",
        className,
      )}
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
