import type { Metadata } from "next";
import { ProfileEditForm } from "@/components/profile/edit-form";

export const metadata: Metadata = {
  title: "Edit profile",
};

export default function ProfileEditPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <div className="space-y-1">
        <h1 className="font-display text-3xl tracking-tight text-foreground">
          Edit profile
        </h1>
        <p className="text-sm text-muted-foreground">
          Update any of your details below. Only fields you change will be
          saved.
        </p>
      </div>
      <ProfileEditForm />
    </div>
  );
}
