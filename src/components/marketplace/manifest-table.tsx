import type { SampleManifestItem } from "@/lib/types/marketplace";
import { CONDITION_LABELS } from "@/lib/types/marketplace";
import { computeGrossMarginPercent, summarizeManifest } from "@/lib/validation/manifest.schema";
import { formatCents } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Full manifest line-item table with a live-computed margin column and a totals row — used on the listing detail page and, in read-only preview, in the seller upload flow. */
export function ManifestTable({ items }: { items: SampleManifestItem[] }) {
  const totals = summarizeManifest(items);

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
            <th className="px-3 py-2 font-medium">EAN</th>
            <th className="px-3 py-2 font-medium">Artikel</th>
            <th className="px-3 py-2 font-medium">Zustand</th>
            <th className="px-3 py-2 text-right font-medium">Menge</th>
            <th className="px-3 py-2 text-right font-medium">UVP</th>
            <th className="px-3 py-2 text-right font-medium">Einkaufswert</th>
            <th className="px-3 py-2 text-right font-medium">Marge</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const margin = computeGrossMarginPercent(item);
            return (
              <tr key={item.ean} className="border-b border-border last:border-0">
                <td className="px-3 py-2 font-mono text-xs tabular-nums text-muted-foreground">{item.ean}</td>
                <td className="px-3 py-2">{item.title}</td>
                <td className="px-3 py-2 text-muted-foreground">{CONDITION_LABELS[item.condition]}</td>
                <td className="px-3 py-2 text-right tabular-nums">{item.quantity.toLocaleString("de-DE")}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCents(item.msrpCents)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCents(item.costBasisCents)}</td>
                <td
                  className={cn(
                    "px-3 py-2 text-right font-medium tabular-nums",
                    margin !== null && margin >= 60 ? "text-success" : "text-foreground",
                  )}
                >
                  {margin === null ? "–" : `${margin.toFixed(0)} %`}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-muted/50 font-medium">
            <td className="px-3 py-2" colSpan={3}>
              Gesamt ({items.length} Positionen)
            </td>
            <td className="px-3 py-2 text-right tabular-nums">{totals.totalManifestItems.toLocaleString("de-DE")}</td>
            <td className="px-3 py-2 text-right tabular-nums">{formatCents(totals.totalMsrpCents)}</td>
            <td className="px-3 py-2 text-right tabular-nums">{formatCents(totals.totalCostBasisCents)}</td>
            <td className="px-3 py-2 text-right tabular-nums">
              {totals.totalMsrpCents > 0
                ? `${(((totals.totalMsrpCents - totals.totalCostBasisCents) / totals.totalMsrpCents) * 100).toFixed(0)} %`
                : "–"}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
