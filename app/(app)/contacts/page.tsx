import type { Metadata } from "next";
import { ContactsManager } from "@/components/contacts/contacts-manager";
import { PageHeader } from "@/components/layout/page-header";
import { PrivacyNote } from "@/components/ui/privacy-note";

export const metadata: Metadata = {
  title: "Contacts",
};

export default function ContactsPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <PageHeader
        kicker="Your story"
        title="Contacts"
        description="Add a parent or guardian once. Universities reuse their details wherever they ask for a next of kin, emergency contact, or account holder."
      />
      <ContactsManager />
      <PrivacyNote />
    </div>
  );
}
