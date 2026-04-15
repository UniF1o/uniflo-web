// Sidebar — primary app navigation.
//
// Behaviour:
//   Desktop (md+): fixed vertical column on the left of the viewport, always
//                  visible. The main content area gets a matching left
//                  padding in AppShell.
//   Mobile:        hidden off-screen. Slides in from the left as a drawer
//                  when the user taps the navbar hamburger. A semi-opaque
//                  backdrop covers the rest of the screen.
//
// Nav item set is scoped to Phase 1 (Dashboard, Profile, Documents). New
// sections should be appended to the NAV_ITEMS array — don't hard-code
// additions elsewhere.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UserCircle2, FileText, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SidebarProps {
  // Mobile-only: whether the drawer is currently open. Ignored on desktop
  // (the sidebar is always visible at md+).
  isOpen: boolean;
  // Invoked when the user taps the backdrop, the close button, or any nav
  // link — AppShell closes the drawer on any of those interactions.
  onClose: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Centralised nav definition. Add Phase 2 routes here when they ship.
const NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: UserCircle2 },
  { href: "/documents", label: "Documents", icon: FileText },
] as const;

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  // `usePathname` lets us highlight the current section. On route change the
  // hook re-renders automatically — no subscription wiring needed.
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop. Only rendered (and faded in) when the drawer is
       * open. Tapping it closes the drawer. md:hidden hides it on desktop. */}
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm transition-opacity duration-200 md:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* Sidebar panel itself.
       *
       * Mobile: absolute, slides in with a translate transform.
       * Desktop (md+): sticky in-flow column. `md:translate-x-0` overrides
       *                the mobile translate so the desktop view is unaffected
       *                by the `isOpen` state. */}
      <aside
        aria-label="Primary navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-dvh w-64 flex-col border-r border-border bg-background transition-transform duration-200 ease-out",
          "md:sticky md:top-0 md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Mobile-only header with close button. Hidden on desktop because
         * the brand already lives in the navbar. */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4 md:hidden">
          <span className="font-display text-lg">Menu</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted"
          >
            <X size={20} />
          </button>
        </div>

        {/* Desktop top padding — visually balances the navbar height so the
         * first nav item lines up with the navbar baseline. */}
        <div className="hidden md:block md:h-4" />

        {/* Nav list. Using <nav> for semantics + keyboard a11y. */}
        <nav className="flex flex-col gap-1 p-3">
          {NAV_ITEMS.map((item) => {
            // Active match: exact path OR a sub-route of it (e.g. /profile/edit
            // should still highlight "Profile").
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <Icon
                  size={18}
                  className={cn(
                    "shrink-0",
                    isActive ? "text-accent" : "text-muted-foreground",
                  )}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer hint — gives the sidebar visual closure and reinforces the
         * editorial tone. Small, muted, non-interactive. */}
        <div className="mt-auto border-t border-border p-4 text-xs leading-relaxed text-muted-foreground">
          <p className="font-display text-sm text-foreground">
            One application.
          </p>
          <p>Every university.</p>
        </div>
      </aside>
    </>
  );
}
