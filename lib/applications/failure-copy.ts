// Source of truth for failure copy.
//
// Maps Partner B's `application_jobs.last_error.code` to user-facing text.
// Defined in one place so the detail page, the list-row tooltip, and the
// review-screen 503 row never drift out of sync. Codes match the taxonomy
// table in `docs/phase-3/partner-a-phase-3-plan.md`.
//
// `retryable` here is a *fallback default* — the backend's structured
// `retryable` field always wins when present. The defaults exist so the
// UI behaves sensibly during the period when the backend still emits
// free-text `last_error` and `retryable` is unknown.

import type { JobErrorCode } from "@/lib/api/phase-3";

export interface FailureCopy {
  // Short headline rendered in a destructive `<Alert>`.
  headline: string;
  // Default retryability when the backend hasn't said. The plan calls out
  // which codes should not offer Retry — those default to `false` here.
  defaultRetryable: boolean;
}

// Interpolation slots — pulled from the structured error's `message` (and,
// for portal_unavailable, the university name from the application row).
export interface FailureCopyContext {
  message?: string | null;
  universityName?: string | null;
}

// Per-code copy. Functions take a context so the copy can splice in the
// portal-specific message (`validation_failed`) or the university name
// (`portal_unavailable`).
const FAILURE_COPY: Record<
  JobErrorCode,
  {
    headline: (ctx: FailureCopyContext) => string;
    defaultRetryable: boolean;
  }
> = {
  portal_changed: {
    headline: () =>
      "The university portal changed unexpectedly. Our team has been notified.",
    defaultRetryable: false,
  },
  auth_failed: {
    headline: () =>
      "We couldn't sign in to the portal. Please contact support.",
    defaultRetryable: false,
  },
  validation_failed: {
    headline: (ctx) =>
      ctx.message
        ? `The portal rejected the application. ${ctx.message}`
        : "The portal rejected the application.",
    defaultRetryable: true,
  },
  timeout: {
    headline: () =>
      "The portal didn't respond in time. We'll try again automatically.",
    defaultRetryable: true,
  },
  portal_unavailable: {
    headline: (ctx) =>
      `Applications to ${ctx.universityName ?? "this university"} are temporarily unavailable.`,
    defaultRetryable: true,
  },
  unknown: {
    headline: () => "Something went wrong. Our team has been notified.",
    defaultRetryable: true,
  },
};

export function getFailureCopy(
  code: JobErrorCode,
  ctx: FailureCopyContext = {},
): FailureCopy {
  const entry = FAILURE_COPY[code];
  return {
    headline: entry.headline(ctx),
    defaultRetryable: entry.defaultRetryable,
  };
}

// Convenience: combine the structured error's `retryable` (when present)
// with the per-code default. The structured value always wins.
export function isRetryable(
  code: JobErrorCode,
  retryable: boolean | undefined,
): boolean {
  return retryable ?? FAILURE_COPY[code].defaultRetryable;
}
