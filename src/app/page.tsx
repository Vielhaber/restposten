import Link from "next/link";
import {
  ShieldCheck,
  FileCheck2,
  EyeOff,
  MapPinned,
  ArrowRight,
  Gavel,
  Timer,
  ScanBarcode,
  Store,
  PackageOpen,
  Mail,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ListingCard } from "@/components/marketplace/listing-card";
import { SAMPLE_LISTINGS } from "@/lib/sample-data/listings";

const STATS = [
  { value: "AT & DE", label: "Gated für den DACH-Raum" },
  { value: "48 Std.", label: "Prüffrist vor Zahlungsfreigabe" },
  { value: "3", label: "Preismodelle: Fest, Dutch Auction, verdecktes Gebot" },
  { value: "13-stellig", label: "EAN-Prüfziffer je Manifest-Position" },
];

const ESCROW_STEPS = [
  {
    step: "1",
    title: "Kauf & Autorisierung",
    body: "Die Zahlung wird bei Kauf autorisiert und treuhänderisch gehalten — der Verkäufer erhält noch nichts.",
    icon: ShieldCheck,
  },
  {
    step: "2",
    title: "Lieferung & Prüffrist",
    body: "Nach Zustellung startet eine 48-Stunden-Frist, in der die Ware mit dem Manifest abgeglichen wird.",
    icon: Timer,
  },
  {
    step: "3",
    title: "Freigabe oder Streitfall",
    body: "Ohne Beanstandung wird automatisch freigegeben. Ab 3 % Abweichung vom Manifest kann ein Streitfall eröffnet werden.",
    icon: Gavel,
  },
];

const FEATURES = [
  {
    icon: EyeOff,
    title: "Blind-Listings mit NDA",
    body: "Markenware kann anonymisiert gelistet werden — der Firmenname wird erst nach Unterzeichnung einer NDA sichtbar.",
  },
  {
    icon: FileCheck2,
    title: "VIES-verifizierte Firmen",
    id: "verifizierung",
    body: "Jede Firma wird gegen die EU-VIES-Datenbank auf eine gültige USt-IdNr. geprüft, bevor sie kaufen oder verkaufen darf.",
  },
  {
    icon: ScanBarcode,
    title: "Geprüfte Manifeste",
    body: "Jede EAN wird gegen die GS1-Prüfziffer validiert — Tippfehler oder falsch abgetippte Barcodes fallen sofort auf.",
  },
  {
    icon: MapPinned,
    title: "Kanal- & Gebietssperren",
    body: "Verkäufer legen fest, wo die Ware nicht weiterverkauft werden darf — z. B. kein Amazon-Listing oder kein Export außerhalb der EU.",
  },
];

export default function Home() {
  return (
    <>
      <section className="brand-mesh border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-20 sm:py-28">
          <div className="flex max-w-2xl flex-col gap-6">
            <Badge variant="gold" className="w-fit">
              Jetzt in der Beta für Österreich &amp; Deutschland
            </Badge>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Restposten handeln, ohne das Risiko zu kaufen.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground text-balance">
              Der gated B2B-Marktplatz für Retouren, Überproduktion und Lagerräumung — mit Treuhand-Zahlung,
              verifizierten Firmen und geprüften Manifesten statt vager Palettenfotos.
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              <Link href="/listings" className={buttonVariants({ variant: "default", size: "xl" })}>
                Marktplatz ansehen
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/sell/new" className={buttonVariants({ variant: "outline", size: "xl" })}>
                Restposten verkaufen
              </Link>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-6 border-t border-border pt-8 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <dt className="font-display text-2xl font-semibold tabular-nums sm:text-3xl">{stat.value}</dt>
                <dd className="text-sm text-muted-foreground">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="treuhand" className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-20">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="text-sm font-medium text-primary">Treuhand-Zahlung</p>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Kein Geld fließt, bevor die Ware geprüft wurde.
            </h2>
            <p className="text-muted-foreground">
              Statt Vorkasse an eine unbekannte Firma zu überweisen, läuft jede Zahlung über ein Treuhandkonto — genau
              hier liegt der Unterschied zu klassischen Restposten-Börsen.
            </p>
          </div>

          <ol className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {ESCROW_STEPS.map((item) => (
              <li key={item.step}>
                <Card className="h-full">
                  <CardContent className="flex flex-col gap-3 pt-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <item.icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="font-display text-sm font-medium text-muted-foreground">Schritt {item.step}</span>
                    </div>
                    <h3 className="font-display font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.body}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-border bg-secondary/30">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-20">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="text-sm font-medium text-primary">Vertrauensmechanik</p>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Vier eingebaute Kontrollen, keine Nachverhandlung nötig.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <Card key={feature.title} id={feature.id} className="h-full">
                <CardContent className="flex gap-4 pt-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-display font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.body}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex max-w-xl flex-col gap-3">
              <p className="text-sm font-medium text-primary">Aktuelle Lots</p>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                Ein Blick auf den Marktplatz
              </h2>
            </div>
            <Link href="/listings" className={buttonVariants({ variant: "outline" })}>
              Alle Angebote ansehen
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SAMPLE_LISTINGS.slice(0, 3).map((listing) => (
              <ListingCard key={listing.slug} listing={listing} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Beispieldaten zur Ansicht — echte Angebote folgen mit Phase 2 (Datenbank- &amp; Zahlungsanbindung).
          </p>
        </div>
      </section>

      <section id="ueber-uns" className="border-b border-border bg-secondary/30">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-6 py-20 sm:grid-cols-2">
          <Card>
            <CardContent className="flex h-full flex-col gap-4 pt-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <PackageOpen className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="font-display text-lg font-semibold">Für Verkäufer</h3>
              <p className="text-sm text-muted-foreground">
                Retouren, Überproduktion oder auslaufende Ware als geprüftes Manifest einstellen — per Hand oder als
                CSV-Import — und per Festpreis, Dutch Auction oder verdecktem Gebot verkaufen, ohne den eigenen
                Firmennamen preiszugeben.
              </p>
              <Link href="/sell/new" className={`${buttonVariants({ variant: "default" })} mt-auto w-fit`}>
                Restposten hochladen
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex h-full flex-col gap-4 pt-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Store className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="font-display text-lg font-semibold">Für Händler</h3>
              <p className="text-sm text-muted-foreground">
                Lots nach Kategorie, Zustand und Preismodell filtern, das komplette Manifest inklusive Marge pro
                Position einsehen, bevor Sie kaufen — abgesichert durch die 48-Stunden-Treuhandfrist.
              </p>
              <Link href="/listings" className={`${buttonVariants({ variant: "default" })} mt-auto w-fit`}>
                Marktplatz durchsuchen
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="kontakt" className="mx-auto flex w-full max-w-6xl flex-col items-start gap-4 px-6 py-20 sm:items-center sm:text-center">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          Fragen zur Plattform?
        </h2>
        <p className="max-w-xl text-muted-foreground">
          Schreiben Sie uns — wir antworten in der Regel innerhalb eines Werktags.
        </p>
        <a href="mailto:kontakt@restposten.example" className={buttonVariants({ variant: "outline" })}>
          <Mail className="h-4 w-4" aria-hidden="true" />
          kontakt@restposten.example
        </a>
      </section>
    </>
  );
}
