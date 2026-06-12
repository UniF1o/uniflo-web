// ProfileSetupForm — five-step wizard that collects a student's full profile.
//
// Steps:
//   1. Personal details  — first name, last name, date of birth, SA ID number
//   2. Contact details   — phone number, residential address, nationality
//   3. Demographics      — gender, home language
//   4. Background        — religion, disability, marital status, ethnicity
//   5. Studies & funding — optional (skippable): current activity, residence
//                          and funding intentions
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
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import { validateSAID } from "@/lib/utils/sa-id";
import { DateInput } from "@/components/ui/date-input";
import {
  DISABILITY_OPTIONS,
  ETHNICITY_OPTIONS,
  GENDER_OPTIONS,
  HOME_LANGUAGE_OPTIONS,
  CURRENT_ACTIVITY_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  NATIONALITY_OPTIONS,
  RELIGION_OPTIONS,
  SA_PROVINCE_OPTIONS,
} from "@/lib/constants/profile-enums";

// ─── Constants ───────────────────────────────────────────────────────────────

const STEPS = [
  "Personal details",
  "Contact details",
  "Demographics",
  "Background",
  "Studies & funding",
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

// All fields are optional because each step only sends what's been filled in.
// The backend must handle partial updates (POST upsert, not a full replace).
// Replace with the openapi-typescript generated type once the spec is available.
// TODO: backend needs to add separate address columns + the four new fields
// below. See the backend request message. Until then, these will be accepted
// once the migration lands.
interface ProfilePayload {
  first_name?: string;
  last_name?: string;
  id_number?: string;
  date_of_birth?: string; // ISO 8601 — "YYYY-MM-DD"
  phone?: string;
  street_address?: string;
  suburb?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  nationality?: string;
  gender?: string;
  home_language?: string;
  religion?: string;
  disability?: string;
  marital_status?: string;
  ethnicity?: string;
  // Step 5 — all optional, but they feed the automation (current_activity
  // gates whether automated submission is allowed at all).
  current_activity?: string | null;
  wants_residence?: boolean;
  preferred_residence?: string | null;
  applying_nsfas?: boolean;
  applying_institutional_funding?: boolean;
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
  } else {
    const idResult = validateSAID(
      fields.idNumber,
      fields.dateOfBirth || undefined,
    );
    if (!idResult.valid) errors.idNumber = idResult.reason;
  }
  return errors;
}

function validateStep2(fields: {
  phone: string;
  streetAddress: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
  nationality: string;
}) {
  const errors: Record<string, string> = {};
  if (!fields.phone.trim()) errors.phone = "Phone number is required.";
  if (!fields.streetAddress.trim())
    errors.streetAddress = "Street address is required.";
  if (!fields.city.trim()) errors.city = "City is required.";
  if (!fields.province) errors.province = "Province is required.";
  if (!fields.postalCode.trim()) {
    errors.postalCode = "Postal code is required.";
  } else if (!/^\d{4}$/.test(fields.postalCode)) {
    errors.postalCode = "SA postal code must be 4 digits.";
  }
  if (!fields.nationality) errors.nationality = "Nationality is required.";
  return errors;
}

function validateStep3(fields: { gender: string; homeLanguage: string }) {
  const errors: Record<string, string> = {};
  if (!fields.gender) errors.gender = "Please select a gender.";
  if (!fields.homeLanguage)
    errors.homeLanguage = "Please select a home language.";
  return errors;
}

function validateStep4(fields: {
  religion: string;
  disability: string;
  maritalStatus: string;
  ethnicity: string;
}) {
  const errors: Record<string, string> = {};
  if (!fields.religion) errors.religion = "Please select a religion.";
  if (!fields.disability) errors.disability = "Please select an option.";
  if (!fields.maritalStatus)
    errors.maritalStatus = "Please select a marital status.";
  if (!fields.ethnicity) errors.ethnicity = "Please select an ethnicity.";
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
        const isDone = stepNum < current; // step was completed
        const isActive = stepNum === current; // step currently visible
        return (
          <div key={stepNum} className="flex items-center gap-2">
            {/* Circle — styling switches based on done/active/upcoming state. */}
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                isDone && "bg-primary text-primary-foreground",
                isActive &&
                  "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2",
                !isDone &&
                  !isActive &&
                  "border border-border text-muted-foreground",
              )}
            >
              {isDone ? <CheckCircle2 size={14} /> : stepNum}
            </div>
            {/* Label — visible from sm (640px) upward only. */}
            <span
              className={cn(
                "hidden text-xs sm:inline",
                isActive
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
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
  const [streetAddress, setStreetAddress] = useState("");
  const [suburb, setSuburb] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [nationality, setNationality] = useState("");

  // Step 3: demographics
  const [gender, setGender] = useState("");
  const [homeLanguage, setHomeLanguage] = useState("");

  // Step 4: background
  const [religion, setReligion] = useState("");
  const [disability, setDisability] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [ethnicity, setEthnicity] = useState("");

  // Step 5: studies & funding — every field optional, so no validator.
  const [currentActivity, setCurrentActivity] = useState("");
  const [wantsResidence, setWantsResidence] = useState(false);
  const [preferredResidence, setPreferredResidence] = useState("");
  const [applyingNsfas, setApplyingNsfas] = useState(false);
  const [applyingInstitutionalFunding, setApplyingInstitutionalFunding] =
    useState(false);

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

    // Run the validator for whichever step is active. Step 5 is entirely
    // optional, so it has no validator.
    const errors =
      step === 1
        ? validateStep1({ firstName, lastName, dateOfBirth, idNumber })
        : step === 2
          ? validateStep2({
              phone,
              streetAddress,
              suburb,
              city,
              province,
              postalCode,
              nationality,
            })
          : step === 3
            ? validateStep3({ gender, homeLanguage })
            : step === 4
              ? validateStep4({
                  religion,
                  disability,
                  maritalStatus,
                  ethnicity,
                })
              : {};

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
      ...(step >= 2 && {
        phone,
        street_address: streetAddress,
        suburb,
        city,
        province,
        postal_code: postalCode,
        nationality,
      }),
      ...(step >= 3 && { gender, home_language: homeLanguage }),
      ...(step >= 4 && {
        religion,
        disability,
        marital_status: maritalStatus,
        ethnicity,
      }),
      // Blank optional strings go up as null — backend field validators
      // reject empty strings.
      ...(step >= 5 && {
        current_activity: currentActivity || null,
        wants_residence: wantsResidence,
        preferred_residence:
          wantsResidence && preferredResidence.trim()
            ? preferredResidence.trim()
            : null,
        applying_nsfas: applyingNsfas,
        applying_institutional_funding: applyingInstitutionalFunding,
      }),
    };

    const saved = await saveProfile(payload);
    setLoading(false);

    if (!saved) return;

    if (step < STEPS.length) {
      setStep((s) => s + 1);
    } else {
      router.push("/academic-records");
    }
  }

  // Step 5 is optional — skipping moves on without another POST (everything
  // up to step 4 is already saved). The dashboard keeps nudging for
  // current_activity until it's answered.
  function handleSkipFinalStep() {
    router.push("/academic-records");
  }

  return (
    <div className="space-y-8">
      {/* Step indicator */}
      <StepIndicator current={step} />

      {/* Step heading */}
      <div className="space-y-1">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-primary">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary" />
          Profile setup
        </p>
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
        <form
          onSubmit={handleContinue}
          noValidate
          className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-paper)] sm:p-6"
        >
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

          <DateInput
            id="dateOfBirth"
            label="Date of birth"
            value={dateOfBirth}
            onChange={(val) => {
              setDateOfBirth(val);
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
        <form
          onSubmit={handleContinue}
          noValidate
          className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-paper)] sm:p-6"
        >
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
            id="streetAddress"
            label="Street address"
            type="text"
            autoComplete="address-line1"
            placeholder="12 Vilakazi Street"
            value={streetAddress}
            onChange={(e) => {
              setStreetAddress(e.target.value);
              clearError("streetAddress");
            }}
            error={fieldErrors.streetAddress}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="suburb"
              label="Suburb"
              type="text"
              autoComplete="address-line2"
              placeholder="Orlando West"
              value={suburb}
              onChange={(e) => {
                setSuburb(e.target.value);
              }}
            />
            <Input
              id="city"
              label="City / Town"
              type="text"
              autoComplete="address-level2"
              placeholder="Soweto"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                clearError("city");
              }}
              error={fieldErrors.city}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="province"
              label="Province"
              placeholder="Select province"
              options={SA_PROVINCE_OPTIONS}
              value={province}
              onChange={(e) => {
                setProvince(e.target.value);
                clearError("province");
              }}
              error={fieldErrors.province}
            />
            <Input
              id="postalCode"
              label="Postal code"
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={4}
              placeholder="1804"
              value={postalCode}
              onChange={(e) => {
                setPostalCode(e.target.value.replace(/\D/g, ""));
                clearError("postalCode");
              }}
              error={fieldErrors.postalCode}
            />
          </div>

          <Select
            id="nationality"
            label="Nationality"
            placeholder="Select nationality"
            options={NATIONALITY_OPTIONS}
            value={nationality}
            onChange={(e) => {
              setNationality(e.target.value);
              clearError("nationality");
            }}
            error={fieldErrors.nationality}
          />
        </form>
      )}

      {/* ── Step 3: Demographics ────────────────────────────────────────── */}
      {step === 3 && (
        <form
          onSubmit={handleContinue}
          noValidate
          className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-paper)] sm:p-6"
        >
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

      {/* ── Step 4: Background ──────────────────────────────────────────── */}
      {step === 4 && (
        <form
          onSubmit={handleContinue}
          noValidate
          className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-paper)] sm:p-6"
        >
          <Select
            id="religion"
            label="Religion"
            placeholder="Select religion"
            options={RELIGION_OPTIONS}
            value={religion}
            onChange={(e) => {
              setReligion(e.target.value);
              clearError("religion");
            }}
            error={fieldErrors.religion}
          />

          <Select
            id="disability"
            label="Disability"
            placeholder="Select option"
            options={DISABILITY_OPTIONS}
            value={disability}
            onChange={(e) => {
              setDisability(e.target.value);
              clearError("disability");
            }}
            error={fieldErrors.disability}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="maritalStatus"
              label="Marital status"
              placeholder="Select status"
              options={MARITAL_STATUS_OPTIONS}
              value={maritalStatus}
              onChange={(e) => {
                setMaritalStatus(e.target.value);
                clearError("maritalStatus");
              }}
              error={fieldErrors.maritalStatus}
            />
            <Select
              id="ethnicity"
              label="Ethnicity"
              placeholder="Select ethnicity"
              options={ETHNICITY_OPTIONS}
              value={ethnicity}
              onChange={(e) => {
                setEthnicity(e.target.value);
                clearError("ethnicity");
              }}
              error={fieldErrors.ethnicity}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            These details are required by South African university application
            forms.
          </p>
        </form>
      )}

      {/* ── Step 5: Studies & funding (optional) ────────────────────────── */}
      {step === 5 && (
        <form
          onSubmit={handleContinue}
          noValidate
          className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-paper)] sm:p-6"
        >
          <p className="text-xs leading-relaxed text-muted-foreground">
            All optional — but the more we know, the more precisely we can
            complete each university&rsquo;s forms for you.
          </p>

          <div className="space-y-1">
            <Select
              id="currentActivity"
              label="What are you currently doing?"
              placeholder="Select option"
              options={CURRENT_ACTIVITY_OPTIONS}
              value={currentActivity}
              onChange={(e) => setCurrentActivity(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              If you&rsquo;re in Grade 12 now, we can submit applications
              automatically on your behalf.
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <Checkbox
              id="wantsResidence"
              label="I want to apply for university residence"
              checked={wantsResidence}
              onChange={(e) => setWantsResidence(e.target.checked)}
            />
            {wantsResidence && (
              <Input
                id="preferredResidence"
                label="Preferred residence (optional)"
                type="text"
                placeholder="e.g. Barnato Hall"
                value={preferredResidence}
                onChange={(e) => setPreferredResidence(e.target.value)}
              />
            )}
            <Checkbox
              id="applyingNsfas"
              label="I am applying for NSFAS funding"
              checked={applyingNsfas}
              onChange={(e) => setApplyingNsfas(e.target.checked)}
            />
            <Checkbox
              id="applyingInstitutionalFunding"
              label="I am applying for institutional funding / bursaries"
              checked={applyingInstitutionalFunding}
              onChange={(e) =>
                setApplyingInstitutionalFunding(e.target.checked)
              }
            />
          </div>
        </form>
      )}

      {/* API-level error (session expired, network failure, server 4xx/5xx).
       * role="alert" makes screen readers announce it when it appears.
       * Shown below the fields and above the navigation buttons. */}
      {apiError && <Alert tone="destructive">{apiError}</Alert>}

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

      {/* Step 5 escape hatch — the step is optional and must feel optional.
       * Everything up to step 4 is already saved, so skipping loses nothing. */}
      {step === STEPS.length && !loading && (
        <button
          type="button"
          onClick={handleSkipFinalStep}
          className="mx-auto block text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          Skip for now — you can add this later in your profile
        </button>
      )}
    </div>
  );
}
