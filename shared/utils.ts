/**
 * Shared utilities used by both client and server.
 */

/**
 * Extract country from a location string.
 * Handles: "City, Country", "Country", "City, State, Country"
 *
 * Examples:
 *   "Bogotá, Colombia" → "Colombia"
 *   "Mexico City, Mexico" → "Mexico"
 *   "Colombia" → "Colombia"
 *   "Washington, D.C., United States" → "United States"
 */
export function extractCountry(location: string | null | undefined): string | undefined {
  if (!location) return undefined;
  const parts = location.split(",").map((s) => s.trim());
  return parts[parts.length - 1] || undefined;
}
