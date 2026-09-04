import { ShieldCheck } from "lucide-react";
import { SAMPLE_LISTINGS } from "@/lib/sample-data/listings";
import { computeGrossMarginPercent } from "@/lib/validation/manifest.schema";
import { formatCents } from "@/lib/format";
import { getCategoryVisual } from "@/lib/category-visuals";
import { Badge } from "@/components/ui/badge";

/**
 * Decorative hero visual — a layered "product preview" (manifest snippet
 * behind, listing summary in front) instead of a stock illustration. Built
 * from the same real sample-listing data the feed uses, just laid out
 * decoratively (not a live ListingCard: no link, no interaction) so the
 * numbers on screen are never fabricated, only staged.
 */
export function HeroPreview() {
  const listing = SAMPLE_LISTINGS[0];
  const visual = getCategoryVisual(listing.category);
  const Icon = visual.icon;
  const topItems = listing.manifestItems.slice(0, 3);

  return (
    <div className="relative hidden h-[420px] w-full lg:block" aria-hidden="true">
      <div className="absolute left-0 top-6 w-72 -rotate-6 rounded-xl border border-border bg-card p-4 shadow-xl">
        <p className="text-xs font-medium text-muted-foreground">Manifest · {listing.category}</p>
        <div className="mt-3 flex flex-col gap-2.5">
          {topItems.map((item) => {
            const margin = computeGrossMarginPercent(item);
            return (
              <div key={item.ean} className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate font-mono text-[10px] text-muted-foreground">{item.ean}</span>
                <span className="font-medium tabular-nums text-success">
                  {margin === null ? "–" : `${margin.toFixed(0)} %`}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3 w-3 text-primary" />
          EAN-13 geprüft
        </div>
      </div>

      <div className="absolute right-0 top-24 w-80 rotate-3 rounded-xl border border-border bg-card p-5 shadow-2xl">
        <div className={`-mx-5 -mt-5 mb-4 flex h-20 items-center justify-center rounded-t-xl bg-gradient-to-br ${visual.gradient}`}>
          <Icon className="h-8 w-8 text-foreground/50" />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="warning" className="text-[10px]">
            Blind-Listing · NDA
          </Badge>
        </div>
        <p className="mt-2 font-display text-sm font-semibold leading-snug text-balance">{listing.blindTitle}</p>
        <p className="mt-1 text-xs text-muted-foreground">{listing.seller.location}</p>
        <div className="mt-4 flex items-end justify-between border-t border-border pt-4">
          <div>
            <p className="text-[10px] text-muted-foreground">Aktueller Preis</p>
            <p className="font-display text-xl font-semibold tabular-nums">{formatCents(listing.currentPriceCents!)}</p>
          </div>
          <span className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
            Jetzt zuschlagen
          </span>
        </div>
      </div>
    </div>
  );
}
