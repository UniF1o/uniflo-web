// AppShell — client-side chrome (navbar + sidebar) for every signed-in page.
//
// The (app) layout is a Server Component that handles auth and redirects.
// This component is a Client Component so it can hold the mobile sidebar's
// open/closed state via useState — something server components can't do.
// The split keeps each side doing only what it's suited for.
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
  // Controls the mobile sidebar drawer. On md+ the sidebar is always visible
  // so this value is ignored at those breakpoints.
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Auto-close the drawer when the user navigates to a new route.
  // We compare the current pathname to the last one we saw and call setState
  // directly during render (derived state pattern) rather than in a useEffect.
  // React 19 warns against setState inside effects because it causes an extra
  // render cycle — this approach avoids that.
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setIsSidebarOpen(false);
  }

  return (
    // Flex column: navbar fixed to top, sidebar + main filling the remaining height.
    <div className="flex min-h-dvh flex-col">
      <Navbar
        user={user}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
      />

      {/* Sidebar + content row.
       * Mobile: sidebar is a fixed drawer (off-screen by default).
       * Desktop (md+): sidebar is an in-flow column; main flexes into the rest. */}
      <div className="flex flex-1">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* min-w-0 prevents flex children from growing wider than the viewport
         * when page content is long (e.g. wide tables or code blocks). */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
