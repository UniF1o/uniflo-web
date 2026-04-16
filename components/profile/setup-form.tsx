// ProfileSetupForm — three-step form that collects a student's full profile.
//
// Steps:
//   1. Personal details — first name, last name, date of birth, SA ID number
//   2. Contact details  — phone number, residential address, nationality
//   3. Identity         — gender, home language
//
// API saves:
//   After each step the user clicks "Save and continue", which POSTs the
//   accumulated data to the backend (POST /profile, Bearer JWT). The payload
//   grows with each step so partial progress is persisted even if the student
//   drops off mid-flow — they won't need to re-enter earlier steps on return.
//
//   Assumption: the backend accepts partial data (upsert/PATCH semantics via
//   POST). If the API changes to require all fields in one shot, switch to
//   accumulating state client-side and POST only on the final step.
//
// Types:
//   ProfilePayload is hand-written to match the student_profiles schema.
//   When Partner B delivers the FastAPI OpenAPI spec, run `openapi-typescript`
//   and replace it with the generated type for the /profile endpoint body.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";

// ─── Constants ───────────────────────────────────────────────────────────────

const STEPS = ["Personal details", "Contact details", "Identity"] as const;

// Gender options — values must match the backend enum exactly.
// Confirm these with Partner B before going live.
const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

// All 11 South African official languages. Ordering and values must match the
// backend enum — confirm with Partner B before going live.
const HOME_LANGUAGE_OPTIONS = [
  { value: "zulu", label: "isiZulu" },
  { value: "xhosa", label: "isiXhosa" },
  { value: "afrikaans", label: "Afrikaans" },
  { value: "english", label: "English" },
  { value: "sepedi", label: "Sepedi" },
  { value: "tswana", label: "Setswana" },
  { value: "sesotho", label: "Sesotho" },
  { value: "tsonga", label: "Xitsonga" },
  { value: "swati", label: "siSwati" },
  { value: "venda", label: "Tshivenda" },
  { value: "ndebele", label: "isiNdebele" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

// All fields are optional because each step only sends what's been filled in.
// The backend must handle partial updates (POST upsert, not a full replace).
// Replace with the openapi-typescript generated type once the spec is available.
interface ProfilePayload {
  first_name?: string;
  last_name?: string;
  id_number?: string;
  date_of_birth?: string; // ISO 8601 — "YYYY-MM-DD"
  phone?: string;
  address?: string;
  nationality?: string;
  gender?: string;
  home_language?: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────
//
// Each step has its own validator that returns a Record<fieldKey, errorMessage>.
// An empty object means all fields are valid. Errors are displayed inline
// beneath each field rather than in a single top-level banner.

function validateStep1(fields: {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  idNumber: string;
}) {
  const errors: Record<string, string> = {};
  if (!fields.firstName.trim()) errors.firstName = "First name is required.";
  if (!fields.lastName.trim()) errors.lastName = "Last name is required.";
  if (!fields.dateOfBirth) errors.dateOfBirth = "Date of birth is required.";
  if (!fields.idNumber) {
    errors.idNumber = "ID number is required.";
  } else if (!/^\d{13}$/.test(fields.idNumber)) {
    // Only checks digit count for MVP. Full Luhn checksum validation is
    // post-MVP — it adds complexity without meaningful UX benefit at this stage.
    errors.idNumber = "SA ID number must be exactly 13 digits.";
  }
  return errors;
}

function validateStep2(fields: {
  phone: string;
  address: string;
  nationality: string;
}) {
  const errors: Record<string, string> = {};
  if (!fields.phone.trim()) errors.phone = "Phone number is required.";
  if (!fields.address.trim()) errors.address = "Address is required.";
  if (!fields.nationality.trim()) errors.nationality = "Nationality is required.";
  return errors;
}

function validateStep3(fields: { gender: string; homeLanguage: string }) {
  const errors: Record<string, string> = {};
  if (!fields.gender) errors.gender = "Please select a gender.";
  if (!fields.homeLanguage) errors.homeLanguage = "Please select a home language.";
  return errors;
}

// ─── Step indicator ───────────────────────────────────────────────────────────
//
// Renders numbered circles connected by thin horizontal lines. Each circle is
// in one of three states:
//   - Done (stepNum < current)   — filled primary + checkmark icon
//   - Active (stepNum === current) — filled primary + focus ring
//   - Upcoming (stepNum > current) — outlined + muted number
//
// Step labels are hidden below the `sm` breakpoint (< 640px) to prevent text
// overflow on narrow phone screens — only the numbered circles show.

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((title, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < current;   // step was completed
        const isActive = stepNum === current; // step currently visible
        return (
          <div key={stepNum} className="flex items-center gap-2">
            {/* Circle — styling switches based on done/active/upcoming state. */}
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                isDone && "bg-primary text-primary-foreground",
                isActive && "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2",
                !isDone && !isActive && "border border-border text-muted-foreground",
              )}
            >
              {isDone ? <CheckCircle2 size={14} /> : stepNum}
            </div>
            {/* Label — visible from sm (640px) upward only. */}
            <span
              className={cn(
                "hidden text-xs sm:inline",
                isActive ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {title}
            </span>
            {/* Connector line — only rendered between steps (not after the last).
             * Fills with primary colour once the left-hand step is done. */}
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px w-6 flex-shrink-0 rounded-full sm:w-10",
                  isDone ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main form component ──────────────────────────────────────────────────────

export function ProfileSetupForm() {
  const router = useRouter();

  // `step` tracks which screen (1–3) is visible. All field state lives at the
  // top level so data from earlier steps is preserved when navigating back.
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  // apiError holds network/server error text shown above the action buttons.
  const [apiError, setApiError] = useState<string | null>(null);
  // fieldErrors maps field keys to inline error messages beneath each input.
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Step 1: personal details
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [idNumber, setIdNumber] = useState("");

  // Step 2: contact details
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [nationality, setNationality] = useState("");

  // Step 3: identity
  const [gender, setGender] = useState("");
  const [homeLanguage, setHomeLanguage] = useState("");

  // Removes one field's error message the moment the user starts correcting it.
  // The early-return (`if (!prev[key]) return prev`) avoids a re-render when
  // the field has no error to clear — returning the same reference prevents
  // React from scheduling an unnecessary update.
  function clearError(key: string) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  // POSTs accumulated profile data to the backend.
  // Retrieves the Supabase JWT from the active session and attaches it as a
  // Bearer token. Returns true on success; sets apiError and returns false on
  // any failure (missing session, missing env var, HTTP error, or network error).
  async function saveProfile(payload: ProfilePayload): Promise<boolean> {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      setApiError("Your session has expired. Please sign in again.");
      return false;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      setApiError("API URL is not configured. Contact support.");
      return false;
    }

    try {
      const res = await fetch(`${apiUrl}/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // FastAPI validation errors (422) surface under a `detail` string key.
        // For other error codes the body may differ, so we fall back to a
        // generic message if `detail` isn't a plain string.
        const body = await res.json().catch(() => ({}));
        const message =
          typeof body.detail === "string"
            ? body.detail
            : "Failed to save. Please try again.";
        setApiError(message);
        return false;
      }

      return true;
    } catch {
      // Network-level failure (offline, DNS, timeout, etc.)
      setApiError(
        "Unable to connect. Check your internet connection and try again.",
      );
      return false;
    }
  }

  // Validates the current step, then POSTs to the backend and advances.
  // Called both from each <form>'s onSubmit (Enter key) and from the
  // "Save and continue" button's onClick — the optional `e` param lets both
  // code paths reuse the same handler.
  async function handleContinue(e?: React.FormEvent) {
    e?.preventDefault();
    setApiError(null);

    // Run the validator for whichever step is active.
    const errors =
      step === 1
        ? validateStep1({ firstName, lastName, dateOfBirth, idNumber })
        : step === 2
          ? validateStep2({ phone, address, nationality })
          : validateStep3({ gender, homeLanguage });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    // The payload grows with each step. Step 1 sends only personal details;
    // step 2 spreads contact details on top; step 3 adds identity fields.
    // `...(condition && { key: value })` spreads the object when condition is
    // truthy and spreads nothing (false is ignored) when it isn't.
    const payload: ProfilePayload = {
      first_name: firstName,
      last_name: lastName,
      id_number: idNumber,
      date_of_birth: dateOfBirth,
      ...(step >= 2 && { phone, address, nationality }),
      ...(step >= 3 && { gender, home_language: homeLanguage }),
    };

    const saved = await saveProfile(payload);
    setLoading(false);

    if (!saved) return;

    if (step < 3) {
      setStep((s) => s + 1);
    } else {
      // All three steps done — move on to academic records (Task 5 / Phase 1).
      router.push("/academic-records");
    }
  }

  return (
    <div className="space-y-8">
      {/* Step indicator */}
      <StepIndicator current={step} />

      {/* Step heading */}
      <div className="space-y-1">
        <h1 className="font-display text-3xl tracking-tight text-foreground">
          {STEPS[step - 1]}
        </h1>
        <p className="text-sm text-muted-foreground">
          Step {step} of {STEPS.length}
          {step < STEPS.length && " — your progress is saved as you go."}
          {step === STEPS.length && " — last step."}
        </p>
      </div>

      {/* Each step's fields are wrapped in their own <form> so pressing Enter
       * inside an input triggers handleContinue via onSubmit. The "Save and
       * continue" button lives outside the form (in the nav block below) and
       * uses onClick instead of type="submit", which would be a no-op outside
       * a form element. Both paths call the same handleContinue handler. */}
      {/* ── Step 1: Personal details ─────────────────────────────────────── */}
      {step === 1 && (
        <form onSubmit={handleContinue} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="firstName"
              label="First name"
              type="text"
              autoComplete="given-name"
              placeholder="Jane"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                clearError("firstName");
              }}
              error={fieldErrors.firstName}
            />
            <Input
              id="lastName"
              label="Last name"
              type="text"
              autoComplete="family-name"
              placeholder="Dlamini"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                clearError("lastName");
              }}
              error={fieldErrors.lastName}
            />
          </div>

          <Input
            id="dateOfBirth"
            label="Date of birth"
            type="date"
            autoComplete="bday"
            value={dateOfBirth}
            onChange={(e) => {
              setDateOfBirth(e.target.value);
              clearError("dateOfBirth");
            }}
            error={fieldErrors.dateOfBirth}
          />

          <div className="space-y-1">
            <Input
              id="idNumber"
              label="South African ID number"
              type="text"
              inputMode="numeric"
              maxLength={13}
              placeholder="0001010000000"
              value={idNumber}
              onChange={(e) => {
                // Strip non-digit characters on every keystroke so the field
                // only ever holds numbers. maxLength={13} caps further input.
                setIdNumber(e.target.value.replace(/\D/g, ""));
                clearError("idNumber");
              }}
              error={fieldErrors.idNumber}
            />
            <p className="text-xs text-muted-foreground">
              13-digit number on the front of your green ID book or smart card.
            </p>
          </div>
        </form>
      )}

      {/* ── Step 2: Contact details ──────────────────────────────────────── */}
      {step === 2 && (
        <form onSubmit={handleContinue} noValidate className="space-y-4">
          <Input
            id="phone"
            label="Phone number"
            type="tel"
            autoComplete="tel"
            placeholder="+27 82 123 4567"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              clearError("phone");
            }}
            error={fieldErrors.phone}
          />

          <Input
            id="address"
            label="Residential address"
            type="text"
            autoComplete="street-address"
            placeholder="123 Main Street, Soweto, Johannesburg"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              clearError("address");
            }}
            error={fieldErrors.address}
          />

          <Input
            id="nationality"
            label="Nationality"
            type="text"
            autoComplete="country-name"
            placeholder="South African"
            value={nationality}
            onChange={(e) => {
              setNationality(e.target.value);
              clearError("nationality");
            }}
            error={fieldErrors.nationality}
          />
        </form>
      )}

      {/* ── Step 3: Identity ────────────────────────────────────────────── */}
      {step === 3 && (
        <form onSubmit={handleContinue} noValidate className="space-y-4">
          <Select
            id="gender"
            label="Gender"
            placeholder="Select gender"
            options={GENDER_OPTIONS}
            value={gender}
            onChange={(e) => {
              setGender(e.target.value);
              clearError("gender");
            }}
            error={fieldErrors.gender}
          />

          <div className="space-y-1">
            <Select
              id="homeLanguage"
              label="Home language"
              placeholder="Select language"
              options={HOME_LANGUAGE_OPTIONS}
              value={homeLanguage}
              onChange={(e) => {
                setHomeLanguage(e.target.value);
                clearError("homeLanguage");
              }}
              error={fieldErrors.homeLanguage}
            />
            <p className="text-xs text-muted-foreground">
              Used to complete university application forms on your behalf.
            </p>
          </div>
        </form>
      )}

      {/* API-level error (session expired, network failure, server 4xx/5xx).
       * role="alert" makes screen readers announce it when it appears.
       * Shown below the fields and above the navigation buttons. */}
      {apiError && (
        <p role="alert" className="text-sm text-destructive">
          {apiError}
        </p>
      )}

      {/* Navigation — Back only appears on steps 2 and 3.
       * Clicking Back clears any API error from the previous attempt so it
       * doesn't linger when the user returns to that step. */}
      <div className="flex gap-3">
        {step > 1 && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setApiError(null);
              setStep((s) => s - 1);
            }}
            disabled={loading}
          >
            Back
          </Button>
        )}
        {/* fullWidth expands the button to fill remaining space so it sits flush
         * next to the Back button (or spans the full row on step 1). */}
        <Button
          type="button"
          fullWidth
          loading={loading}
          onClick={handleContinue}
        >
          {step === STEPS.length ? "Complete setup" : "Save and continue"}
        </Button>
      </div>
    </div>
  );
}
