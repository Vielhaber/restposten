"use client";

import { useMemo, useState } from "react";
import { manifestItemSchema, eanSchema, summarizeManifest, computeGrossMarginPercent } from "@/lib/validation/manifest.schema";
import type { ItemCondition } from "@/lib/validation/manifest.schema";
import { CONDITION_LABELS } from "@/lib/types/marketplace";
import { formatCents } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DraftRow {
  id: string;
  ean: string;
  title: string;
  condition: ItemCondition;
  quantity: string;
  msrpEuro: string;
  costBasisEuro: string;
}

function newRow(): DraftRow {
  return {
    id: typeof crypto !== "undefined" ? crypto.randomUUID() : String(Math.random()),
    ean: "",
    title: "",
    condition: "A_GRADE",
    quantity: "",
    msrpEuro: "",
    costBasisEuro: "",
  };
}

function parseEuroToCents(raw: string): number | null {
  const cleaned = raw.trim().replace(",", ".");
  if (cleaned === "") return null;
  const value = Number(cleaned);
  if (Number.isNaN(value) || value < 0) return null;
  return Math.round(value * 100);
}

type RowResult =
  | { row: DraftRow; ok: true; item: ReturnType<typeof manifestItemSchema.parse> }
  | { row: DraftRow; ok: false; errors: string[] };

function validateRow(row: DraftRow): RowResult {
  const errors: string[] = [];

  if (row.ean.trim() === "" && row.title.trim() === "") {
    // Blank scratch row — don't nag the seller before they've typed anything.
    return { row, ok: false, errors: [] };
  }

  const eanResult = eanSchema.safeParse(row.ean);
  if (!eanResult.success) errors.push(eanResult.error.issues[0]?.message ?? "EAN ungültig");

  if (row.title.trim().length < 2) errors.push("Artikelbezeichnung fehlt");

  const quantity = Number(row.quantity);
  if (!Number.isInteger(quantity) || quantity <= 0) errors.push("Menge muss eine positive Ganzzahl sein");

  const msrpCents = parseEuroToCents(row.msrpEuro || "0");
  const costBasisCents = parseEuroToCents(row.costBasisEuro || "0");
  if (msrpCents === null) errors.push("UVP ungültig");
  if (costBasisCents === null) errors.push("Einkaufswert ungültig");

  if (errors.length > 0) return { row, ok: false, errors };

  const candidate = {
    ean: eanResult.data,
    title: row.title.trim(),
    condition: row.condition,
    quantity,
    msrpCents: msrpCents!,
    costBasisCents: costBasisCents!,
  };

  const parsed = manifestItemSchema.safeParse(candidate);
  if (!parsed.success) {
    return { row, ok: false, errors: parsed.error.issues.map((issue) => issue.message) };
  }
  return { row, ok: true, item: parsed.data };
}

export function ManifestEditor() {
  const [rows, setRows] = useState<DraftRow[]>([newRow(), newRow()]);
  const [submitted, setSubmitted] = useState(false);

  const results = useMemo(() => rows.map(validateRow), [rows]);
  const validItems = useMemo(
    () => results.filter((r): r is Extract<RowResult, { ok: true }> => r.ok).map((r) => r.item),
    [results],
  );
  const summary = summarizeManifest(validItems);
  const overallMargin =
    summary.totalMsrpCents > 0
      ? ((summary.totalMsrpCents - summary.totalCostBasisCents) / summary.totalMsrpCents) * 100
      : null;

  function updateRow(id: string, patch: Partial<DraftRow>) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function removeRow(id: string) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.id !== id)));
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-success/40 bg-success/10 p-6 text-sm">
        <p className="font-medium text-success">Manifest übernommen (Demo)</p>
        <p className="mt-1 text-muted-foreground">
          {validItems.length} gültige Position{validItems.length === 1 ? "" : "en"} · {summary.totalManifestItems.toLocaleString("de-DE")}{" "}
          Artikel · Gesamt-UVP {formatCents(summary.totalMsrpCents)}. In Phase 2 landet dieses Manifest per Server
          Action in der Datenbank — hier endet die Vorschau.
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => setSubmitted(false)}>
          Zurück zur Bearbeitung
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium">EAN</th>
              <th className="px-3 py-2 font-medium">Artikel</th>
              <th className="px-3 py-2 font-medium">Zustand</th>
              <th className="px-3 py-2 font-medium">Menge</th>
              <th className="px-3 py-2 font-medium">UVP (€)</th>
              <th className="px-3 py-2 font-medium">Einkaufswert (€)</th>
              <th className="px-3 py-2 font-medium">Marge</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {results.map((result) => {
              const { row } = result;
              const margin = result.ok ? computeGrossMarginPercent(result.item) : null;
              const errors: string[] = result.ok ? [] : result.errors;
              return (
                <tr key={row.id} className="border-b border-border align-top last:border-0">
                  <td className="px-2 py-2">
                    <input
                      value={row.ean}
                      onChange={(e) => updateRow(row.id, { ean: e.target.value })}
                      placeholder="4006381333931"
                      className="w-32 rounded border border-input bg-transparent px-2 py-1 font-mono text-xs"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={row.title}
                      onChange={(e) => updateRow(row.id, { title: e.target.value })}
                      placeholder="Artikelbezeichnung"
                      className="w-full min-w-[160px] rounded border border-input bg-transparent px-2 py-1"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <select
                      value={row.condition}
                      onChange={(e) => updateRow(row.id, { condition: e.target.value as ItemCondition })}
                      className="rounded border border-input bg-transparent px-2 py-1"
                    >
                      {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={row.quantity}
                      onChange={(e) => updateRow(row.id, { quantity: e.target.value })}
                      placeholder="0"
                      inputMode="numeric"
                      className="w-20 rounded border border-input bg-transparent px-2 py-1 text-right tabular-nums"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={row.msrpEuro}
                      onChange={(e) => updateRow(row.id, { msrpEuro: e.target.value })}
                      placeholder="0,00"
                      inputMode="decimal"
                      className="w-24 rounded border border-input bg-transparent px-2 py-1 text-right tabular-nums"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={row.costBasisEuro}
                      onChange={(e) => updateRow(row.id, { costBasisEuro: e.target.value })}
                      placeholder="0,00"
                      inputMode="decimal"
                      className="w-24 rounded border border-input bg-transparent px-2 py-1 text-right tabular-nums"
                    />
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{margin === null ? "–" : `${margin.toFixed(0)} %`}</td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="text-xs text-muted-foreground hover:text-destructive"
                      aria-label="Zeile entfernen"
                    >
                      Entfernen
                    </button>
                    {errors.length > 0 && (
                      <ul className="mt-1 max-w-[180px] text-[11px] text-destructive">
                        {errors.map((e) => (
                          <li key={e}>{e}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setRows((prev) => [...prev, newRow()])}>
        + Zeile hinzufügen
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-muted/40 px-5 py-4">
        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Gültige Positionen</p>
            <p className="font-medium tabular-nums">{validItems.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Artikel gesamt</p>
            <p className="font-medium tabular-nums">{summary.totalManifestItems.toLocaleString("de-DE")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">UVP gesamt</p>
            <p className="font-medium tabular-nums">{formatCents(summary.totalMsrpCents)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ø Marge</p>
            <p className={cn("font-medium tabular-nums", overallMargin !== null && overallMargin >= 60 && "text-success")}>
              {overallMargin === null ? "–" : `${overallMargin.toFixed(0)} %`}
            </p>
          </div>
        </div>
        <Badge variant={validItems.length > 0 ? "success" : "outline"}>
          {validItems.length > 0 ? "Bereit zum Einreichen" : "Noch keine gültige Position"}
        </Badge>
      </div>

      <Button type="button" disabled={validItems.length === 0} onClick={() => setSubmitted(true)} className="w-fit self-end">
        Manifest übernehmen
      </Button>
    </div>
  );
}
