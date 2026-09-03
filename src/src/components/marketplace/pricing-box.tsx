import type { SampleListing } from "@/lib/types/marketplace";
import { formatCents, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PRICING_MODE_LABEL: Record<SampleListing["pricingMode"], string> = {
  FIXED_PRICE: "Festpreis",
  DUTCH_AUCTION: "Dutch Auction",
  SEALED_BID: "Verdecktes Gebot",
};

/** Renders the price + primary CTA for whichever pricing mode a listing uses. Same component in the feed card (compact) and the detail page (full). */
export function PricingBox({ listing, compact = false }: { listing: SampleListing; compact?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <Badge variant="outline" className="w-fit">
        {PRICING_MODE_LABEL[listing.pricingMode]}
      </Badge>

      {listing.pricingMode === "FIXED_PRICE" && (
        <>
          <p className={compact ? "text-xl font-semibold" : "text-3xl font-semibold"}>
            {formatCents(listing.listPriceCents!)}
          </p>
          {!compact && <p className="text-sm text-muted-foreground">Festpreis, sofort kaufbar</p>}
          <Button className="mt-1 w-full">Jetzt kaufen</Button>
        </>
      )}

      {listing.pricingMode === "DUTCH_AUCTION" && (
        <>
          <div className="flex items-baseline gap-2">
            <p className={compact ? "text-xl font-semibold" : "text-3xl font-semibold"}>
              {formatCents(listing.currentPriceCents!)}
            </p>
            <span className="text-sm text-muted-foreground line-through">
              {formatCents(listing.startPriceCents!)}
            </span>
          </div>
          {!compact && (
            <p className="text-sm text-muted-foreground">
              Preis sinkt automatisch bis Mindestpreis {formatCents(listing.floorPriceCents!)} oder bis ein Käufer
              zuschlägt · Ende spätestens {formatDateTime(listing.decayEndAt!)}
            </p>
          )}
          <Button className="mt-1 w-full">Jetzt zuschlagen</Button>
        </>
      )}

      {listing.pricingMode === "SEALED_BID" && (
        <>
          <p className={compact ? "text-xl font-semibold" : "text-3xl font-semibold"}>
            {formatCents(listing.reservePriceCents!)}
          </p>
          <p className="text-sm text-muted-foreground">
            {compact ? "Mindestgebot" : `Mindestgebot · Gebotsfrist endet ${formatDateTime(listing.biddingEndsAt!)}`}
          </p>
          <Button className="mt-1 w-full" variant="secondary">
            Gebot abgeben
          </Button>
        </>
      )}
    </div>
  );
}
