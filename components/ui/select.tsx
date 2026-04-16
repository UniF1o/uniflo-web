// Select — labelled dropdown with an error message slot.
//
// Wraps the native <select> so it matches the Input component's visual style:
// same height, border, focus ring, and error state. appearance-none removes
// the browser's default arrow; we render our own ChevronDown icon instead.
import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  // Optional placeholder shown as the first (disabled) option.
  placeholder?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, placeholder, error, id, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>

        {/* Wrapper gives us a positioning context for the chevron icon. */}
        <div className="relative">
          <select
            ref={ref}
            id={id}
            aria-describedby={error ? `${id}-error` : undefined}
            aria-invalid={error ? true : undefined}
            className={cn(
              // Match Input's sizing and colour tokens exactly.
              "h-10 w-full appearance-none rounded-lg border border-border bg-background px-3 pr-9 text-sm text-foreground",
              "transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20",
              // Placeholder option reads as muted until a real value is chosen.
              "invalid:text-muted-foreground",
              error &&
                "border-destructive focus:border-destructive focus:ring-destructive/20",
              className,
            )}
            {...props}
          >
            {placeholder && (
              // Disabled so the user can't re-select it after choosing a value.
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Chevron — pointer-events-none so it doesn't block the select's
           * native click target. */}
          <ChevronDown
            size={16}
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
        </div>

        {error && (
          <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";
