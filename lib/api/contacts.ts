// Contacts contract + typed helpers.
//
// `/contacts` is in the backend OpenAPI spec, so its shapes are generated into
// `lib/api/schema.d.ts`. This file re-exports them under app-friendly names and
// wraps the three operations (list / upsert / delete) so components never build
// raw paths.
//
// Endpoint shape (one contact per type per student):
//   GET    /contacts                          → ContactResponse[]
//   POST   /contacts                          → upsert (ContactWrite → 201)
//   DELETE /contacts?contact_type=<type>      → 204
import type { components } from "@/lib/api/schema";
import { apiClient } from "@/lib/api/client";

export type ContactType = components["schemas"]["ContactType"];
export type ContactResponse = components["schemas"]["ContactResponse"];
export type ContactWrite = components["schemas"]["ContactWrite"];

// The four contact types, in display order, with the copy each card shows.
export const CONTACT_TYPES: ReadonlyArray<{
  value: ContactType;
  label: string;
  description: string;
}> = [
  {
    value: "next_of_kin",
    label: "Next of kin",
    description:
      "Your closest relative. Wits requires their email and mobile to differ from yours.",
  },
  {
    value: "fee_payer",
    label: "Fee payer",
    description: "Whoever pays your fees. UJ needs their full postal address.",
  },
  {
    value: "guardian",
    label: "Guardian",
    description: "A parent or legal guardian, if applicable.",
  },
  {
    value: "emergency",
    label: "Emergency contact",
    description: "Who the university should call in an emergency.",
  },
];

export function listContacts(): Promise<ContactResponse[]> {
  return apiClient.get<ContactResponse[]>("/contacts");
}

export function upsertContact(body: ContactWrite): Promise<ContactResponse> {
  return apiClient.post<ContactResponse>("/contacts", body);
}

export function deleteContact(contactType: ContactType): Promise<void> {
  return apiClient.delete<void>(
    `/contacts?contact_type=${encodeURIComponent(contactType)}`,
  );
}
