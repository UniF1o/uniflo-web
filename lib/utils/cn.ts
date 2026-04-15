// cn — small utility that joins Tailwind class strings and filters out
// falsy values. Written by hand to avoid pulling in `clsx` + `tailwind-merge`
// until we actually need conflict resolution. If/when two utilities in the
// same call start fighting (e.g. "p-4" vs "p-6"), swap this out for
// `twMerge(clsx(inputs))`.
//
// Example:
//   cn('px-4', isOpen && 'bg-muted', undefined, 'text-sm')
//   => 'px-4 bg-muted text-sm'
export type ClassValue = string | number | null | undefined | false;

export function cn(...inputs: ClassValue[]): string {
  return inputs.filter(Boolean).join(" ");
}
