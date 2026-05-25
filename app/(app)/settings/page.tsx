import type { Metadata } from "next";
import { ChangePasswordSection } from "@/components/settings/change-password";
import { DeleteAccountSection } from "@/components/settings/delete-account";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-12">
      <div className="space-y-1">
        <h1 className="font-display text-3xl tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your account preferences.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Security
        </h2>
        <ChangePasswordSection />
      </section>

      <section className="space-y-4">
        <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Danger zone
        </h2>
        <DeleteAccountSection />
      </section>
    </div>
  );
}
