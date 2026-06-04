// Textarea — multi-line text field mirroring Input's visual language.
//
// Used for free-text profile fields (e.g. disability detail / assistance) where
// a single line is too cramped. Same label/error/aria wiring as Input.
import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, id, className, rows = 3, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>

        <textarea
          ref={ref}
          id={id}
          rows={rows}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={error ? true : undefined}
          className={cn(
            "w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_0_rgba(13,26,61,0.04)]",
            "placeholder:text-muted-foreground",
            "transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25",
            error &&
              "border-destructive focus:border-destructive focus:ring-destructive/25",
            className,
          )}
          {...props}
        />

        {error && (
          <p
            id={`${id}-error`}
            role="alert"
            className="text-xs text-destructive"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
