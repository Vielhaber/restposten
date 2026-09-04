import Link from "next/link";
import type { SampleListing } from "@/lib/types/marketplace";
import { CONDITION_LABELS, RESALE_CHANNEL_LABELS } from "@/lib/types/marketplace";
import { summarizeManifest } from "@/lib/validation/manifest.schema";
import { getCategoryVisual } from "@/lib/category-visuals";
import { getEffectivePriceCents } from "@/lib/listing-price";
import { formatCents } from "@/lib/format";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PricingBox } from "./pricing-box";

function conditionMix(listing: SampleListing): string {
  const counts = new Map<string, number>();
  for (const item of listing.manifestItems) {
    counts.set(item.condition, (counts.get(item.condition) ?? 0) + item.quantity);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([condition]) => CONDITION_LABELS[condition as keyof typeof CONDITION_LABELS])
    .join(" · ");
}

export function ListingCard({ listing }: { listing: SampleListing }) {
  const summary = summarizeManifest(listing.manifestItems);
  const visual = getCategoryVisual(listing.category);
  const Icon = visual.icon;
  const priceCents = getEffectivePriceCents(listing);

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg hover:shadow-primary/5">
      <Link href={`/listings/${listing.slug}`} className="block">
        <div className={`relative flex h-32 items-center justify-center bg-gradient-to-br ${visual.gradient}`}>
          <Icon className="h-10 w-10 text-foreground/40 transition-transform group-hover:scale-110" aria-hidden="true" />
          {listing.isBlindListing && (
            <Badge variant="warning" className="absolute left-3 top-3">
              Blind-Listing · NDA
            </Badge>
          )}
          <span className="absolute bottom-3 right-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold tabular-nums shadow-sm backdrop-blur">
            {priceCents > 0 ? formatCents(priceCents) : "Preis auf Anfrage"}
          </span>
        </div>

        <CardHeader className="pb-0">
          <p className="text-xs font-medium text-muted-foreground">{listing.category}</p>
          <h3 className="font-display text-lg font-semibold leading-snug text-balance">
            {listing.isBlindListing ? listing.blindTitle : listing.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {listing.isBlindListing ? "Verifizierter Anbieter" : listing.seller.companyName} ·{" "}
            {listing.seller.location}
          </p>
        </CardHeader>
      </Link>
      <CardContent className="flex flex-1 flex-col gap-4 pt-4">
        <dl className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Artikel gesamt</dt>
            <dd className="font-medium tabular-nums">{summary.totalManifestItems.toLocaleString("de-DE")}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Paletten</dt>
            <dd className="font-medium tabular-nums">{listing.palletCount}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Zustand</dt>
            <dd className="font-medium">{conditionMix(listing)}</dd>
          </div>
        </dl>

        {listing.restrictedChannels.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {listing.restrictedChannels.slice(0, 3).map((channel) => (
              <Badge key={channel} variant="outline" className="text-[11px]">
                {RESALE_CHANNEL_LABELS[channel]} gesperrt
              </Badge>
            ))}
            {listing.restrictedChannels.length > 3 && (
              <Badge variant="outline" className="text-[11px]">
                +{listing.restrictedChannels.length - 3} weitere
              </Badge>
            )}
          </div>
        )}

        <div className="mt-auto flex flex-col gap-4">
          <PricingBox listing={listing} compact />
        </div>
      </CardContent>
    </Card>
  );
}
