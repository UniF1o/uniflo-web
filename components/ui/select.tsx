// Select — labelled native dropdown with an error message slot.
//
// Wraps <select> so it matches Input's visual language: same height,
// border, focus ring, and error state. We use a native <select> rather than a
// custom combobox library because:
//   - Keyboard navigation and screen-reader announcements are handled by the
//     browser for free.
//   - Mobile devices open their native picker (much better UX than a JS one).
//   - We only need it for two static option lists (gender, home language).
//
// `appearance-none` strips the browser's default arrow glyph; we place our own
// ChevronDown icon in the same spot so the visual style is consistent.
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

        {/* position:relative on the wrapper lets us absolutely-position the
         * chevron icon in the right-hand side of the select box. */}
        <div className="relative">
          <select
            ref={ref}
            id={id}
            // aria-describedby links the <select> to its error message so
            // screen readers announce the error text when the field is focused.
            // aria-invalid flags the invalid state to assistive technology.
            aria-describedby={error ? `${id}-error` : undefined}
            aria-invalid={error ? true : undefined}
            className={cn(
              // Matches Input's sizing and inset highlight for visual parity.
              "h-11 w-full cursor-pointer appearance-none rounded-lg border border-border bg-background px-3.5 pr-9 text-sm text-foreground",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_0_rgba(13,26,61,0.04)]",
              "transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25",
              error &&
                "border-destructive focus:border-destructive focus:ring-destructive/25",
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

          {/* pointer-events-none ensures clicks pass through the icon to the
           * underlying <select> — without it the icon would eat the click and
           * the dropdown wouldn't open. aria-hidden hides it from screen
           * readers since it's purely decorative. */}
          <ChevronDown
            size={16}
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
        </div>

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

Select.displayName = "Select";
