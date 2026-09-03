"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import type { SampleListing } from "@/lib/types/marketplace";
import { getEffectivePriceCents } from "@/lib/listing-price";
import { ListingCard } from "@/components/marketplace/listing-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PRICING_MODE_LABEL: Record<SampleListing["pricingMode"], string> = {
  FIXED_PRICE: "Festpreis",
  DUTCH_AUCTION: "Dutch Auction",
  SEALED_BID: "Verdecktes Gebot",
};

type SortKey = "newest" | "price-asc" | "price-desc";

const SORT_LABEL: Record<SortKey, string> = {
  newest: "Neueste zuerst",
  "price-asc": "Preis aufsteigend",
  "price-desc": "Preis absteigend",
};

export function ListingsExplorer({ listings }: { listings: SampleListing[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [pricingMode, setPricingMode] = useState<SampleListing["pricingMode"] | "all">("all");
  const [sort, setSort] = useState<SortKey>("newest");

  const categories = useMemo(() => [...new Set(listings.map((l) => l.category))].sort(), [listings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = listings.filter((listing) => {
      if (category !== "all" && listing.category !== category) return false;
      if (pricingMode !== "all" && listing.pricingMode !== pricingMode) return false;
      if (q === "") return true;
      const haystack = `${listing.isBlindListing ? listing.blindTitle : listing.title} ${listing.seller.companyName} ${listing.category}`.toLowerCase();
      return haystack.includes(q);
    });

    result = [...result].sort((a, b) => {
      if (sort === "newest") return b.publishedAt.localeCompare(a.publishedAt);
      const priceDiff = getEffectivePriceCents(a) - getEffectivePriceCents(b);
      return sort === "price-asc" ? priceDiff : -priceDiff;
    });

    return result;
  }, [listings, query, category, pricingMode, sort]);

  const activeFilterCount = (category !== "all" ? 1 : 0) + (pricingMode !== "all" ? 1 : 0) + (query.trim() !== "" ? 1 : 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative flex-1 sm:min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Titel, Kategorie oder Anbieter suchen…"
            aria-label="Marktplatz durchsuchen"
            className="w-full rounded-md border border-input bg-transparent py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Nach Kategorie filtern"
          className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
        >
          <option value="all">Alle Kategorien</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={pricingMode}
          onChange={(e) => setPricingMode(e.target.value as SampleListing["pricingMode"] | "all")}
          aria-label="Nach Preismodell filtern"
          className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
        >
          <option value="all">Alle Preismodelle</option>
          {(Object.entries(PRICING_MODE_LABEL) as [SampleListing["pricingMode"], string][]).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="Sortierung"
          className="rounded-md border border-input bg-transparent px-3 py-2 text-sm sm:ml-auto"
        >
          {(Object.entries(SORT_LABEL) as [SortKey, string][]).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
        <span>
          {filtered.length} von {listings.length} Angeboten
        </span>
        {activeFilterCount > 0 && (
          <Badge variant="outline" className="ml-1">
            {activeFilterCount} Filter aktiv
          </Badge>
        )}
      </div>

      {filtered.length > 0 ? (
        <div className={cn("grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3")}>
          {filtered.map((listing) => (
            <ListingCard key={listing.slug} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
          <p className="font-medium">Keine Angebote gefunden</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Passen Sie Suche oder Filter an — aktuell gibt es keine Lots, die auf alle Kriterien zutreffen.
          </p>
        </div>
      )}
    </div>
  );
}
