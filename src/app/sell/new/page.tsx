import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ManifestEditor } from "./manifest-editor";

export const metadata: Metadata = {
  title: "Restposten hochladen — Restposten Platform",
};

export default function NewListingPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Restposten hochladen</h1>
        <p className="max-w-2xl text-muted-foreground">
          Lot-Grunddaten festlegen und das Manifest erfassen — UVP, Einkaufswert und Marge werden je Zeile und in
          Summe live berechnet, genau wie bei der echten Prüfung durch unser System.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lot-Grunddaten</CardTitle>
          <CardDescription>Diese Felder sind eine Vorschau — die Anbindung an die Datenbank folgt in Phase 2.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-muted-foreground">Titel</span>
            <input
              className="rounded border border-input bg-transparent px-3 py-2"
              placeholder="z. B. Retouren-Palette Kleingeräte"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-muted-foreground">Kategorie</span>
            <input className="rounded border border-input bg-transparent px-3 py-2" placeholder="z. B. Elektronik" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-muted-foreground">Preismodus</span>
            <select className="rounded border border-input bg-transparent px-3 py-2" defaultValue="FIXED_PRICE">
              <option value="FIXED_PRICE">Festpreis</option>
              <option value="DUTCH_AUCTION">Dutch Auction</option>
              <option value="SEALED_BID">Verdecktes Gebot</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-muted-foreground">Abhol-PLZ &amp; Ort</span>
            <input className="rounded border border-input bg-transparent px-3 py-2" placeholder="z. B. 90411 Nürnberg" />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manifest</CardTitle>
          <CardDescription>
            EAN wird auf gültige EAN-13-Prüfziffer geprüft (dieselbe Validierung wie im CSV-Import).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ManifestEditor />
        </CardContent>
      </Card>
    </main>
  );
}
