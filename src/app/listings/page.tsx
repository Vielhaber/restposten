import type { Metadata } from "next";
import { SAMPLE_LISTINGS } from "@/lib/sample-data/listings";
import { ListingsExplorer } from "./listings-explorer";

export const metadata: Metadata = {
  title: "Marktplatz",
};

export default function ListingsPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Marktplatz</h1>
        <p className="max-w-2xl text-muted-foreground">
          Geprüfte B2B-Restposten aus Rücknahmen, Überproduktion und Retouren. Jede Zahlung läuft über Treuhand — die
          Freigabe an den Verkäufer erfolgt erst nach der 48-Stunden-Prüffrist.
        </p>
        <p className="text-xs text-muted-foreground">
          Beispieldaten zur Ansicht — echte Angebote folgen mit Phase 2 (Datenbank- &amp; Zahlungsanbindung).
        </p>
      </div>

      <ListingsExplorer listings={SAMPLE_LISTINGS} />
    </main>
  );
}
