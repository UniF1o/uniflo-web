// Input — labelled form field with an optional error message slot.
//
// Wraps the native <input> with a <label> above and an error <p> below.
// The `id` prop is required for correct label/input association (a11y).
// When `error` is set, the border turns destructive red and an aria-describedby
// link connects the input to the error message for screen readers.
import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // Human-readable label rendered above the input.
  label: string;
  // If set, renders below the input in destructive red and marks the input invalid.
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>

        <input
          ref={ref}
          id={id}
          // aria-describedby links the input to its error message so screen
          // readers announce the error when the field is focused.
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={error ? true : undefined}
          className={cn(
            "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground",
            "placeholder:text-muted-foreground",
            "transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20",
            // Switch to destructive palette when there is a validation error.
            error &&
              "border-destructive focus:border-destructive focus:ring-destructive/20",
            className,
          )}
          {...props}
        />

        {/* Error message. role="alert" makes screen readers announce it
         * immediately when it appears without the user having to re-focus. */}
        {error && (
          <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
