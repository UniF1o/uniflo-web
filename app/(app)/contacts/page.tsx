import type { Metadata } from "next";
import { ContactsManager } from "@/components/contacts/contacts-manager";

export const metadata: Metadata = {
  title: "Contacts",
};

export default function ContactsPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <div className="space-y-1">
        <h1 className="font-display text-3xl tracking-tight text-foreground">
          Contacts
        </h1>
        <p className="text-sm text-muted-foreground">
          Add the people universities ask about — next of kin, fee payer,
          guardian, and an emergency contact. All optional, but they speed up
          your applications.
        </p>
      </div>
      <ContactsManager />
    </div>
  );
}
