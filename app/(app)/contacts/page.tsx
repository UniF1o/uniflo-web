import type { Metadata } from "next";
import { ContactsManager } from "@/components/contacts/contacts-manager";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Contacts",
};

export default function ContactsPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <PageHeader
        kicker="Your story"
        title={
          <>
            Your <span className="text-primary">people.</span>
          </>
        }
        description="Add a parent or guardian once — universities reuse them wherever they ask for a next of kin, emergency contact, or account holder."
      />
      <ContactsManager />
    </div>
  );
}
