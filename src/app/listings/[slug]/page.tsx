import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ShieldCheck, BadgeCheck } from "lucide-react";
import { SAMPLE_LISTINGS, getListingBySlug } from "@/lib/sample-data/listings";
import { RESALE_CHANNEL_LABELS } from "@/lib/types/marketplace";
import { formatDate } from "@/lib/format";
import { summarizeManifest } from "@/lib/validation/manifest.schema";
import { formatCents } from "@/lib/format";
import { getCategoryVisual } from "@/lib/category-visuals";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PricingBox } from "@/components/marketplace/pricing-box";
import { ManifestTable } from "@/components/marketplace/manifest-table";
import { CategoryIcon } from "@/components/marketplace/category-icon";
import { DetailTabs } from "./detail-tabs";

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
  return { title: listing ? (listing.isBlindListing ? listing.blindTitle : listing.title) : "Nicht gefunden" };
}

export default async function ListingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = getListingBySlug(slug);
  if (!listing) notFound();

  const visual = getCategoryVisual(listing.category);
  const Icon = visual.icon;
  const summary = summarizeManifest(listing.manifestItems);
  const overallMargin =
    summary.totalMsrpCents > 0
      ? ((summary.totalMsrpCents - summary.totalCostBasisCents) / summary.totalMsrpCents) * 100
      : null;

  const overviewTab = (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="grid grid-cols-2 gap-5 pt-5 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Artikel gesamt</p>
            <p className="font-display text-xl font-semibold tabular-nums">
              {summary.totalManifestItems.toLocaleString("de-DE")}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Positionen</p>
            <p className="font-display text-xl font-semibold tabular-nums">{listing.manifestItems.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">UVP gesamt</p>
            <p className="font-display text-xl font-semibold tabular-nums">{formatCents(summary.totalMsrpCents)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ø Marge zu UVP</p>
            <p className="font-display text-xl font-semibold tabular-nums text-success">
              {overallMargin === null ? "–" : `${overallMargin.toFixed(0)} %`}
            </p>
          </div>
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
  );

  const manifestTab = (
    <Card>
      <CardHeader>
        <CardTitle>Manifest</CardTitle>
      </CardHeader>
      <CardContent>
        <ManifestTable items={listing.manifestItems} />
      </CardContent>
    </Card>
  );

  const logisticsTab = (
    <Card>
      <CardHeader>
        <CardTitle>Abwicklung</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
        <p>Abholung ab Lager {listing.originCity} ({listing.originZip}) — Selbstabholung oder Spedition Ihrer Wahl.</p>
        <p>
          {listing.palletCount} Palette{listing.palletCount === 1 ? "" : "n"} · {listing.totalWeightKg.toLocaleString("de-DE")}
          {" "}kg Gesamtgewicht.
        </p>
        <p>Frachtberechnung und Terminbuchung folgen mit Phase 2 (Speditionsanbindung).</p>
      </CardContent>
    </Card>
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Start
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <Link href="/listings" className="hover:text-foreground">
          Marktplatz
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="text-foreground">{listing.category}</span>
      </nav>

      <div className={`flex h-32 items-center justify-center rounded-lg bg-gradient-to-br sm:h-40 ${visual.gradient}`}>
        <CategoryIcon icon={Icon} glow={visual.glow} size="lg" />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {listing.isBlindListing && <Badge variant="warning">Blind-Listing · NDA erforderlich</Badge>}
          {listing.escrowRequired && <Badge variant="success">Treuhand-Zahlung</Badge>}
          <Badge variant="outline">{listing.category}</Badge>
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {listing.isBlindListing ? listing.blindTitle : listing.title}
        </h1>
        <p className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
          <BadgeCheck className="h-4 w-4 text-success" aria-hidden="true" />
          {listing.isBlindListing ? "Verifizierter Anbieter (Firmenname nach NDA sichtbar)" : listing.seller.companyName}
          {" · "}
          {listing.seller.location}
          {" · online seit "}
          {formatDate(listing.publishedAt)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <DetailTabs
          tabs={[
            { id: "overview", label: "Übersicht", content: overviewTab },
            { id: "manifest", label: "Manifest", content: manifestTab },
            { id: "logistik", label: "Logistik", content: logisticsTab },
          ]}
        />

        <div className="flex flex-col gap-6 lg:sticky lg:top-20 lg:h-fit">
          <Card>
            <CardContent className="pt-5">
              <PricingBox listing={listing} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                So funktioniert die Treuhand-Zahlung
              </CardTitle>
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
