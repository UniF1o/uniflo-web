// SocialLinks — the row of social-platform icons in the footer.
//
// Each href is a placeholder (`#`) until real handles exist. Set
// `target="_blank"` and `rel="noreferrer"` so external clicks open in a new
// tab safely. Each icon button is at least 40×40 to clear AA touch-target
// guidance on mobile.
import { InstagramIcon } from "./instagram-icon";
import { LinkedInIcon } from "./linkedin-icon";
import { TikTokIcon } from "./tiktok-icon";
import { XIcon } from "./x-icon";

interface SocialLink {
  label: string;
  href: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}

// TODO: replace the placeholder hrefs once the real social handles exist.
const LINKS: SocialLink[] = [
  { label: "Instagram", href: "#", Icon: InstagramIcon },
  { label: "TikTok", href: "#", Icon: TikTokIcon },
  { label: "X (Twitter)", href: "#", Icon: XIcon },
  { label: "LinkedIn", href: "#", Icon: LinkedInIcon },
];

export function SocialLinks() {
  return (
    <ul className="flex items-center gap-2">
      {LINKS.map(({ label, href, Icon }) => (
        <li key={label}>
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={`Uniflo on ${label}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary"
          >
            <Icon size={18} className="shrink-0" />
          </a>
        </li>
      ))}
    </ul>
  );
}
