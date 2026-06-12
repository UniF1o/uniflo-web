import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileEditForm } from "@/components/profile/edit-form";

export const metadata: Metadata = {
  title: "Edit profile",
};

export default function ProfileEditPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <PageHeader
        kicker="Your story"
        title={
          <>
            Edit your <span className="text-primary">details.</span>
          </>
        }
        description="Update any of your details below. Only fields you change will be saved."
      />
      <ProfileEditForm />
    </div>
  );
}
