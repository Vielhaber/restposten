/**
 * Manifest upload validation — Zod schemas for the structured manifest
 * ingestion pipeline (CSV/XLSX rows -> ManifestItem rows).
 *
 * Two schemas are exported for each row shape:
 *  - `manifestCsvRowSchema`  — lenient input boundary. Spreadsheet/CSV
 *    parsers hand back strings (and sometimes blanks) for numeric cells, so
 *    this schema coerces "150", " 150 ", 150 all to the same number, and
 *    strips common EAN formatting noise (spaces, leading apostrophes Excel
 *    adds to prevent scientific-notation mangling of long digit strings).
 *  - `manifestItemSchema`    — canonical, strict shape used everywhere else
 *    (API payloads, the ManifestItem Prisma create/update input). No
 *    coercion: if it doesn't already look like a number, it's rejected.
 *
 * `manifestCsvRowSchema` parses into the same output shape as
 * `manifestItemSchema` via `.transform`, so callers downstream of the CSV
 * boundary never need to think about the coercion step.
 */

import { z } from "zod";

// ----------------------------------------------------------------------------
// EAN-13 validation (format + GS1 check-digit algorithm)
// ----------------------------------------------------------------------------

/**
 * Validates the GS1 EAN-13 check digit.
 *
 * Algorithm: sum digits 1-12 (left to right, 1-indexed) with alternating
 * weights 1,3,1,3,...; the check digit (13th) must equal
 * (10 - (sum mod 10)) mod 10.
 */
export function isValidEan13(value: string): boolean {
  if (!/^\d{13}$/.test(value)) return false;

  const digits = value.split("").map(Number);
  const checkDigit = digits[12];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const weight = i % 2 === 0 ? 1 : 3;
    sum += digits[i] * weight;
  }
  const computedCheckDigit = (10 - (sum % 10)) % 10;

  return computedCheckDigit === checkDigit;
}

/** Strips characters spreadsheet tools commonly inject around barcode cells. */
function normalizeEan(raw: string): string {
  return raw
    .trim()
    .replace(/^'/, "") // Excel's "force text" leading apostrophe
    .replace(/[\s-]/g, "");
}

export const eanSchema = z
  .string()
  .transform(normalizeEan)
  .superRefine((value, ctx) => {
    if (!/^\d{13}$/.test(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "EAN must be exactly 13 digits (EAN-13)",
      });
      return;
    }
    if (!isValidEan13(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "EAN-13 check digit is invalid — verify the barcode was transcribed correctly",
      });
    }
  });

// ----------------------------------------------------------------------------
// Shared enums / primitives
// ----------------------------------------------------------------------------

/** Mirrors `ItemCondition` in schema.prisma — keep the two in sync. */
export const itemConditionSchema = z.enum([
  "A_GRADE",
  "B_GRADE_RETURN",
  "C_GRADE_DEFECT",
  "D_GRADE_SALVAGE",
]);
export type ItemCondition = z.infer<typeof itemConditionSchema>;

const MAX_ROWS_PER_MANIFEST = 20_000;

// A permissive numeric coercer for spreadsheet cells: accepts numbers,
// numeric strings (with thousands separators or a leading currency-less
// "€"/"EUR" stripped), and rejects everything else with a clear message.
function coercedNonNegativeInt(fieldLabel: string) {
  return z.preprocess((raw) => {
    if (typeof raw === "number") return raw;
    if (typeof raw === "string") {
      const cleaned = raw.trim().replace(/[€\s]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
      if (cleaned === "") return undefined;
      const parsed = Number(cleaned);
      return Number.isNaN(parsed) ? raw : parsed;
    }
    return raw;
  }, z.number({ message: `${fieldLabel} must be a number` }).int(`${fieldLabel} must be a whole number`).nonnegative(`${fieldLabel} cannot be negative`));
}

// ----------------------------------------------------------------------------
// Canonical (strict) row schema
// ----------------------------------------------------------------------------

export const manifestItemSchema = z
  .object({
    ean: eanSchema,
    sku: z.string().trim().max(64).optional(),
    title: z.string().trim().min(1, "Title is required").max(300),
    brand: z.string().trim().max(150).optional(),
    condition: itemConditionSchema,
    quantity: z.number().int().positive("Quantity must be at least 1"),
    // UVP — recommended retail price, in integer cents.
    msrpCents: z.number().int().nonnegative(),
    // What the seller actually paid/values the stock at, in integer cents.
    costBasisCents: z.number().int().nonnegative(),
    imageUrls: z.array(z.string().url()).max(10).optional(),
    notes: z.string().trim().max(1000).optional(),
  })
  .superRefine((row, ctx) => {
    if (row.msrpCents === 0 && row.costBasisCents === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["msrpCents"],
        message: "Either MSRP or cost basis must be greater than zero",
      });
    }
  });

export type ManifestItemInput = z.infer<typeof manifestItemSchema>;

/** Derived, not stored: gross margin against MSRP, as a percentage (0-100 range typical, can exceed 100 for markup scenarios). */
export function computeGrossMarginPercent(item: Pick<ManifestItemInput, "msrpCents" | "costBasisCents">): number | null {
  if (item.msrpCents <= 0) return null;
  return ((item.msrpCents - item.costBasisCents) / item.msrpCents) * 100;
}

// ----------------------------------------------------------------------------
// CSV/XLSX ingestion row schema (coercing boundary)
// ----------------------------------------------------------------------------

export const manifestCsvRowSchema = z
  .object({
    ean: eanSchema,
    sku: z.string().trim().max(64).optional().or(z.literal("").transform(() => undefined)),
    title: z.string().trim().min(1, "Title is required").max(300),
    brand: z
      .string()
      .trim()
      .max(150)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    condition: z.preprocess((raw) => (typeof raw === "string" ? raw.trim().toUpperCase() : raw), itemConditionSchema),
    quantity: coercedNonNegativeInt("Quantity").pipe(z.number().positive("Quantity must be at least 1")),
    msrpCents: coercedNonNegativeInt("MSRP (cents)"),
    costBasisCents: coercedNonNegativeInt("Cost basis (cents)"),
    notes: z
      .string()
      .trim()
      .max(1000)
      .optional()
      .or(z.literal("").transform(() => undefined)),
  })
  .transform((row) => ({ ...row, imageUrls: undefined as string[] | undefined }));

export type ManifestCsvRow = z.input<typeof manifestCsvRowSchema>;

// ----------------------------------------------------------------------------
// Full manifest upload payload
// ----------------------------------------------------------------------------

export const manifestUploadSchema = z
  .object({
    listingId: z.string().cuid().optional(), // absent when uploading during listing draft creation
    items: z
      .array(manifestItemSchema)
      .min(1, "Manifest must contain at least one item")
      .max(MAX_ROWS_PER_MANIFEST, `Manifest cannot exceed ${MAX_ROWS_PER_MANIFEST} line items`),
  })
  .superRefine((payload, ctx) => {
    const seen = new Map<string, number>();
    payload.items.forEach((item, index) => {
      const key = `${item.ean}:${item.condition}`;
      const firstIndex = seen.get(key);
      if (firstIndex !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items", index, "ean"],
          message: `Duplicate EAN+condition also present at row ${firstIndex + 1} — merge quantities instead of listing twice`,
        });
      } else {
        seen.set(key, index);
      }
    });
  });

export type ManifestUploadInput = z.infer<typeof manifestUploadSchema>;

/** Aggregate totals used to populate `Listing.totalManifestItems/totalMsrpCents/totalCostBasisCents`. */
export function summarizeManifest(items: ManifestItemInput[]) {
  return items.reduce(
    (acc, item) => ({
      totalManifestItems: acc.totalManifestItems + item.quantity,
      totalMsrpCents: acc.totalMsrpCents + item.msrpCents * item.quantity,
      totalCostBasisCents: acc.totalCostBasisCents + item.costBasisCents * item.quantity,
    }),
    { totalManifestItems: 0, totalMsrpCents: 0, totalCostBasisCents: 0 },
  );
}
