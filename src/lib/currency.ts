/**
 * Shared Euro-string parsing for anywhere a human types a price by hand —
 * the manual manifest row editor and the CSV importer both funnel through
 * this so "1.234,56", "1234,56" and "1234.56" all resolve the same way.
 */
export function parseEuroToCents(raw: string): number | null {
  const cleaned = raw
    .trim()
    .replace(/€/g, "")
    .trim()
    // Thousands separator "." only when followed by exactly 3 digits then a
    // non-digit or end (so "1.234,56" -> "1234,56", but "12.5" stays "12.5").
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  if (cleaned === "") return null;
  const value = Number(cleaned);
  if (Number.isNaN(value) || value < 0) return null;
  return Math.round(value * 100);
}
