// Checkbox — labelled boolean control matching the form field language.
//
// Renders a native checkbox with the label to its right. The whole row is a
// <label> so tapping the text toggles the box (larger hit target on mobile).
// An optional `description` line sits beneath the label for context.
import { forwardRef } from "react";

interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, id, ...props }, ref) => {
    return (
      <label
        htmlFor={id}
        className="flex cursor-pointer items-start gap-3 py-1"
      >
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
          {...props}
        />
        <span className="space-y-0.5">
          <span className="block text-sm text-foreground">{label}</span>
          {description && (
            <span className="block text-xs text-muted-foreground">
              {description}
            </span>
          )}
        </span>
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";
