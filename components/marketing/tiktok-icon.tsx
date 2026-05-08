// TikTokIcon — lucide-react doesn't ship a TikTok glyph, so we draw a
// minimal one ourselves to match the line weight of the other social icons.
// `currentColor` so it picks up hover states.
interface IconProps {
  size?: number;
  className?: string;
}

export function TikTokIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      role="img"
      aria-label="TikTok"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M20 8.4a6.6 6.6 0 0 1-3.8-1.2v8.2a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v2.7a3 3 0 1 0 2 2.8V2h2.6a4 4 0 0 0 4 3.8V8.4Z" />
    </svg>
  );
}
