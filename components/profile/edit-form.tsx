"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { validateSAID } from "@/lib/utils/sa-id";
import { DateInput } from "@/components/ui/date-input";
import {
  CURRENT_ACTIVITY_OPTIONS,
  DISABILITY_OPTIONS,
  ETHNICITY_OPTIONS,
  GENDER_OPTIONS,
  HOME_LANGUAGE_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  NATIONALITY_OPTIONS,
  RELIGION_OPTIONS,
  SA_PROVINCE_OPTIONS,
  TITLE_OPTIONS,
} from "@/lib/constants/profile-enums";
import type { components } from "@/lib/api/schema";

type ProfileResponse = components["schemas"]["StudentProfileResponse"];

// One editable redress key/value pair. redress_factors is a free-form JSON
// object (UCT apartheid-era redress questions) — we model it as a list of rows
// in the UI and fold it back into an object on save.
type RedressRow = { id: string; key: string; value: string };

function newRowId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now() + Math.random());
}

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 font-display text-xl tracking-tight text-foreground">
      <span aria-hidden className="h-px w-5 shrink-0 bg-primary/60" />
      {children}
    </h2>
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
  const [disabilityDetail, setDisabilityDetail] = useState("");
  const [disabilityAssistance, setDisabilityAssistance] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [ethnicity, setEthnicity] = useState("");

  // Names & title (all optional — portals need them, completeness doesn't)
  const [title, setTitle] = useState("");
  const [middleNames, setMiddleNames] = useState("");
  const [maidenName, setMaidenName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [isSaCitizen, setIsSaCitizen] = useState(false);

  // Mailing address (used when it differs from the residential address)
  const [mailingSameAsResidential, setMailingSameAsResidential] =
    useState(true);
  const [mailingStreetAddress, setMailingStreetAddress] = useState("");
  const [mailingSuburb, setMailingSuburb] = useState("");
  const [mailingCity, setMailingCity] = useState("");
  const [mailingProvince, setMailingProvince] = useState("");
  const [mailingPostalCode, setMailingPostalCode] = useState("");

  // Studies & activity
  const [currentActivity, setCurrentActivity] = useState("");
  const [examNumber, setExamNumber] = useState("");
  const [sport, setSport] = useState("");

  // Funding & residence
  const [wantsResidence, setWantsResidence] = useState(false);
  const [preferredResidence, setPreferredResidence] = useState("");
  const [applyingNsfas, setApplyingNsfas] = useState(false);
  const [applyingInstitutionalFunding, setApplyingInstitutionalFunding] =
    useState(false);

  // NBT (UCT) — the student writes the test themselves; we capture the reference
  const [nbtReference, setNbtReference] = useState("");
  const [nbtYear, setNbtYear] = useState("");
  const [nbtDate, setNbtDate] = useState("");

  // Redress (UCT only) — free-form key/value rows
  const [redressRows, setRedressRows] = useState<RedressRow[]>([]);

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
        setDisabilityDetail(data.disability_detail ?? "");
        setDisabilityAssistance(data.disability_assistance ?? "");
        setMaritalStatus(data.marital_status ?? "");
        setEthnicity(data.ethnicity ?? "");

        // Optional Phase-3 fields
        setTitle(data.title ?? "");
        setMiddleNames(data.middle_names ?? "");
        setMaidenName(data.maiden_name ?? "");
        setPreferredName(data.preferred_name ?? "");
        setIsSaCitizen(data.is_sa_citizen ?? false);
        // Default to "same as residential" when the backend hasn't recorded a
        // preference yet (null) — most students share one address.
        setMailingSameAsResidential(data.mailing_same_as_residential ?? true);
        setMailingStreetAddress(data.mailing_street_address ?? "");
        setMailingSuburb(data.mailing_suburb ?? "");
        setMailingCity(data.mailing_city ?? "");
        setMailingProvince(data.mailing_province ?? "");
        setMailingPostalCode(data.mailing_postal_code ?? "");
        setCurrentActivity(data.current_activity ?? "");
        setExamNumber(data.exam_number ?? "");
        setSport(data.sport ?? "");
        setWantsResidence(data.wants_residence ?? false);
        setPreferredResidence(data.preferred_residence ?? "");
        setApplyingNsfas(data.applying_nsfas ?? false);
        setApplyingInstitutionalFunding(
          data.applying_institutional_funding ?? false,
        );
        setNbtReference(data.nbt_reference ?? "");
        setNbtYear(data.nbt_year != null ? String(data.nbt_year) : "");
        setNbtDate(data.nbt_date ?? "");
        setRedressRows(
          Object.entries(data.redress_factors ?? {}).map(([key, value]) => ({
            id: newRowId(),
            key,
            value: value == null ? "" : String(value),
          })),
        );
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

    // Optional fields — only validate format when the student filled them in.
    if (!mailingSameAsResidential && mailingPostalCode) {
      if (!/^\d{4}$/.test(mailingPostalCode)) {
        errors.mailingPostalCode = "SA postal code must be 4 digits.";
      }
    }
    if (nbtYear) {
      const y = parseInt(nbtYear, 10);
      if (isNaN(y) || y < 2000 || y > 2100) {
        errors.nbtYear = "Enter a year between 2000 and 2100.";
      }
    }

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

    // Fold the redress rows back into an object, dropping blank keys. Null when
    // empty so the backend stores nothing rather than an empty object.
    const redressFactors = redressRows.reduce<Record<string, string>>(
      (acc, row) => {
        const k = row.key.trim();
        if (k) acc[k] = row.value.trim();
        return acc;
      },
      {},
    );

    // Blank optional fields go up as null — the backend's field validators
    // (e.g. the 4-digit mailing postal code) reject empty strings.
    const clean = (value: string) => value.trim() || null;

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
          // ── Optional Phase-3 fields ──
          title: title || null,
          middle_names: clean(middleNames),
          maiden_name: clean(maidenName),
          preferred_name: clean(preferredName),
          is_sa_citizen: isSaCitizen,
          mailing_same_as_residential: mailingSameAsResidential,
          // When the mailing address matches the residential one, don't persist
          // stale mailing values — send null so the backend mirrors residential.
          mailing_street_address: mailingSameAsResidential
            ? null
            : clean(mailingStreetAddress),
          mailing_suburb: mailingSameAsResidential
            ? null
            : clean(mailingSuburb),
          mailing_city: mailingSameAsResidential ? null : clean(mailingCity),
          mailing_province: mailingSameAsResidential
            ? null
            : clean(mailingProvince),
          mailing_postal_code: mailingSameAsResidential
            ? null
            : clean(mailingPostalCode),
          disability_detail: clean(disabilityDetail),
          disability_assistance: clean(disabilityAssistance),
          current_activity: currentActivity || null,
          exam_number: clean(examNumber),
          sport: clean(sport),
          wants_residence: wantsResidence,
          preferred_residence: clean(preferredResidence),
          applying_nsfas: applyingNsfas,
          applying_institutional_funding: applyingInstitutionalFunding,
          nbt_reference: clean(nbtReference),
          nbt_year: nbtYear ? parseInt(nbtYear, 10) : null,
          nbt_date: nbtDate || null,
          redress_factors:
            Object.keys(redressFactors).length > 0 ? redressFactors : null,
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
      router.refresh();
    } catch {
      setSaveError(
        "Unable to connect. Check your internet connection and try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  function addRedressRow() {
    setRedressRows((prev) => [...prev, { id: newRowId(), key: "", value: "" }]);
  }

  function updateRedressRow(
    id: string,
    patch: Partial<Omit<RedressRow, "id">>,
  ) {
    setRedressRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  function removeRedressRow(id: string) {
    setRedressRows((prev) => prev.filter((row) => row.id !== id));
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
    <form onSubmit={handleSave} noValidate className="space-y-6">
      {saved && (
        <Alert tone="success">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 size={14} aria-hidden />
            Profile saved successfully.
          </span>
        </Alert>
      )}

      {/* ── Personal details ──────────────────────────────────────────────── */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-paper)] sm:p-6">
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

      {/* ── Additional names ──────────────────────────────────────────────── */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-paper)] sm:p-6">
        <SectionLabel>Additional names</SectionLabel>
        <p className="-mt-2 text-xs text-muted-foreground">
          Optional, but some university portals ask for these.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            id="title"
            label="Title"
            placeholder="Select title"
            options={TITLE_OPTIONS}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            id="middleNames"
            label="Middle names"
            type="text"
            autoComplete="additional-name"
            value={middleNames}
            onChange={(e) => setMiddleNames(e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="maidenName"
            label="Maiden name"
            type="text"
            value={maidenName}
            onChange={(e) => setMaidenName(e.target.value)}
          />
          <Input
            id="preferredName"
            label="Preferred name"
            type="text"
            autoComplete="nickname"
            value={preferredName}
            onChange={(e) => setPreferredName(e.target.value)}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Your preferred name is printed on UCT&rsquo;s student card.
        </p>
      </div>

      {/* ── Contact details ───────────────────────────────────────────────── */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-paper)] sm:p-6">
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
        <Checkbox
          id="isSaCitizen"
          label="I am a South African citizen"
          checked={isSaCitizen}
          onChange={(e) => setIsSaCitizen(e.target.checked)}
        />
      </div>

      {/* ── Mailing address ───────────────────────────────────────────────── */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-paper)] sm:p-6">
        <SectionLabel>Mailing address</SectionLabel>
        <Checkbox
          id="mailingSameAsResidential"
          label="My mailing address is the same as my residential address"
          checked={mailingSameAsResidential}
          onChange={(e) => setMailingSameAsResidential(e.target.checked)}
        />
        {/* Only collect a separate mailing address when it differs. */}
        {!mailingSameAsResidential && (
          <div className="space-y-4">
            <Input
              id="mailingStreetAddress"
              label="Mailing street address"
              type="text"
              value={mailingStreetAddress}
              onChange={(e) => setMailingStreetAddress(e.target.value)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="mailingSuburb"
                label="Suburb"
                type="text"
                value={mailingSuburb}
                onChange={(e) => setMailingSuburb(e.target.value)}
              />
              <Input
                id="mailingCity"
                label="City / Town"
                type="text"
                value={mailingCity}
                onChange={(e) => setMailingCity(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                id="mailingProvince"
                label="Province"
                placeholder="Select province"
                options={SA_PROVINCE_OPTIONS}
                value={mailingProvince}
                onChange={(e) => setMailingProvince(e.target.value)}
              />
              <Input
                id="mailingPostalCode"
                label="Postal code"
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={mailingPostalCode}
                onChange={(e) => {
                  setMailingPostalCode(e.target.value.replace(/\D/g, ""));
                  clearError("mailingPostalCode");
                }}
                error={fieldErrors.mailingPostalCode}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Identity ──────────────────────────────────────────────────────── */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-paper)] sm:p-6">
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
      <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-paper)] sm:p-6">
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
        {/* Detail + assistance only matter when a disability is declared. */}
        {disability && disability !== "None" && (
          <div className="space-y-4">
            <Textarea
              id="disabilityDetail"
              label="Disability detail"
              placeholder="Briefly describe your disability (optional)."
              value={disabilityDetail}
              onChange={(e) => setDisabilityDetail(e.target.value)}
            />
            <Textarea
              id="disabilityAssistance"
              label="Assistance required"
              placeholder="What support do you need from the university? (optional)"
              value={disabilityAssistance}
              onChange={(e) => setDisabilityAssistance(e.target.value)}
            />
          </div>
        )}
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

      {/* ── Studies & activity ────────────────────────────────────────────── */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-paper)] sm:p-6">
        <SectionLabel>Studies &amp; activity</SectionLabel>
        <Select
          id="currentActivity"
          label="What are you currently doing?"
          placeholder="Select option"
          options={CURRENT_ACTIVITY_OPTIONS}
          value={currentActivity}
          onChange={(e) => setCurrentActivity(e.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="examNumber"
            label="Exam number"
            type="text"
            value={examNumber}
            onChange={(e) => setExamNumber(e.target.value)}
          />
          <Input
            id="sport"
            label="Sport"
            type="text"
            placeholder="e.g. Hockey"
            value={sport}
            onChange={(e) => setSport(e.target.value)}
          />
        </div>
      </div>

      {/* ── Funding & residence ───────────────────────────────────────────── */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-paper)] sm:p-6">
        <SectionLabel>Funding &amp; residence</SectionLabel>
        <Checkbox
          id="wantsResidence"
          label="I want to apply for university residence"
          checked={wantsResidence}
          onChange={(e) => setWantsResidence(e.target.checked)}
        />
        {wantsResidence && (
          <Input
            id="preferredResidence"
            label="Preferred residence"
            type="text"
            placeholder="Name of the residence you'd prefer (optional)"
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
          onChange={(e) => setApplyingInstitutionalFunding(e.target.checked)}
        />
      </div>

      {/* ── NBT ───────────────────────────────────────────────────────────── */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-paper)] sm:p-6">
        <SectionLabel>National Benchmark Test (NBT)</SectionLabel>
        <p className="-mt-2 text-xs text-muted-foreground">
          You write the NBT yourself — we just record your reference so UCT can
          match it. Leave blank if you haven&rsquo;t written it.
        </p>
        <Input
          id="nbtReference"
          label="NBT reference number"
          type="text"
          value={nbtReference}
          onChange={(e) => setNbtReference(e.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="nbtYear"
            label="NBT year"
            type="number"
            inputMode="numeric"
            min={2000}
            max={2100}
            placeholder="2025"
            value={nbtYear}
            onChange={(e) => {
              setNbtYear(e.target.value);
              clearError("nbtYear");
            }}
            error={fieldErrors.nbtYear}
          />
          <DateInput
            id="nbtDate"
            label="NBT date"
            value={nbtDate}
            onChange={(val) => setNbtDate(val)}
          />
        </div>
      </div>

      {/* ── Redress (UCT) ─────────────────────────────────────────────────── */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-paper)] sm:p-6">
        <SectionLabel>Redress (UCT only)</SectionLabel>
        <p className="-mt-2 text-xs text-muted-foreground">
          UCT&rsquo;s application asks apartheid-era redress questions. Add any
          that apply as a question/answer pair. Optional.
        </p>
        {redressRows.map((row) => (
          <div key={row.id} className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                id={`redress-key-${row.id}`}
                label="Question"
                type="text"
                placeholder="e.g. Was a parent a domestic worker?"
                value={row.key}
                onChange={(e) =>
                  updateRedressRow(row.id, { key: e.target.value })
                }
              />
            </div>
            <div className="flex-1">
              <Input
                id={`redress-value-${row.id}`}
                label="Answer"
                type="text"
                placeholder="e.g. Yes"
                value={row.value}
                onChange={(e) =>
                  updateRedressRow(row.id, { value: e.target.value })
                }
              />
            </div>
            <button
              type="button"
              onClick={() => removeRedressRow(row.id)}
              aria-label="Remove this redress entry"
              className="mb-2.5 rounded p-1 text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Trash2 size={15} aria-hidden />
            </button>
          </div>
        ))}
        <Button type="button" variant="ghost" onClick={addRedressRow}>
          <Plus size={16} aria-hidden />
          Add redress entry
        </Button>
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
