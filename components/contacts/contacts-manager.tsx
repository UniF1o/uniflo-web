// ContactsManager — captures the student's contact people.
//
// After the cross-portal review, this is one "Parent / Guardian" card (saved
// as contact_type "guardian") plus an opt-in "Someone different pays the
// fees" toggle that reveals a fee_payer card. The backend resolves every
// portal role (next of kin, emergency, account holder) from these via
// fallback chains, so no other contact types are captured.
//
// Portal rules enforced client-side:
//   - Wits hard-rejects a guardian whose email or mobile matches the
//     applicant's. We fetch the applicant's email (auth session) + phone
//     (profile) to validate.
//   - UCT requires the guardian's SA ID number once any guardian detail is
//     given — so it's required to save the card at all.
//   - UJ wants the fee payer's full postal address (hinted, not hard-blocked —
//     the backend accepts a partial one).
"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ApiError, apiClient } from "@/lib/api/client";
import {
  GUARDIAN_CONTACT,
  FEE_PAYER_CONTACT,
  deleteContact,
  listContacts,
  upsertContact,
  type ContactWrite,
  type ManagedContactConfig,
} from "@/lib/api/contacts";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TITLE_OPTIONS,
  SA_PROVINCE_OPTIONS,
} from "@/lib/constants/profile-enums";
import type { components } from "@/lib/api/schema";

type ProfileResponse = components["schemas"]["StudentProfileResponse"];

// The two contact types this screen manages (the backend enum has more, but
// the UI deliberately captures only these — see lib/api/contacts.ts).
type ManagedType = "guardian" | "fee_payer";
const MANAGED_TYPES: ManagedType[] = ["guardian", "fee_payer"];

const RELATIONSHIP_OPTIONS = [
  "Mother",
  "Father",
  "Guardian",
  "Grandmother",
  "Grandfather",
  "Aunt",
  "Uncle",
  "Sister",
  "Brother",
  "Other",
].map((r) => ({ value: r, label: r }));

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
function seedRecord<T>(make: () => T): Record<ManagedType, T> {
  return MANAGED_TYPES.reduce(
    (acc, t) => {
      acc[t] = make();
      return acc;
    },
    {} as Record<ManagedType, T>,
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Normalise a phone for comparison — strip spaces and punctuation so
// "+27 82 123 4567" and "0821234567" don't slip past the "must differ" rule
// purely on formatting. (Best-effort, not a strict E.164 parse.)
function normalisePhone(value: string): string {
  return value.replace(/[\s\-()]/g, "");
}

// ─── ContactCard ─────────────────────────────────────────────────────────────
//
// One contact's full field set with its own save/remove. Pure presentation —
// all state lives in the manager so the two cards stay independent.

interface ContactCardProps {
  config: ManagedContactConfig;
  form: ContactFormValues;
  errors: Record<string, string>;
  status: CardStatus;
  apiError: string | null;
  present: boolean;
  // Copy under the "Address" sub-heading — differs per card (guardian:
  // optional/fallback; fee payer: UJ wants it).
  addressHint: string;
  onFieldChange: (field: keyof ContactFormValues, value: string) => void;
  onSave: () => void;
  onRemove: () => void;
}

function ContactCard({
  config,
  form: f,
  errors: e,
  status,
  apiError,
  present,
  addressHint,
  onFieldChange,
  onSave,
  onRemove,
}: ContactCardProps) {
  const isSaving = status === "saving";
  const isDeleting = status === "deleting";
  const busy = isSaving || isDeleting;
  const id = config.value;

  return (
    <section className="space-y-4 rounded-lg border border-border p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold text-foreground">
            {config.label}
          </h2>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>
        {status === "saved" && (
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-success">
            <CheckCircle2 size={14} aria-hidden />
            Saved
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          id={`${id}-title`}
          label="Title"
          placeholder="Select title"
          options={TITLE_OPTIONS}
          value={f.title}
          onChange={(ev) => onFieldChange("title", ev.target.value)}
        />
        <Select
          id={`${id}-relationship`}
          label="Relationship"
          placeholder="Select relationship"
          options={RELATIONSHIP_OPTIONS}
          value={f.relationship}
          onChange={(ev) => onFieldChange("relationship", ev.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id={`${id}-first-name`}
          label="First name"
          type="text"
          value={f.first_name}
          onChange={(ev) => onFieldChange("first_name", ev.target.value)}
          error={e.first_name}
        />
        <Input
          id={`${id}-last-name`}
          label="Last name"
          type="text"
          value={f.last_name}
          onChange={(ev) => onFieldChange("last_name", ev.target.value)}
        />
      </div>

      <Input
        id={`${id}-id-number`}
        label="SA ID number"
        type="text"
        inputMode="numeric"
        maxLength={13}
        value={f.id_number}
        onChange={(ev) =>
          onFieldChange("id_number", ev.target.value.replace(/\D/g, ""))
        }
        error={e.id_number}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id={`${id}-email`}
          label="Email"
          type="email"
          value={f.email}
          onChange={(ev) => onFieldChange("email", ev.target.value)}
          error={e.email}
        />
        <Input
          id={`${id}-phone`}
          label="Mobile"
          type="tel"
          value={f.phone}
          onChange={(ev) => onFieldChange("phone", ev.target.value)}
          error={e.phone}
        />
      </div>

      <div className="space-y-4">
        <div className="space-y-0.5">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Address
          </h3>
          <p className="text-xs text-muted-foreground">{addressHint}</p>
        </div>

        <Input
          id={`${id}-street`}
          label="Street address"
          type="text"
          value={f.street_address}
          onChange={(ev) => onFieldChange("street_address", ev.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id={`${id}-suburb`}
            label="Suburb"
            type="text"
            value={f.suburb}
            onChange={(ev) => onFieldChange("suburb", ev.target.value)}
          />
          <Input
            id={`${id}-city`}
            label="City / Town"
            type="text"
            value={f.city}
            onChange={(ev) => onFieldChange("city", ev.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            id={`${id}-province`}
            label="Province"
            placeholder="Select province"
            options={SA_PROVINCE_OPTIONS}
            value={f.province}
            onChange={(ev) => onFieldChange("province", ev.target.value)}
          />
          <Input
            id={`${id}-postal`}
            label="Postal code"
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={f.postal_code}
            onChange={(ev) =>
              onFieldChange("postal_code", ev.target.value.replace(/\D/g, ""))
            }
            error={e.postal_code}
          />
        </div>
      </div>

      {apiError && <Alert tone="destructive">{apiError}</Alert>}

      <div className="flex gap-3">
        <Button
          type="button"
          onClick={onSave}
          loading={isSaving}
          disabled={busy}
        >
          Save contact
        </Button>
        {present && (
          <Button
            type="button"
            variant="ghost"
            onClick={onRemove}
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
}

// ─── ContactsManager ─────────────────────────────────────────────────────────

export function ContactsManager() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [forms, setForms] = useState<Record<ManagedType, ContactFormValues>>(
    () => seedRecord(emptyForm),
  );
  // Which types already exist server-side (controls the Remove button).
  const [present, setPresent] = useState<Record<ManagedType, boolean>>(() =>
    seedRecord(() => false),
  );
  const [status, setStatus] = useState<Record<ManagedType, CardStatus>>(() =>
    seedRecord<CardStatus>(() => "idle"),
  );
  const [errors, setErrors] = useState<
    Record<ManagedType, Record<string, string>>
  >(() => seedRecord<Record<string, string>>(() => ({})));
  const [apiErrors, setApiErrors] = useState<
    Record<ManagedType, string | null>
  >(() => seedRecord<string | null>(() => null));

  // The "Someone different pays the fees" toggle. Starts on when a fee_payer
  // already exists server-side.
  const [showFeePayer, setShowFeePayer] = useState(false);

  // Applicant identity for the Wits "guardian must differ" rules.
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

      // Older accounts may still have next_of_kin / emergency rows — the
      // backend reuses the guardian for those roles now, so they're ignored.
      setForms((prev) => {
        const next = { ...prev };
        for (const contact of contactsResult.value) {
          if (
            contact.contact_type !== "guardian" &&
            contact.contact_type !== "fee_payer"
          ) {
            continue;
          }
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
      const hasFeePayer = contactsResult.value.some(
        (c) => c.contact_type === "fee_payer",
      );
      setPresent({
        guardian: contactsResult.value.some(
          (c) => c.contact_type === "guardian",
        ),
        fee_payer: hasFeePayer,
      });
      setShowFeePayer(hasFeePayer);
      setLoading(false);
    }

    load();
  }, []);

  function setField(
    type: ManagedType,
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

  function validate(type: ManagedType): boolean {
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
    if (f.id_number && !/^\d{13}$/.test(f.id_number)) {
      next.id_number = "SA ID number must be 13 digits.";
    }

    if (type === "guardian") {
      // UCT requires the guardian's ID number once any guardian detail is
      // given — saving the card at all counts, so it's required here.
      if (!f.id_number.trim()) {
        next.id_number = "Required — UCT needs the guardian's SA ID number.";
      }
      // Wits hard-rejects a guardian whose email or mobile matches the
      // applicant's own.
      if (
        f.email &&
        applicantEmail &&
        f.email.trim().toLowerCase() === applicantEmail.trim().toLowerCase()
      ) {
        next.email = "Must differ from your own email (Wits rejects a match).";
      }
      if (
        f.phone &&
        applicantPhone &&
        normalisePhone(f.phone) === normalisePhone(applicantPhone)
      ) {
        next.phone = "Must differ from your own mobile (Wits rejects a match).";
      }
    }

    setErrors((prev) => ({ ...prev, [type]: next }));
    return Object.keys(next).length === 0;
  }

  async function handleSave(type: ManagedType) {
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

  // Returns whether the delete landed so callers (the fee-payer toggle) can
  // revert their optimistic UI on failure.
  async function handleDelete(type: ManagedType): Promise<boolean> {
    setApiErrors((prev) => ({ ...prev, [type]: null }));
    setStatus((prev) => ({ ...prev, [type]: "deleting" }));
    try {
      await deleteContact(type);
      setForms((prev) => ({ ...prev, [type]: emptyForm() }));
      setPresent((prev) => ({ ...prev, [type]: false }));
      setErrors((prev) => ({ ...prev, [type]: {} }));
      setStatus((prev) => ({ ...prev, [type]: "idle" }));
      return true;
    } catch {
      setStatus((prev) => ({ ...prev, [type]: "idle" }));
      setApiErrors((prev) => ({
        ...prev,
        [type]: "Couldn't remove this contact. Please try again.",
      }));
      return false;
    }
  }

  // Switching the toggle off deletes a saved fee_payer (it shouldn't linger
  // server-side and silently reach portals). If the delete fails, re-show the
  // card so its error is visible.
  async function handleFeePayerToggle(checked: boolean) {
    setShowFeePayer(checked);
    if (checked || !present.fee_payer) {
      if (!checked) {
        setForms((prev) => ({ ...prev, fee_payer: emptyForm() }));
        setErrors((prev) => ({ ...prev, fee_payer: {} }));
      }
      return;
    }
    const deleted = await handleDelete("fee_payer");
    if (!deleted) setShowFeePayer(true);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-96 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    );
  }

  if (loadError) {
    return <Alert tone="destructive">{loadError}</Alert>;
  }

  return (
    <div className="space-y-6">
      <ContactCard
        config={GUARDIAN_CONTACT}
        form={forms.guardian}
        errors={errors.guardian}
        status={status.guardian}
        apiError={apiErrors.guardian}
        present={present.guardian}
        addressHint="Optional — if left blank, your own address is used where a portal needs one."
        onFieldChange={(field, value) => setField("guardian", field, value)}
        onSave={() => void handleSave("guardian")}
        onRemove={() => void handleDelete("guardian")}
      />

      <Checkbox
        id="different-fee-payer"
        label="Someone different pays the fees"
        description="Leave off if the parent/guardian above (or you) pays — universities reuse their details."
        checked={showFeePayer}
        onChange={(ev) => void handleFeePayerToggle(ev.target.checked)}
        disabled={status.fee_payer === "deleting"}
      />

      {showFeePayer && (
        <ContactCard
          config={FEE_PAYER_CONTACT}
          form={forms.fee_payer}
          errors={errors.fee_payer}
          status={status.fee_payer}
          apiError={apiErrors.fee_payer}
          present={present.fee_payer}
          addressHint="UJ asks for the fee payer's full postal address — fill it in if you can."
          onFieldChange={(field, value) => setField("fee_payer", field, value)}
          onSave={() => void handleSave("fee_payer")}
          onRemove={() => void handleDelete("fee_payer")}
        />
      )}
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
