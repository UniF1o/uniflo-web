// AppShell — client-side chrome for every authenticated route.
//
// The (app) server-component layout handles auth / redirect logic, then hands
// control to this shell. We split them because:
//   1. Server components can call `redirect()` and read cookies via the
//      Supabase server client. Client components can't.
//   2. Drawer state (sidebar open/closed on mobile) needs `useState`, which
//      only works in client components.
// Keeping the shell thin lets us reuse it if we ever need an alternate
// protected layout (e.g. an onboarding wizard with the same chrome).
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";

interface AppShellProps {
  user: User;
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  // Drawer state. Only meaningful on mobile — on md+ the sidebar is always
  // visible regardless of this value.
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Track the last pathname we observed. If it changes, the user navigated,
  // so auto-close the drawer. Doing this as derived state (instead of in a
  // useEffect) avoids the extra render that React 19 now warns about.
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setIsSidebarOpen(false);
  }

  return (
    // The outer flex column keeps navbar at the top and the sidebar + main
    // row filling the remaining viewport height.
    <div className="flex min-h-dvh flex-col">
      <Navbar
        user={user}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
      />

      {/* The sidebar + main row. On mobile the sidebar floats as a drawer
       * (position: fixed) and the main column spans the full width. On md+
       * the sidebar becomes an in-flow column and the main area flexes into
       * the remaining space. */}
      <div className="flex flex-1">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* `min-w-0` prevents long text/tables inside the main content from
         * forcing the flex container to grow wider than the viewport. */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
