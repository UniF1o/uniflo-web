"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { validateSAID } from "@/lib/utils/sa-id";
import {
  DISABILITY_OPTIONS,
  ETHNICITY_OPTIONS,
  GENDER_OPTIONS,
  HOME_LANGUAGE_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  NATIONALITY_OPTIONS,
  RELIGION_OPTIONS,
  SA_PROVINCE_OPTIONS,
} from "@/lib/constants/profile-enums";
import type { components } from "@/lib/api/schema";

type ProfileResponse = components["schemas"]["StudentProfileResponse"];

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
      {children}
    </p>
  );
}

// ─── ProfileEditForm ──────────────────────────────────────────────────────────

export function ProfileEditForm() {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Personal
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [idNumber, setIdNumber] = useState("");

  // Contact
  const [phone, setPhone] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [suburb, setSuburb] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [nationality, setNationality] = useState("");

  // Identity
  const [gender, setGender] = useState("");
  const [homeLanguage, setHomeLanguage] = useState("");

  // Background
  const [religion, setReligion] = useState("");
  const [disability, setDisability] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [ethnicity, setEthnicity] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token || !apiUrl) {
        setLoadError("Your session has expired. Please sign in again.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 404) {
          router.replace("/profile/setup");
          return;
        }

        if (!res.ok) {
          setLoadError("Couldn't load your profile. Please try again.");
          setLoading(false);
          return;
        }

        const data = (await res.json()) as ProfileResponse;

        setFirstName(data.first_name ?? "");
        setLastName(data.last_name ?? "");
        setDateOfBirth(data.date_of_birth ?? "");
        setIdNumber(data.id_number ?? "");
        setPhone(data.phone ?? "");
        setStreetAddress(data.street_address ?? "");
        setSuburb(data.suburb ?? "");
        setCity(data.city ?? "");
        setProvince(data.province ?? "");
        setPostalCode(data.postal_code ?? "");
        setNationality(data.nationality ?? "");
        setGender(data.gender ?? "");
        setHomeLanguage(data.home_language ?? "");
        setReligion(data.religion ?? "");
        setDisability(data.disability ?? "");
        setMaritalStatus(data.marital_status ?? "");
        setEthnicity(data.ethnicity ?? "");
        setLoading(false);
      } catch {
        setLoadError(
          "Unable to connect. Check your internet connection and try again.",
        );
        setLoading(false);
      }
    }

    loadProfile();
  }, [apiUrl, router]);

  function clearError(key: string) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!firstName.trim()) errors.firstName = "First name is required.";
    if (!lastName.trim()) errors.lastName = "Last name is required.";
    if (!dateOfBirth) errors.dateOfBirth = "Date of birth is required.";

    if (!idNumber) {
      errors.idNumber = "ID number is required.";
    } else {
      const idResult = validateSAID(idNumber, dateOfBirth || undefined);
      if (!idResult.valid) errors.idNumber = idResult.reason;
    }

    if (!phone.trim()) errors.phone = "Phone number is required.";
    if (!streetAddress.trim())
      errors.streetAddress = "Street address is required.";
    if (!city.trim()) errors.city = "City is required.";
    if (!province) errors.province = "Province is required.";
    if (!postalCode.trim()) {
      errors.postalCode = "Postal code is required.";
    } else if (!/^\d{4}$/.test(postalCode)) {
      errors.postalCode = "SA postal code must be 4 digits.";
    }
    if (!nationality) errors.nationality = "Nationality is required.";
    if (!gender) errors.gender = "Please select a gender.";
    if (!homeLanguage) errors.homeLanguage = "Please select a home language.";
    if (!religion) errors.religion = "Please select a religion.";
    if (!disability) errors.disability = "Please select an option.";
    if (!maritalStatus)
      errors.maritalStatus = "Please select a marital status.";
    if (!ethnicity) errors.ethnicity = "Please select an ethnicity.";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaved(false);

    if (!validate()) return;

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      setSaveError("Your session has expired. Please sign in again.");
      return;
    }
    if (!apiUrl) {
      setSaveError("API URL is not configured. Contact support.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          id_number: idNumber,
          date_of_birth: dateOfBirth,
          phone,
          street_address: streetAddress,
          suburb,
          city,
          province,
          postal_code: postalCode,
          nationality,
          gender,
          home_language: homeLanguage,
          religion,
          disability,
          marital_status: maritalStatus,
          ethnicity,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message =
          typeof body.detail === "string"
            ? body.detail
            : "Failed to save. Please try again.";
        setSaveError(message);
        return;
      }

      setSaved(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setSaveError(
        "Unable to connect. Check your internet connection and try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (loadError) {
    return <Alert tone="destructive">{loadError}</Alert>;
  }

  return (
    <form onSubmit={handleSave} noValidate className="space-y-10">
      {saved && (
        <Alert tone="success">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 size={14} aria-hidden />
            Profile saved successfully.
          </span>
        </Alert>
      )}

      {/* ── Personal details ──────────────────────────────────────────────── */}
      <div className="space-y-4">
        <SectionLabel>Personal details</SectionLabel>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="firstName"
            label="First name"
            type="text"
            autoComplete="given-name"
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
            value={idNumber}
            onChange={(e) => {
              setIdNumber(e.target.value.replace(/\D/g, ""));
              clearError("idNumber");
            }}
            error={fieldErrors.idNumber}
          />
          <p className="text-xs text-muted-foreground">
            13-digit number on the front of your green ID book or smart card.
          </p>
        </div>
      </div>

      {/* ── Contact details ───────────────────────────────────────────────── */}
      <div className="space-y-4">
        <SectionLabel>Contact details</SectionLabel>
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
            value={suburb}
            onChange={(e) => setSuburb(e.target.value)}
          />
          <Input
            id="city"
            label="City / Town"
            type="text"
            autoComplete="address-level2"
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
      </div>

      {/* ── Identity ──────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <SectionLabel>Identity</SectionLabel>
        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>
      </div>

      {/* ── Background ────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <SectionLabel>Background</SectionLabel>
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
      </div>

      {saveError && <Alert tone="destructive">{saveError}</Alert>}

      <div className="flex gap-3">
        <Button type="submit" fullWidth loading={saving}>
          Save changes
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
