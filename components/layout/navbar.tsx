// Navbar — sticky top bar rendered inside every authenticated page.
//
// Client component so it can accept the onToggleSidebar callback from
// AppShell. Contains three elements: hamburger (mobile only), brand mark,
// and the user avatar menu.
"use client";

import { Menu } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { BrandMark } from "./brand-mark";
import { UserMenu } from "./user-menu";

interface NavbarProps {
  user: User;
  // Fired when the user taps the hamburger button on mobile. The parent
  // AppShell owns the actual open/closed state.
  onToggleSidebar: () => void;
}

export function Navbar({ user, onToggleSidebar }: NavbarProps) {
  return (
    <header
      // Sticky so the brand and user menu stay visible while the user scrolls.
      // bg-background/80 + backdrop-blur gives a frosted-glass depth cue; the
      // `supports-[backdrop-filter]` query keeps the bar opaque on browsers
      // that don't support the blur (otherwise content shows through).
      className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/70 bg-background/80 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 md:h-16 md:px-6"
    >
      {/* Hamburger — mobile only (md:hidden). Opens the sidebar drawer. */}
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label="Open navigation"
        className="-ml-2 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted md:hidden"
      >
        <Menu size={20} />
      </button>

      <BrandMark />

      {/* Flex spacer pushes the user menu to the far right. */}
      <div className="flex-1" />

      <UserMenu user={user} />
    </header>
  );
}
