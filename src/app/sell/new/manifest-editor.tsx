"use client";

import { useMemo, useRef, useState } from "react";
import { FileUp, Download, CircleCheck, CircleAlert } from "lucide-react";
import { manifestItemSchema, eanSchema, summarizeManifest, computeGrossMarginPercent } from "@/lib/validation/manifest.schema";
import type { ItemCondition } from "@/lib/validation/manifest.schema";
import { CONDITION_LABELS } from "@/lib/types/marketplace";
import { formatCents } from "@/lib/format";
import { parseEuroToCents } from "@/lib/currency";
import { parseCsv, normalizeHeaderCell, normalizeConditionCell } from "@/lib/csv";
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

function isBlankRow(row: DraftRow): boolean {
  return row.ean.trim() === "" && row.title.trim() === "";
}

type RowResult =
  | { row: DraftRow; ok: true; item: ReturnType<typeof manifestItemSchema.parse> }
  | { row: DraftRow; ok: false; errors: string[] };

function validateRow(row: DraftRow): RowResult {
  const errors: string[] = [];

  if (isBlankRow(row)) {
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

const CSV_TEMPLATE = `ean,title,condition,quantity,msrp_eur,cost_basis_eur
4006381333931,True-Wireless In-Ear Kopfhoerer,B_GRADE_RETURN,120,79.99,18.00
4023124500122,Bluetooth-Lautsprecher 20W,A_GRADE,60,49.99,12.00
`;

function downloadCsvTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "manifest-vorlage.csv";
  link.click();
  URL.revokeObjectURL(url);
}

/** Parses a CSV file's text into DraftRows. Unknown/missing columns are simply left blank on the row — the existing per-row Zod validation then explains exactly what's missing, the same way a hand-typed row would. */
function parseManifestCsv(text: string): DraftRow[] {
  const table = parseCsv(text);
  if (table.length === 0) return [];

  const [headerRow, ...dataRows] = table;
  const columnMap = headerRow.map((cell) => normalizeHeaderCell(cell));

  return dataRows
    .filter((cells) => cells.some((cell) => cell.trim() !== ""))
    .map((cells) => {
      const draft = newRow();
      cells.forEach((cell, i) => {
        const field = columnMap[i];
        const value = cell.trim();
        if (!field || value === "") return;
        switch (field) {
          case "ean":
            draft.ean = value;
            break;
          case "title":
            draft.title = value;
            break;
          case "condition":
            draft.condition = normalizeConditionCell(value);
            break;
          case "quantity":
            draft.quantity = value;
            break;
          case "msrpEuro":
            draft.msrpEuro = value;
            break;
          case "costBasisEuro":
            draft.costBasisEuro = value;
            break;
        }
      });
      return draft;
    });
}

export function ManifestEditor() {
  const [rows, setRows] = useState<DraftRow[]>([newRow(), newRow()]);
  const [submitted, setSubmitted] = useState(false);
  const [importNotice, setImportNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function handleCsvFile(file: File) {
    try {
      const text = await file.text();
      const imported = parseManifestCsv(text);
      if (imported.length === 0) {
        setImportNotice({ kind: "error", text: `„${file.name}" enthält keine erkennbaren Datenzeilen.` });
        return;
      }
      setRows((prev) => {
        const keep = prev.filter((row) => !isBlankRow(row));
        return [...keep, ...imported];
      });
      const validCount = imported.map(validateRow).filter((r) => r.ok).length;
      setImportNotice({
        kind: validCount === imported.length ? "success" : "error",
        text:
          validCount === imported.length
            ? `${imported.length} Zeile${imported.length === 1 ? "" : "n"} aus „${file.name}" importiert — alle gültig.`
            : `${imported.length} Zeile${imported.length === 1 ? "" : "n"} aus „${file.name}" importiert, ${imported.length - validCount} mit Fehlern — siehe Tabelle unten.`,
      });
    } catch {
      setImportNotice({ kind: "error", text: `„${file.name}" konnte nicht gelesen werden — ist es eine gültige CSV-Datei?` });
    }
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
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border bg-secondary/30 p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleCsvFile(file);
            e.target.value = "";
          }}
        />
        <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
          <FileUp className="h-3.5 w-3.5" aria-hidden="true" />
          CSV importieren
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={downloadCsvTemplate}>
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          Vorlage herunterladen
        </Button>
        <p className="ml-1 text-xs text-muted-foreground">
          Spalten: ean, title, condition, quantity, msrp_eur, cost_basis_eur — Komma oder Semikolon getrennt, Zeilen
          werden unten sofort geprüft.
        </p>
      </div>

      {importNotice && (
        <div
          className={cn(
            "flex items-start gap-2 rounded-md border px-3 py-2 text-sm",
            importNotice.kind === "success" ? "border-success/30 bg-success/10 text-success" : "border-warning/40 bg-warning/15 text-warning-foreground",
          )}
        >
          {importNotice.kind === "success" ? (
            <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <span>{importNotice.text}</span>
        </div>
      )}

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
