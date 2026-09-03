import Link from "next/link";
import { Boxes } from "lucide-react";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Plattform",
    links: [
      { label: "Marktplatz", href: "/listings" },
      { label: "Restposten verkaufen", href: "/sell/new" },
    ],
  },
  {
    title: "Vertrauen & Sicherheit",
    links: [
      { label: "So funktioniert Treuhand", href: "/#treuhand" },
      { label: "Firmenverifizierung (VIES)", href: "/#verifizierung" },
    ],
  },
  {
    title: "Unternehmen",
    links: [
      { label: "Über uns", href: "/#ueber-uns" },
      { label: "Kontakt", href: "/#kontakt" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 flex flex-col gap-3 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-display text-base font-semibold tracking-tight">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Boxes className="h-4 w-4" aria-hidden="true" />
              </span>
              Restposten
            </Link>
            <p className="max-w-[26ch] text-sm text-muted-foreground">
              Der gated B2B-Marktplatz für Restposten in Österreich &amp; Deutschland.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title} className="flex flex-col gap-3">
              <p className="text-sm font-medium">{col.title}</p>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Restposten Platform · Prototyp, gebaut phasenweise auf Next.js.</p>
          <p>Alle Angebote auf dieser Seite sind Beispieldaten zur Ansicht.</p>
        </div>
      </div>
    </footer>
  );
}
