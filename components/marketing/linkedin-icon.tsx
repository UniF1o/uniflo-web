// LinkedInIcon — minimal LinkedIn glyph. Filled-in style to match a typical
// brand mark; inherits `currentColor` so it picks up hover states.
interface IconProps {
  size?: number;
  className?: string;
}

export function LinkedInIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      role="img"
      aria-label="LinkedIn"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5.001 2.5 2.5 0 0 1 0-5.001ZM3 9.5h4v11H3v-11Zm6 0h3.8v1.6h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V20.5h-4v-4.85c0-1.16-.02-2.65-1.62-2.65-1.62 0-1.87 1.27-1.87 2.57v4.93H9v-11Z" />
    </svg>
  );
}
