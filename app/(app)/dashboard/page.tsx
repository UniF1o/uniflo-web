// /dashboard — placeholder landing page for signed-in users.
//
// This page intentionally has almost no content. Task 7 fleshes it out with
// a real profile-completeness indicator. For Task 2 it exists only so the
// (app) route group has a reachable route and the shell chrome can be
// exercised end-to-end on the Vercel preview.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-4xl leading-tight tracking-tight md:text-5xl">
        Welcome back.
      </h1>
      <p className="max-w-prose text-muted-foreground">
        This is the dashboard shell. Your real dashboard — profile progress,
        academic records, and document uploads — arrives in Task 7.
      </p>
    </div>
  );
}
