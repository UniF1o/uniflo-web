"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelection } from "@/lib/state/selection";

// Redirects to /universities if the student arrives at /applications/new
// with nothing selected. Selection lives in client state, so this check
// must happen in a client component after hydration.
export function SelectionGuard({ children }: { children: React.ReactNode }) {
  const { entries } = useSelection();
  const router = useRouter();

  useEffect(() => {
    if (entries.length === 0) {
      router.replace("/universities");
    }
  }, [entries.length, router]);

  if (entries.length === 0) {
    return null;
  }

  return <>{children}</>;
}
