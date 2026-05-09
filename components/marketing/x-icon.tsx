// XIcon — lucide-react's `Twitter` is the legacy bird; for the current X
// brand we draw the simple "X" glyph so the social row stays current.
interface IconProps {
  size?: number;
  className?: string;
}

export function XIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      role="img"
      aria-label="X"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M18.244 2H21l-6.55 7.49L22 22h-6.36l-4.75-6.21L5.4 22H2.64l7.02-8.02L2 2h6.5l4.3 5.68L18.244 2Zm-2.23 18.46h1.51L7.05 3.46H5.42l10.594 17Z" />
    </svg>
  );
}
