import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/ui/section";
import { ChangePasswordSection } from "@/components/settings/change-password";
import { DeleteAccountSection } from "@/components/settings/delete-account";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-10">
      <PageHeader
        kicker="Account"
        title={
          <>
            Your <span className="text-primary">settings.</span>
          </>
        }
        description="Manage your account preferences."
      />

      <Section kicker="Security">
        <ChangePasswordSection />
      </Section>

      <Section kicker="Danger zone">
        <DeleteAccountSection />
      </Section>
    </div>
  );
}
