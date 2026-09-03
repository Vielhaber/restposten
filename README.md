# Restposten Platform

Next-generation, gated B2B clearance and liquidation marketplace for the DACH region (Austria & Germany). Unlike
legacy listing portals, this platform is a secure transaction engine: escrow-by-default payments with programmatic
dispute thresholds, brand-safe blind/NDA-gated listings with channel/geo-fencing, and structured manifest ingestion
with automated margin calculation.

## Tech stack

- **Frontend & SSR**: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend & DB**: PostgreSQL with Prisma ORM (Supabase Postgres + Row-Level Security also supported)
- **Auth & B2B verification**: NextAuth.js (Auth.js v5) + a custom VIES (EU VAT/UID) verification service
- **Payments & escrow**: Stripe Connect, manual capture, 48h delivery-inspection window
- **State & real-time**: Server Actions, TanStack Query, Pusher (Dutch Auctions)
- **Validation**: Zod schemas for all forms, APIs, and CSV/Excel manifest uploads

## Status

This repo is being built out phase by phase — see the roadmap on the home page (`src/app/page.tsx`) or below.

### Phase 1 — Architecture & Data Foundations ✅

- [`prisma/schema.prisma`](./prisma/schema.prisma) — full relational schema: `User`/`CompanyProfile` (incl. NextAuth
  adapter models, VAT/UID, KYC documents, Stripe Connect refs), `Listing` (fixed price / Dutch auction / sealed bid,
  blind/NDA gating, channel & geo-fencing restrictions), `ManifestItem`, and the `Order` → `EscrowTransaction` →
  `Dispute` chain implementing the escrow state machine, plus an append-only `AuditLog`.
- [`src/lib/validation/auth.schema.ts`](./src/lib/validation/auth.schema.ts) — B2B registration schema with strict,
  country-aware Austrian/German VAT-ID regex validation.
- [`src/lib/validation/manifest.schema.ts`](./src/lib/validation/manifest.schema.ts) — manifest upload validation:
  real EAN-13 GS1 check-digit validation, condition/quantity checks, duplicate-row detection.
- [`src/lib/services/vies.service.ts`](./src/lib/services/vies.service.ts) — server-side EU VIES VAT verification
  client (REST), with retry/backoff, a concurrency guard, and a short-TTL result cache.

**Known open item**: the exact VIES REST response field name (`valid` vs. `isValid`) could not be confirmed against
a live call while this was authored (network egress to `ec.europa.eu` was unavailable in that environment). The
service handles both defensively — see the doc comment at the top of `vies.service.ts` — but verify against VIES's
test endpoint (`check-vat-test-service`, country `DE` / vatNumber `100` is a documented always-valid fixture) before
relying on it in production.

### Phase 2 — Core Business Logic & State Machines (next)

- Dutch Auction price-decay algorithm
- Stripe Connect escrow: PaymentIntent + manual capture + 48h automatic payout webhook
- Pallet freight calculation service (postal-code matrix, weight/loading meters)

### Phase 3 — Interactive UI & Component Engineering (planned)

- Gated listing feed with live Brand Shield toggle (blurred brand badges, gated NDA view)
- Interactive manifest spreadsheet viewer with live ROI/gross-margin calculator
- Checkout flow with pallet freight selection and escrow badge

### Phase 4 — Dispute & Admin Clearing Engine (planned)

- Automated 3%-margin dispute clearing logic
- Admin dashboard for KYC approval and dispute arbitration

## Getting started

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL at minimum to run Prisma commands
npx prisma generate
npx prisma db push     # or: npm run db:migrate, once you want tracked migrations
npm run dev
```

Optional: run the validation-schema smoke test (no database needed):

```bash
npm run smoke:validation
```

### shadcn/ui components

`components.json` is already configured (New York style, CSS variables, Lucide icons). Network access to
`ui.shadcn.com` was not available in the environment this scaffold was built in, so no components have been added
yet — once you have a normal internet connection, add what you need with:

```bash
npx shadcn@latest add button card dialog form input
```

## Environment variables

See [`.env.example`](./.env.example) for the full list (database, NextAuth, VIES, Stripe Connect, Pusher).

## Project structure

```
prisma/schema.prisma           Data model (Phase 1)
src/lib/validation/            Zod schemas (Phase 1: auth, manifest)
src/lib/services/              Server-side services (Phase 1: VIES; Phase 2 adds Stripe/freight)
src/app/                       Next.js App Router pages
src/components/ui/             shadcn/ui components (empty until you add some — see above)
```
