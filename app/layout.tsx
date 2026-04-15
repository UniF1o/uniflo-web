// Root layout for the whole Uniflo web app.
//
// Responsibilities:
// - Load and expose the two project fonts (Instrument Serif + Geist Sans)
//   as CSS custom properties so they can be used across every layout.
// - Define site-wide <html> / <body> shell.
// - Provide base SEO metadata. Individual pages/routes override titles and
//   descriptions via their own `generateMetadata` or `metadata` exports.
//
// next/font downloads the fonts at build time and self-hosts them — no
// external network request at runtime. `variable: '--font-...'` exposes each
// font as a CSS custom property that Tailwind picks up via @theme.
import type { Metadata } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import "./globals.css";

// Body / UI font — Geist Sans. Chosen over Inter for distinctive character
// while still feeling modern. `subsets: ['latin']` is enough for English and
// SA's Latin-script languages (Zulu, Xhosa, Afrikaans, Sesotho, etc.).
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

// Display font — Instrument Serif. Used for h1/h2 and the brand mark.
// Instrument Serif only ships a 400 weight, which is all we need for
// editorial-style headings.
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    // Child routes set `title: 'Page name'`; the root layout appends the
    // brand template, so browser tabs always read "Page name — Uniflo".
    default: "Uniflo — Apply to SA universities, automated",
    template: "%s — Uniflo",
  },
  description:
    "Uniflo helps South African students apply to multiple universities in one go. Fill in your details once, review every application, and let us handle the rest.",
  // Basic OpenGraph / icon metadata can be added here once assets exist.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // Expose both font variables on <html> so any descendant can reference
      // them via the Tailwind `font-body` / `font-display` utilities. `h-full`
      // + body's `min-h-dvh` lets fixed-position overlays (mobile drawer,
      // modals) size correctly on iOS Safari.
      className={`${geistSans.variable} ${instrumentSerif.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh font-body">{children}</body>
    </html>
  );
}
