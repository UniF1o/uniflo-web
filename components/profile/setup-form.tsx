// ProfileSetupForm — three-step form that collects a student's full profile.
//
// Steps:
//   1. Personal details — name, date of birth, SA ID number
//   2. Contact details  — phone, address, nationality
//   3. Identity         — gender, home language
//
// After each step the accumulated data is sent to the backend via
// POST /profile with the JWT in the Authorization header. This means
// partial progress is saved to the API even if the student drops off
// mid-flow, so they don't have to start over.
//
// Types are hand-written until Partner B delivers the FastAPI OpenAPI spec.
// When it's available, run `openapi-typescript` and replace ProfilePayload
// with the generated type for the /profile endpoint request body.
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

// Gender values — confirm these string values with Partner B before going live,
// as the backend enum may differ from these labels.
const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

// All 11 South African official languages. Confirm ordering/values with Partner B.
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

// Partial is intentional: each step sends only what's been collected so far.
// The API must accept partial profile data (PATCH semantics via POST upsert).
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

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((title, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < current;
        const isActive = stepNum === current;
        return (
          <div key={stepNum} className="flex items-center gap-2">
            {/* Step circle */}
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
            {/* Label — hidden on small screens to avoid overflow */}
            <span
              className={cn(
                "hidden text-xs sm:inline",
                isActive ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {title}
            </span>
            {/* Connector line between steps */}
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
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Step 1 fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [idNumber, setIdNumber] = useState("");

  // Step 2 fields
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [nationality, setNationality] = useState("");

  // Step 3 fields
  const [gender, setGender] = useState("");
  const [homeLanguage, setHomeLanguage] = useState("");

  // Clears a single field error as the user starts typing — so errors vanish
  // as soon as the user addresses them rather than on the next submission.
  function clearError(key: string) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  // Sends accumulated profile data to the backend.
  // Returns true on success, false on any error (also sets apiError state).
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
        // FastAPI returns error details under `detail` for 422 responses.
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

  async function handleContinue(e?: React.FormEvent) {
    e?.preventDefault();
    setApiError(null);

    // Validate the current step's fields before hitting the network.
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

    // Build the payload with every field collected so far. The API receives
    // more complete data at each step — by step 3 it has the full profile.
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
      // Profile complete — move on to academic records (Task 5).
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

      {/* Each step is its own <form> so Enter-to-submit works naturally and
       * the browser's built-in focus management moves to the first field. */}
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
                // Allow digits only — filter out any non-numeric input.
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

      {/* API-level error — shown below the fields, above the action buttons. */}
      {apiError && (
        <p role="alert" className="text-sm text-destructive">
          {apiError}
        </p>
      )}

      {/* Navigation buttons */}
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
