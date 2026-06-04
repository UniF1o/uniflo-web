// ContactsManager — manages the four per-student contacts (one per type).
//
// Each contact type renders as its own card with a save + remove affordance.
// Contacts are upserted independently, so a slow save on one doesn't block the
// others. Two portal-specific rules are surfaced here:
//   - Wits: next_of_kin email & mobile must differ from the applicant's. We
//     fetch the applicant's email (auth session) + phone (profile) to validate.
//   - UJ: fee_payer needs a full postal address (hinted, not hard-blocked —
//     the backend doesn't reject a partial one).
"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ApiError, apiClient } from "@/lib/api/client";
import {
  CONTACT_TYPES,
  deleteContact,
  listContacts,
  upsertContact,
  type ContactType,
  type ContactWrite,
} from "@/lib/api/contacts";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TITLE_OPTIONS,
  SA_PROVINCE_OPTIONS,
} from "@/lib/constants/profile-enums";
import type { components } from "@/lib/api/schema";

type ProfileResponse = components["schemas"]["StudentProfileResponse"];

// Every editable field, as strings. Mirrors ContactWrite minus contact_type.
type ContactFormValues = {
  title: string;
  first_name: string;
  last_name: string;
  relationship: string;
  id_number: string;
  email: string;
  phone: string;
  street_address: string;
  suburb: string;
  city: string;
  province: string;
  postal_code: string;
};

type CardStatus = "idle" | "saving" | "saved" | "deleting";

function emptyForm(): ContactFormValues {
  return {
    title: "",
    first_name: "",
    last_name: "",
    relationship: "",
    id_number: "",
    email: "",
    phone: "",
    street_address: "",
    suburb: "",
    city: "",
    province: "",
    postal_code: "",
  };
}

// Build a per-type record seeded with the same factory value.
function seedRecord<T>(make: () => T): Record<ContactType, T> {
  return CONTACT_TYPES.reduce(
    (acc, c) => {
      acc[c.value] = make();
      return acc;
    },
    {} as Record<ContactType, T>,
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Normalise a phone for comparison — strip spaces and punctuation so
// "+27 82 123 4567" and "0821234567" don't slip past the "must differ" rule
// purely on formatting. (Best-effort, not a strict E.164 parse.)
function normalisePhone(value: string): string {
  return value.replace(/[\s\-()]/g, "");
}

export function ContactsManager() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [forms, setForms] = useState<Record<ContactType, ContactFormValues>>(
    () => seedRecord(emptyForm),
  );
  // Which types already exist server-side (controls the Remove button).
  const [present, setPresent] = useState<Record<ContactType, boolean>>(() =>
    seedRecord(() => false),
  );
  const [status, setStatus] = useState<Record<ContactType, CardStatus>>(() =>
    seedRecord<CardStatus>(() => "idle"),
  );
  const [errors, setErrors] = useState<
    Record<ContactType, Record<string, string>>
  >(() => seedRecord<Record<string, string>>(() => ({})));
  const [apiErrors, setApiErrors] = useState<
    Record<ContactType, string | null>
  >(() => seedRecord<string | null>(() => null));

  // Applicant identity for the Wits next_of_kin "must differ" rule.
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setApplicantEmail(session?.user?.email ?? "");

      if (!session?.access_token) {
        setLoadError("Your session has expired. Please sign in again.");
        setLoading(false);
        return;
      }

      // Profile phone is best-effort — a missing profile shouldn't block
      // contacts. Run both fetches together.
      const [contactsResult, profileResult] = await Promise.allSettled([
        listContacts(),
        apiClient.get<ProfileResponse>("/profile"),
      ]);

      if (profileResult.status === "fulfilled") {
        setApplicantPhone(profileResult.value.phone ?? "");
      }

      if (contactsResult.status === "rejected") {
        setLoadError(
          "Couldn't load your contacts. Please refresh and try again.",
        );
        setLoading(false);
        return;
      }

      setForms((prev) => {
        const next = { ...prev };
        for (const contact of contactsResult.value) {
          next[contact.contact_type] = {
            title: contact.title ?? "",
            first_name: contact.first_name ?? "",
            last_name: contact.last_name ?? "",
            relationship: contact.relationship ?? "",
            id_number: contact.id_number ?? "",
            email: contact.email ?? "",
            phone: contact.phone ?? "",
            street_address: contact.street_address ?? "",
            suburb: contact.suburb ?? "",
            city: contact.city ?? "",
            province: contact.province ?? "",
            postal_code: contact.postal_code ?? "",
          };
        }
        return next;
      });
      setPresent((prev) => {
        const next = { ...prev };
        for (const contact of contactsResult.value) {
          next[contact.contact_type] = true;
        }
        return next;
      });
      setLoading(false);
    }

    load();
  }, []);

  function setField(
    type: ContactType,
    field: keyof ContactFormValues,
    value: string,
  ) {
    setForms((prev) => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }));
    // Clear the field's inline error and any "saved" badge once editing resumes.
    setErrors((prev) => {
      if (!prev[type][field]) return prev;
      const nextForType = { ...prev[type] };
      delete nextForType[field];
      return { ...prev, [type]: nextForType };
    });
    setStatus((prev) =>
      prev[type] === "saved" ? { ...prev, [type]: "idle" } : prev,
    );
  }

  function validate(type: ContactType): boolean {
    const f = forms[type];
    const next: Record<string, string> = {};

    // Require at least a name to save a contact at all.
    if (!f.first_name.trim() && !f.last_name.trim()) {
      next.first_name = "Enter at least a first and last name.";
    }
    if (f.email && !EMAIL_RE.test(f.email)) {
      next.email = "Enter a valid email address.";
    }
    if (f.postal_code && !/^\d{4}$/.test(f.postal_code)) {
      next.postal_code = "SA postal code must be 4 digits.";
    }

    // Wits rule — next_of_kin email & mobile must differ from the applicant.
    if (type === "next_of_kin") {
      if (
        f.email &&
        applicantEmail &&
        f.email.trim().toLowerCase() === applicantEmail.trim().toLowerCase()
      ) {
        next.email = "Next of kin email must differ from your own.";
      }
      if (
        f.phone &&
        applicantPhone &&
        normalisePhone(f.phone) === normalisePhone(applicantPhone)
      ) {
        next.phone = "Next of kin mobile must differ from your own.";
      }
    }

    setErrors((prev) => ({ ...prev, [type]: next }));
    return Object.keys(next).length === 0;
  }

  async function handleSave(type: ContactType) {
    setApiErrors((prev) => ({ ...prev, [type]: null }));
    if (!validate(type)) return;

    const f = forms[type];
    // Trim everything; send empty strings as null so the backend stores blanks
    // consistently rather than "".
    const clean = (v: string) => {
      const t = v.trim();
      return t === "" ? null : t;
    };
    const body: ContactWrite = {
      contact_type: type,
      title: clean(f.title),
      first_name: clean(f.first_name),
      last_name: clean(f.last_name),
      relationship: clean(f.relationship),
      id_number: clean(f.id_number),
      email: clean(f.email),
      phone: clean(f.phone),
      street_address: clean(f.street_address),
      suburb: clean(f.suburb),
      city: clean(f.city),
      province: clean(f.province),
      postal_code: clean(f.postal_code),
    };

    setStatus((prev) => ({ ...prev, [type]: "saving" }));
    try {
      await upsertContact(body);
      setPresent((prev) => ({ ...prev, [type]: true }));
      setStatus((prev) => ({ ...prev, [type]: "saved" }));
    } catch (err) {
      setStatus((prev) => ({ ...prev, [type]: "idle" }));
      const message =
        err instanceof ApiError && isDetailString(err.body)
          ? (err.body as { detail: string }).detail
          : "Couldn't save this contact. Please try again.";
      setApiErrors((prev) => ({ ...prev, [type]: message }));
    }
  }

  async function handleDelete(type: ContactType) {
    setApiErrors((prev) => ({ ...prev, [type]: null }));
    setStatus((prev) => ({ ...prev, [type]: "deleting" }));
    try {
      await deleteContact(type);
      setForms((prev) => ({ ...prev, [type]: emptyForm() }));
      setPresent((prev) => ({ ...prev, [type]: false }));
      setErrors((prev) => ({ ...prev, [type]: {} }));
      setStatus((prev) => ({ ...prev, [type]: "idle" }));
    } catch {
      setStatus((prev) => ({ ...prev, [type]: "idle" }));
      setApiErrors((prev) => ({
        ...prev,
        [type]: "Couldn't remove this contact. Please try again.",
      }));
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {CONTACT_TYPES.map((c) => (
          <Skeleton key={c.value} className="h-64 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (loadError) {
    return <Alert tone="destructive">{loadError}</Alert>;
  }

  return (
    <div className="space-y-6">
      {CONTACT_TYPES.map((config) => {
        const f = forms[config.value];
        const e = errors[config.value];
        const cardStatus = status[config.value];
        const apiError = apiErrors[config.value];
        const isSaving = cardStatus === "saving";
        const isDeleting = cardStatus === "deleting";
        const busy = isSaving || isDeleting;

        return (
          <section
            key={config.value}
            className="space-y-4 rounded-lg border border-border p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <h2 className="text-sm font-semibold text-foreground">
                  {config.label}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {config.description}
                </p>
              </div>
              {cardStatus === "saved" && (
                <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-success">
                  <CheckCircle2 size={14} aria-hidden />
                  Saved
                </span>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                id={`${config.value}-title`}
                label="Title"
                placeholder="Select title"
                options={TITLE_OPTIONS}
                value={f.title}
                onChange={(ev) =>
                  setField(config.value, "title", ev.target.value)
                }
              />
              <Input
                id={`${config.value}-relationship`}
                label="Relationship"
                type="text"
                placeholder="e.g. Mother"
                value={f.relationship}
                onChange={(ev) =>
                  setField(config.value, "relationship", ev.target.value)
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id={`${config.value}-first-name`}
                label="First name"
                type="text"
                value={f.first_name}
                onChange={(ev) =>
                  setField(config.value, "first_name", ev.target.value)
                }
                error={e.first_name}
              />
              <Input
                id={`${config.value}-last-name`}
                label="Last name"
                type="text"
                value={f.last_name}
                onChange={(ev) =>
                  setField(config.value, "last_name", ev.target.value)
                }
              />
            </div>

            <Input
              id={`${config.value}-id-number`}
              label="ID number"
              type="text"
              inputMode="numeric"
              value={f.id_number}
              onChange={(ev) =>
                setField(config.value, "id_number", ev.target.value)
              }
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id={`${config.value}-email`}
                label="Email"
                type="email"
                value={f.email}
                onChange={(ev) =>
                  setField(config.value, "email", ev.target.value)
                }
                error={e.email}
              />
              <Input
                id={`${config.value}-phone`}
                label="Phone"
                type="tel"
                value={f.phone}
                onChange={(ev) =>
                  setField(config.value, "phone", ev.target.value)
                }
                error={e.phone}
              />
            </div>

            <Input
              id={`${config.value}-street`}
              label="Street address"
              type="text"
              value={f.street_address}
              onChange={(ev) =>
                setField(config.value, "street_address", ev.target.value)
              }
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id={`${config.value}-suburb`}
                label="Suburb"
                type="text"
                value={f.suburb}
                onChange={(ev) =>
                  setField(config.value, "suburb", ev.target.value)
                }
              />
              <Input
                id={`${config.value}-city`}
                label="City / Town"
                type="text"
                value={f.city}
                onChange={(ev) =>
                  setField(config.value, "city", ev.target.value)
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                id={`${config.value}-province`}
                label="Province"
                placeholder="Select province"
                options={SA_PROVINCE_OPTIONS}
                value={f.province}
                onChange={(ev) =>
                  setField(config.value, "province", ev.target.value)
                }
              />
              <Input
                id={`${config.value}-postal`}
                label="Postal code"
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={f.postal_code}
                onChange={(ev) =>
                  setField(
                    config.value,
                    "postal_code",
                    ev.target.value.replace(/\D/g, ""),
                  )
                }
                error={e.postal_code}
              />
            </div>

            {apiError && <Alert tone="destructive">{apiError}</Alert>}

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => handleSave(config.value)}
                loading={isSaving}
                disabled={busy}
              >
                Save contact
              </Button>
              {present[config.value] && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleDelete(config.value)}
                  loading={isDeleting}
                  disabled={busy}
                >
                  <Trash2 size={15} aria-hidden />
                  Remove
                </Button>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// FastAPI surfaces domain errors as { detail: "..." }. Narrow before reading.
function isDetailString(body: unknown): body is { detail: string } {
  return (
    typeof body === "object" &&
    body !== null &&
    "detail" in body &&
    typeof (body as { detail: unknown }).detail === "string"
  );
}
