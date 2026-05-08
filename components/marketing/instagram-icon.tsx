// InstagramIcon — minimal Instagram glyph drawn to match the line weight of
// the other social icons in `SocialLinks`. Inherits `currentColor`.
interface IconProps {
  size?: number;
  className?: string;
}

export function InstagramIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      role="img"
      aria-label="Instagram"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}
