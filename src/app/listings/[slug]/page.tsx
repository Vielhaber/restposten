import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SAMPLE_LISTINGS, getListingBySlug } from "@/lib/sample-data/listings";
import { RESALE_CHANNEL_LABELS } from "@/lib/types/marketplace";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PricingBox } from "@/components/marketplace/pricing-box";
import { ManifestTable } from "@/components/marketplace/manifest-table";

export function generateStaticParams() {
  return SAMPLE_LISTINGS.map((listing) => ({ slug: listing.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = getListingBySlug(slug);
  return { title: listing ? `${listing.isBlindListing ? listing.blindTitle : listing.title} — Restposten Platform` : "Nicht gefunden" };
}

export default async function ListingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = getListingBySlug(slug);
  if (!listing) notFound();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {listing.isBlindListing && <Badge variant="warning">Blind-Listing · NDA erforderlich</Badge>}
          {listing.escrowRequired && <Badge variant="success">Treuhand-Zahlung</Badge>}
          <Badge variant="outline">{listing.category}</Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {listing.isBlindListing ? listing.blindTitle : listing.title}
        </h1>
        <p className="text-muted-foreground">
          {listing.isBlindListing ? "Verifizierter Anbieter (Firmenname nach NDA sichtbar)" : listing.seller.companyName}{" "}
          · {listing.seller.location} · online seit {formatDate(listing.publishedAt)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Manifest</CardTitle>
            </CardHeader>
            <CardContent>
              <ManifestTable items={listing.manifestItems} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logistik</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Abholort</p>
                <p className="font-medium">
                  {listing.originZip} {listing.originCity}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Paletten</p>
                <p className="font-medium tabular-nums">{listing.palletCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gesamtgewicht</p>
                <p className="font-medium tabular-nums">{listing.totalWeightKg.toLocaleString("de-DE")} kg</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kanal- &amp; Gebietsbeschränkungen</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-1.5">
                {listing.restrictedChannels.map((channel) => (
                  <Badge key={channel} variant="outline">
                    {RESALE_CHANNEL_LABELS[channel]} gesperrt
                  </Badge>
                ))}
              </div>
              {listing.geoFencingNote && <p className="text-sm text-muted-foreground">{listing.geoFencingNote}</p>}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="pt-5">
              <PricingBox listing={listing} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">So funktioniert die Treuhand-Zahlung</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p>1. Zahlung wird bei Kauf autorisiert, aber noch nicht eingezogen.</p>
              <p>2. Nach Zustellung startet eine 48-Stunden-Prüffrist.</p>
              <p>3. Ohne Beanstandung wird die Zahlung automatisch freigegeben und an den Verkäufer ausgezahlt.</p>
              <p>4. Bei &gt;3&nbsp;% Abweichung vom Manifest kann ein Streitfall eröffnet werden.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
