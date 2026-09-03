import Link from "next/link";
import type { SampleListing } from "@/lib/types/marketplace";
import { CONDITION_LABELS, RESALE_CHANNEL_LABELS } from "@/lib/types/marketplace";
import { summarizeManifest } from "@/lib/validation/manifest.schema";
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

  return (
    <Card className="overflow-hidden">
      <Link href={`/listings/${listing.slug}`} className="block hover:bg-accent/40">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            {listing.isBlindListing && <Badge variant="warning">Blind-Listing · NDA</Badge>}
            {listing.escrowRequired && <Badge variant="success">Treuhand-Zahlung</Badge>}
            <Badge variant="outline">{listing.category}</Badge>
          </div>
          <h3 className="text-lg font-semibold leading-snug text-balance">
            {listing.isBlindListing ? listing.blindTitle : listing.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {listing.isBlindListing ? "Verifizierter Anbieter" : listing.seller.companyName} ·{" "}
            {listing.seller.location}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
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

          <div className="flex flex-wrap gap-1.5">
            {listing.restrictedChannels.map((channel) => (
              <Badge key={channel} variant="outline" className="text-[11px]">
                {RESALE_CHANNEL_LABELS[channel]} gesperrt
              </Badge>
            ))}
          </div>

          <PricingBox listing={listing} compact />
        </CardContent>
      </Link>
    </Card>
  );
}
