import type { OrgType } from "@/types/general";

// 1. Define available colors (DRY approach)
const COLORS = ["indigo", "pink", "cyan", "yellow"] as const;

// 2. Type for badge colors (bg + text)
type BadgeColor = [bg: string, text: string];

// 3. Generate BADGE_COLORS dynamically
export const BADGE_COLORS: BadgeColor[] = COLORS.map((name) => [
  `bg-${name}-100`,
  `text-${name}-800`,
]);

// 4. Predefined colors for specific orgs (using a Map for better lookup)
const ORG_COLORS = new Map<string, BadgeColor>([
  ["AC", ["bg-indigo-100", "text-indigo-800"]],
  ["LTC", ["bg-pink-100", "text-pink-800"]],
  ["HCB", ["bg-cyan-100", "text-cyan-800"]],
  ["HHA", ["bg-yellow-100", "text-yellow-800"]],
]);

// 5. Stable color generator (checks ORG_COLORS first, falls back to hashing)
export function colorFor(code: OrgType["code"]): BadgeColor {
  // Predefined color exists? Return it.
  if (ORG_COLORS.has(code)) {
    return ORG_COLORS.get(code)!;
  }
  // Otherwise, compute a hash-based color.
  const index =
    [...code].reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    BADGE_COLORS.length;
  return BADGE_COLORS[index];
}
