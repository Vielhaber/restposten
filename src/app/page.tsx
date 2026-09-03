const PHASES = [
  {
    title: "Phase 1 — Architecture & Data Foundations",
    status: "done" as const,
    items: [
      "prisma/schema.prisma — full relational data model",
      "src/lib/validation/auth.schema.ts — B2B registration + strict AT/DE VAT-ID validation",
      "src/lib/validation/manifest.schema.ts — manifest upload validation (EAN-13 checksum, conditions, quantities)",
      "src/lib/services/vies.service.ts — EU VIES VAT verification client",
    ],
  },
  {
    title: "Phase 2 — Core Business Logic & State Machines",
    status: "next" as const,
    items: [
      "Dutch Auction price-decay algorithm",
      "Stripe Connect escrow PaymentIntent + manual capture + 48h auto-payout webhook",
      "Pallet freight calculation service",
    ],
  },
  {
    title: "Phase 3 — Interactive UI & Component Engineering",
    status: "planned" as const,
    items: [
      "Gated listing feed with Brand Shield / NDA gating",
      "Interactive manifest spreadsheet viewer with live ROI/margin calculator",
      "Checkout flow with pallet freight selection and escrow badge",
    ],
  },
  {
    title: "Phase 4 — Dispute & Admin Clearing Engine",
    status: "planned" as const,
    items: ["Automated 3%-margin dispute clearing logic", "Admin KYC + dispute arbitration dashboard"],
  },
];

const STATUS_LABEL: Record<(typeof PHASES)[number]["status"], string> = {
  done: "Done",
  next: "Up next",
  planned: "Planned",
};

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">DACH B2B Clearance &amp; Liquidation Marketplace</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Restposten Platform</h1>
        <p className="max-w-xl text-foreground/80">
          A gated B2B pallet/lot marketplace built on escrow-by-default payments, brand-safe blind listings, and
          structured manifest ingestion. This repository is being built out phase by phase.
        </p>
      </header>

      <ol className="flex flex-col gap-6">
        {PHASES.map((phase) => (
          <li key={phase.title} className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between gap-4">
              <h2 className="font-medium text-card-foreground">{phase.title}</h2>
              <span
                className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
                style={{
                  background: phase.status === "done" ? "var(--success)" : "var(--secondary)",
                  color: phase.status === "done" ? "var(--success-foreground)" : "var(--secondary-foreground)",
                }}
              >
                {STATUS_LABEL[phase.status]}
              </span>
            </div>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {phase.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <footer className="text-xs text-muted-foreground">
        See <code>README.md</code> for setup instructions.
      </footer>
    </main>
  );
}
