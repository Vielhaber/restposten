/**
 * Shared UI-layer types for the marketplace prototype pages (feed, listing
 * detail, seller upload flow).
 *
 * These mirror the enums/shapes in `prisma/schema.prisma` deliberately
 * rather than importing from `@prisma/client` — the Prisma client is only
 * generated once `npm install` runs with real network access (its
 * postinstall calls `prisma generate`), which this UI layer doesn't need:
 * Phase 2 wires these pages to real database queries; for now they render
 * from `src/lib/sample-data`. Keep this file's shapes in sync with the
 * schema as fields evolve.
 */

import type { ItemCondition } from "../validation/manifest.schema";

export type PricingMode = "FIXED_PRICE" | "DUTCH_AUCTION" | "SEALED_BID";

export type ResaleChannel =
  | "AMAZON"
  | "EBAY"
  | "KAUFLAND_DE"
  | "OTTO_MARKET"
  | "BRICK_AND_MORTAR"
  | "OWN_WEBSITE"
  | "WHOLESALE_B2B"
  | "EXPORT_EU"
  | "EXPORT_NON_EU"
  | "OTHER";

export const RESALE_CHANNEL_LABELS: Record<ResaleChannel, string> = {
  AMAZON: "Amazon",
  EBAY: "eBay",
  KAUFLAND_DE: "Kaufland.de",
  OTTO_MARKET: "OTTO Market",
  BRICK_AND_MORTAR: "Stationärer Handel",
  OWN_WEBSITE: "Eigener Webshop",
  WHOLESALE_B2B: "B2B-Großhandel",
  EXPORT_EU: "Export (EU)",
  EXPORT_NON_EU: "Export (außerhalb EU)",
  OTHER: "Sonstige",
};

export const CONDITION_LABELS: Record<ItemCondition, string> = {
  A_GRADE: "A-Ware",
  B_GRADE_RETURN: "B-Ware / Retoure",
  C_GRADE_DEFECT: "C-Ware / defekt",
  D_GRADE_SALVAGE: "D-Ware / Verwertung",
};

export interface SampleManifestItem {
  ean: string;
  title: string;
  brand?: string;
  condition: ItemCondition;
  quantity: number;
  msrpCents: number;
  costBasisCents: number;
}

export interface SampleListing {
  slug: string;
  seller: { companyName: string; location: string; verified: true };
  title: string;
  isBlindListing: boolean;
  blindTitle?: string;
  requiresNda: boolean;
  category: string;
  pricingMode: PricingMode;
  currency: "EUR";

  // FIXED_PRICE
  listPriceCents?: number;

  // DUTCH_AUCTION
  startPriceCents?: number;
  floorPriceCents?: number;
  currentPriceCents?: number;
  decayEndAt?: string;

  // SEALED_BID
  reservePriceCents?: number;
  biddingEndsAt?: string;

  restrictedChannels: ResaleChannel[];
  geoFencingNote?: string;
  escrowRequired: true;

  originZip: string;
  originCity: string;
  palletCount: number;
  totalWeightKg: number;

  publishedAt: string;
  manifestItems: SampleManifestItem[];
}
