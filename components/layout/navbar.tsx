// Navbar — top utility bar used inside the (app) layout.
//
// Client component so it can accept an `onToggleSidebar` callback that's
// wired to AppShell's drawer state. Keeps the rendered HTML minimal: a
// hamburger button on mobile (hidden on md+), the brand mark, and the user
// menu on the right.
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
      // Sticky at the top so the brand and user menu follow the user as they
      // scroll long forms. `backdrop-blur` + translucent bg gives the paper
      // aesthetic a subtle depth cue.
      className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:h-16 md:px-6"
    >
      {/* Hamburger — only visible on mobile. Tapping calls the parent's
       * toggle so the sidebar drawer slides in. */}
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label="Open navigation"
        className="-ml-2 inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted md:hidden"
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
