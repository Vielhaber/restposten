import type { ItemCondition } from "@/lib/validation/manifest.schema";
import { CONDITION_LABELS } from "@/lib/types/marketplace";

/**
 * Small, dependency-free CSV parser for the manifest importer.
 *
 * Handles the two things that trip up a naive `split(",")`:
 *  - quoted fields (so a comma or delimiter inside a title/notes cell
 *    doesn't split the row), including escaped `""` quotes
 *  - German-locale Excel exports, which default to `;` as the delimiter
 *    because `,` is the decimal separator — the delimiter is auto-detected
 *    from the header row rather than assumed
 */
export function parseCsv(text: string): string[][] {
  const normalized = text.replace(/^﻿/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const delimiter = detectDelimiter(normalized);

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];

    if (inQuotes) {
      if (char === '"') {
        if (normalized[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  // Flush the final field/row if the file doesn't end with a trailing newline.
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

function detectDelimiter(text: string): "," | ";" {
  const headerLine = text.split("\n", 1)[0] ?? "";
  const semicolons = (headerLine.match(/;/g) ?? []).length;
  const commas = (headerLine.match(/,/g) ?? []).length;
  return semicolons > commas ? ";" : ",";
}

/** Maps a raw CSV header cell to one of our known manifest columns, tolerant of case, spacing, and a few common German/English aliases. */
const HEADER_ALIASES: Record<string, string> = {
  ean: "ean",
  gtin: "ean",
  barcode: "ean",
  title: "title",
  titel: "title",
  artikel: "title",
  artikelbezeichnung: "title",
  bezeichnung: "title",
  brand: "brand",
  marke: "brand",
  condition: "condition",
  zustand: "condition",
  quantity: "quantity",
  menge: "quantity",
  anzahl: "quantity",
  msrp: "msrpEuro",
  msrp_eur: "msrpEuro",
  uvp: "msrpEuro",
  uvp_eur: "msrpEuro",
  "uvp(€)": "msrpEuro",
  cost_basis: "costBasisEuro",
  cost_basis_eur: "costBasisEuro",
  einkaufswert: "costBasisEuro",
  einkaufswert_eur: "costBasisEuro",
  ek: "costBasisEuro",
  ek_eur: "costBasisEuro",
  notes: "notes",
  notiz: "notes",
  anmerkung: "notes",
};

export function normalizeHeaderCell(cell: string): string | null {
  const key = cell.trim().toLowerCase().replace(/\s+/g, "_");
  return HEADER_ALIASES[key] ?? null;
}

const LABEL_TO_CONDITION: Record<string, ItemCondition> = Object.fromEntries(
  (Object.entries(CONDITION_LABELS) as [ItemCondition, string][]).map(([key, label]) => [
    label.toLowerCase().replace(/[^a-z0-9]+/g, ""),
    key,
  ]),
);

/**
 * Best-effort mapping of a free-text condition cell to one of our enum
 * values — accepts the raw enum key ("A_GRADE"), the German label used
 * throughout the UI ("A-Ware"), or common shorthand ("A"). Anything it
 * can't confidently map is passed through unchanged so the row's live Zod
 * validation surfaces a clear "invalid condition" error the seller can fix
 * from the dropdown, instead of silently guessing.
 */
export function normalizeConditionCell(raw: string): ItemCondition {
  const trimmed = raw.trim();
  const asKey = trimmed.toUpperCase().replace(/[\s-]+/g, "_");
  if (["A_GRADE", "B_GRADE_RETURN", "C_GRADE_DEFECT", "D_GRADE_SALVAGE"].includes(asKey)) {
    return asKey as ItemCondition;
  }

  const byLabel = LABEL_TO_CONDITION[trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "")];
  if (byLabel) return byLabel;

  const shorthand: Record<string, ItemCondition> = {
    a: "A_GRADE",
    b: "B_GRADE_RETURN",
    c: "C_GRADE_DEFECT",
    d: "D_GRADE_SALVAGE",
  };
  const bySingleLetter = shorthand[trimmed.toLowerCase()];
  if (bySingleLetter) return bySingleLetter;

  return asKey as ItemCondition;
}
