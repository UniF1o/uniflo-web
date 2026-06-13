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
          Add a parent or guardian once — universities reuse them wherever they
          ask for a next of kin, emergency contact, or account holder.
        </p>
      </div>
      <ContactsManager />
    </div>
  );
}
