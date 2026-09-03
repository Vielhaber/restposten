import type { SampleListing } from "@/lib/types/marketplace";

/** The single comparable "current price" for a listing regardless of pricing mode — used for sorting the feed. */
export function getEffectivePriceCents(listing: SampleListing): number {
  switch (listing.pricingMode) {
    case "FIXED_PRICE":
      return listing.listPriceCents ?? 0;
    case "DUTCH_AUCTION":
      return listing.currentPriceCents ?? listing.startPriceCents ?? 0;
    case "SEALED_BID":
      return listing.reservePriceCents ?? 0;
  }
}
