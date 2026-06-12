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
//
// The backend enum still has four contact types, but after the cross-portal
// review (uniflo-api PR #49) the UI captures at most two. UP asks for no
// contact person; UCT, UJ and Wits all derive next-of-kin / emergency / fee
// roles from one person via backend fallback chains. So:
//   guardian  — the single "Parent / Guardian" section, always shown
//   fee_payer — captured only when someone different pays the fees
import type { components } from "@/lib/api/schema";
import { apiClient } from "@/lib/api/client";

export type ContactType = components["schemas"]["ContactType"];
export type ContactResponse = components["schemas"]["ContactResponse"];
export type ContactWrite = components["schemas"]["ContactWrite"];

export interface ManagedContactConfig {
  value: ContactType;
  label: string;
  description: string;
}

export const GUARDIAN_CONTACT: ManagedContactConfig = {
  value: "guardian",
  label: "Parent / Guardian",
  description:
    "Universities reuse this person wherever they ask for a next of kin or " +
    "emergency contact — you only capture them once.",
};

export const FEE_PAYER_CONTACT: ManagedContactConfig = {
  value: "fee_payer",
  label: "Fee payer",
  description:
    "The person who pays your fees. UJ asks for their full postal address.",
};

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
