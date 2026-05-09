// Alert — a tinted callout for inline form errors and confirmations.
//
// Used by the auth forms (`LoginForm`, `SignUpForm`, `forgot-password`) to
// surface a Supabase auth error in a more visible way than a single line of
// red text. Tone-driven via the same tokens as `Badge`.
//
// Pass `role="alert"` (default) for messages that should be announced when
// they appear; switch to `role="status"` for less urgent confirmations.
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type AlertTone = "destructive" | "info" | "success" | "warning";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: AlertTone;
  // Override the default ARIA role. `alert` for errors, `status` for soft
  // confirmations.
  role?: "alert" | "status";
  // Optional title rendered above the message.
  title?: string;
}

const TONE_CLASSES: Record<AlertTone, string> = {
  destructive: "border-destructive/30 bg-destructive/8 text-destructive",
  info: "border-primary/25 bg-primary/8 text-primary",
  success: "border-success/25 bg-success/8 text-success",
  warning: "border-warning/25 bg-warning/8 text-warning",
};

const TONE_ICON: Record<
  AlertTone,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  destructive: AlertCircle,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
};

export function Alert({
  tone = "destructive",
  role = "alert",
  title,
  className,
  children,
  ...props
}: AlertProps) {
  const Icon = TONE_ICON[tone];
  return (
    <div
      role={role}
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm leading-relaxed",
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    >
      <Icon size={16} className="mt-0.5 shrink-0" aria-hidden />
      <div className="flex flex-col gap-0.5">
        {title && <span className="font-medium">{title}</span>}
        <span className="text-current/90">{children}</span>
      </div>
    </div>
  );
}
