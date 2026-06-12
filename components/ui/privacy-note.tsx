// PrivacyNote — a quiet reassurance line for data-collection moments.
//
// Students hand over ID numbers, marks and family details; every page that
// asks for them carries this one consistent line so the promise is felt at
// the moment of trust, not buried in a policy page.
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function PrivacyNote({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 text-xs leading-relaxed text-muted-foreground",
        className,
      )}
    >
      <ShieldCheck
        size={14}
        aria-hidden
        className="mt-0.5 shrink-0 text-success"
      />
      <span>
        Your information is encrypted and stored securely. We only use it to
        complete your university applications. It is never sold or shared.
      </span>
    </p>
  );
}
