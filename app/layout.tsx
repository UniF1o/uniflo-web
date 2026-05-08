// Root layout — wraps the entire Uniflo app.
//
// Loads all three project fonts via next/font (downloaded at build time,
// served from our own origin — no runtime request to fonts.googleapis.com).
// Each font is exposed as a CSS variable so Tailwind's @theme block can
// wire it up as a utility class (font-body / font-display / font-script).
//
// SEO: child routes export their own `metadata.title` as a short string
// (e.g. "Dashboard") and the template here expands it to "Dashboard — Uniflo".
import type { Metadata } from "next";
import { Caveat, Geist, Instrument_Serif } from "next/font/google";
import "./globals.css";

// Body / UI font. Chosen over Inter for a more distinctive character while
// remaining legible at small sizes. Latin subset covers English and SA's
// main Latin-script languages (Afrikaans, Zulu, Xhosa, Sesotho).
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

// Display font for headings and the brand mark. Instrument Serif ships one
// weight (400) which is all we need for editorial-style titles.
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

// Script accent. Used sparingly — short handwritten annotations next to a
// CTA or under a headline accent word. Single weight (600) keeps the bundle
// small and the visual treatment consistent.
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: "600",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Uniflo — Apply to SA universities, automated",
    template: "%s — Uniflo",
  },
  description:
    "Uniflo helps South African students apply to multiple universities in one go. Fill in your details once, review every application, and let us handle the rest.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // All three font variables must be on <html> so every descendant can
      // reach them. `h-full` works with `min-h-dvh` on body to let fixed
      // overlays (mobile drawer, modals) size correctly on iOS Safari.
      // `suppressHydrationWarning` silences the mismatch React logs when
      // browser extensions inject attributes onto <html> after SSR.
      className={`${geistSans.variable} ${instrumentSerif.variable} ${caveat.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh font-body">{children}</body>
    </html>
  );
}
