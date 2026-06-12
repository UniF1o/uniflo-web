// Dashboard — the student's command centre.
//
// All state lives client-side in the shared JourneyProvider (mounted in the
// (app) layout), so this page is a thin server shell: metadata + the client
// component. The journey decides whether the student sees the setup
// checklist or the tracking hub.
import type { Metadata } from "next";
import { DashboardHome } from "@/components/dashboard/home";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return <DashboardHome />;
}
