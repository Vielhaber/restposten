/**
 * Realistic sample listings for the marketplace prototype (feed, listing
 * detail). Not fetched from the database — Phase 2 replaces this module
 * with real Prisma queries once the escrow/auction backend exists. EAN
 * values below are real, checksum-valid EAN-13 codes (verified against
 * `isValidEan13` in manifest.schema.ts), not placeholders.
 */

import type { SampleListing } from "../types/marketplace";

export const SAMPLE_LISTINGS: SampleListing[] = [
  {
    slug: "consumer-electronics-retouren-rp-2291",
    seller: { companyName: "Nordwest Handelskontor GmbH", location: "Nürnberg, DE", verified: true },
    title: "Retouren-Palette Unterhaltungselektronik",
    isBlindListing: true,
    blindTitle: "Blind-Lot RP-2291 — Consumer Electronics, geprüfte Markenware",
    requiresNda: true,
    category: "Elektronik",
    pricingMode: "DUTCH_AUCTION",
    currency: "EUR",
    startPriceCents: 420000,
    floorPriceCents: 210000,
    currentPriceCents: 315000,
    decayEndAt: "2026-09-06T16:00:00+02:00",
    restrictedChannels: ["AMAZON", "EBAY"],
    geoFencingNote: "Wiederverkauf nur stationär oder über eigenen Webshop — kein Amazon/eBay-Listing.",
    escrowRequired: true,
    originZip: "90411",
    originCity: "Nürnberg",
    palletCount: 1,
    totalWeightKg: 340,
    publishedAt: "2026-09-01T09:00:00+02:00",
    manifestItems: [
      {
        ean: "4006381333931",
        title: "True-Wireless In-Ear Kopfhörer",
        brand: "(Markenware, siehe NDA)",
        condition: "B_GRADE_RETURN",
        quantity: 120,
        msrpCents: 7999,
        costBasisCents: 1800,
      },
      {
        ean: "4023124500122",
        title: "Bluetooth-Lautsprecher 20W, spritzwassergeschützt",
        brand: "(Markenware, siehe NDA)",
        condition: "B_GRADE_RETURN",
        quantity: 60,
        msrpCents: 4999,
        costBasisCents: 1200,
      },
      {
        ean: "4260123890018",
        title: "Smart-Steckdose WLAN, 2er-Set",
        brand: "(Markenware, siehe NDA)",
        condition: "A_GRADE",
        quantity: 200,
        msrpCents: 2499,
        costBasisCents: 600,
      },
    ],
  },
  {
    slug: "kuechengrossgeraete-b-ware-mix-0847",
    seller: { companyName: "Rhein-Main Retail Solutions AG", location: "Mainz, DE", verified: true },
    title: "B-Ware Küchengroßgeräte Mix — Einbaugeräte",
    isBlindListing: false,
    requiresNda: false,
    category: "Haushalt & Küche",
    pricingMode: "SEALED_BID",
    currency: "EUR",
    reservePriceCents: 850000,
    biddingEndsAt: "2026-09-08T12:00:00+02:00",
    restrictedChannels: ["AMAZON", "EBAY", "BRICK_AND_MORTAR"],
    geoFencingNote: "Export only — kein Wiederverkauf in AT/DE zulässig.",
    escrowRequired: true,
    originZip: "55116",
    originCity: "Mainz",
    palletCount: 3,
    totalWeightKg: 890,
    publishedAt: "2026-08-28T14:30:00+02:00",
    manifestItems: [
      {
        ean: "4001239876509",
        title: "Einbaubackofen 60cm, Edelstahl, Pyrolyse",
        condition: "C_GRADE_DEFECT",
        quantity: 18,
        msrpCents: 44900,
        costBasisCents: 9500,
      },
      {
        ean: "4019876543203",
        title: "Induktionskochfeld 4-Zonen, 60cm",
        condition: "B_GRADE_RETURN",
        quantity: 24,
        msrpCents: 32900,
        costBasisCents: 7000,
      },
    ],
  },
  {
    slug: "damenmode-retouren-fs-1204",
    seller: { companyName: "Textilhandel Bergmann OHG", location: "Bielefeld, DE", verified: true },
    title: "Damen-Mode Retouren Restposten — Frühjahr/Sommer",
    isBlindListing: false,
    requiresNda: false,
    category: "Fashion & Bekleidung",
    pricingMode: "FIXED_PRICE",
    currency: "EUR",
    listPriceCents: 360000,
    restrictedChannels: ["AMAZON", "EBAY", "EXPORT_EU", "EXPORT_NON_EU"],
    geoFencingNote: "Nur stationärer Wiederverkauf in DACH — kein Online-Listing, kein Export.",
    escrowRequired: true,
    originZip: "33602",
    originCity: "Bielefeld",
    palletCount: 2,
    totalWeightKg: 410,
    publishedAt: "2026-09-02T10:15:00+02:00",
    manifestItems: [
      {
        ean: "4098765123405",
        title: "Damen Steppjacke, Gr. 38–44, Farb-Mix",
        condition: "A_GRADE",
        quantity: 85,
        msrpCents: 8995,
        costBasisCents: 2200,
      },
      {
        ean: "4032145698701",
        title: "Damen Bluse Viskose, Farb-Mix",
        condition: "A_GRADE",
        quantity: 140,
        msrpCents: 3495,
        costBasisCents: 800,
      },
    ],
  },
];

export function getListingBySlug(slug: string): SampleListing | undefined {
  return SAMPLE_LISTINGS.find((listing) => listing.slug === slug);
}
