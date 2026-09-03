/**
 * EU VIES (VAT Information Exchange System) verification service.
 *
 * Used during B2B onboarding to confirm a submitted VAT ID is currently
 * registered and active with the relevant member state's tax authority,
 * before flipping `CompanyProfile.verificationStatus` from PENDING towards
 * VERIFIED (a human still reviews KYC documents; VIES only clears the tax-ID
 * check).
 *
 * --- On the API surface used here --------------------------------------
 * The EU Commission's legacy SOAP service (checkVatService) is being
 * phased out in favor of a REST facade documented at
 * https://ec.europa.eu/taxation_customs/vies/#/technical-information, with
 * the OpenAPI/Swagger contract published at
 * https://ec.europa.eu/assets/taxud/vow-information/swagger_publicVAT.yaml.
 * Egress to ec.europa.eu was not reachable from the environment this file
 * was authored in, so the exact response field names below (`valid` vs.
 * `isValid`, presence of `userError`) could not be confirmed against a live
 * call — they are taken from published SDK documentation and are handled
 * defensively (see `parseCheckVatResponse`). BEFORE shipping this to
 * production: hit the test service
 * (`check-vat-test-service`, country "DE"/vatNumber "100" is documented as
 * an always-valid test fixture) and diff the real payload against
 * `RawCheckVatResponse` below; adjust the parser if field names differ.
 * -------------------------------------------------------------------------
 */

import { splitVatId, type SupportedVatCountryCode } from "../validation/auth.schema";

// ----------------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------------

const VIES_BASE_URL =
  process.env.VIES_API_BASE_URL ?? "https://ec.europa.eu/taxation_customs/vies/rest-api";

/** Use the EU-provided test fixture endpoint instead of the production one. */
const USE_TEST_SERVICE = process.env.VIES_USE_TEST_SERVICE === "true";

const CHECK_VAT_PATH = USE_TEST_SERVICE ? "check-vat-test-service" : "check-vat-number";

const REQUEST_TIMEOUT_MS = Number(process.env.VIES_REQUEST_TIMEOUT_MS ?? 10_000);
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 500;

/** VIES enforces per-IP and global concurrency caps; cap our own concurrency client-side rather than discovering the limit via 429s in production. */
const MAX_CONCURRENT_REQUESTS = Number(process.env.VIES_MAX_CONCURRENT_REQUESTS ?? 4);

/**
 * Successful checks are cached briefly. This is a correctness/politeness
 * measure (avoid re-hammering VIES if a form resubmits or an onboarding
 * wizard re-renders), NOT a substitute for re-verifying periodically —
 * VAT registrations can be revoked, so re-verify on a schedule (e.g. every
 * 90 days) independent of this cache.
 *
 * In-memory only: fine for a single Node.js server process; swap for a
 * shared cache (Redis) once running more than one instance, otherwise
 * each instance re-checks independently.
 */
const RESULT_CACHE_TTL_MS = Number(process.env.VIES_CACHE_TTL_MS ?? 60 * 60 * 1000);

// ----------------------------------------------------------------------------
// Public types
// ----------------------------------------------------------------------------

export interface VatCheckResult {
  countryCode: SupportedVatCountryCode;
  vatNumber: string;
  /** Full VAT ID as submitted, e.g. "ATU12345678". */
  vatId: string;
  valid: boolean;
  /** Registered company name, when VIES/the member state returns one. Blank for several member states even on a valid hit. */
  name: string | null;
  address: string | null;
  /** ISO 8601 timestamp VIES reported for this check. */
  requestDate: string;
  /** True when this result was served from the local cache rather than a fresh VIES call. */
  fromCache: boolean;
}

export type ViesErrorCode =
  | "INVALID_INPUT"
  | "INVALID_REQUESTER_INFO"
  | "SERVICE_UNAVAILABLE"
  | "MS_UNAVAILABLE"
  | "TIMEOUT"
  | "IP_BLOCKED"
  | "GLOBAL_MAX_CONCURRENT_REQ"
  | "MS_MAX_CONCURRENT_REQ"
  | "UNKNOWN";

/** Whether retrying the same request again shortly is worth attempting. */
const TRANSIENT_ERROR_CODES = new Set<ViesErrorCode>([
  "SERVICE_UNAVAILABLE",
  "MS_UNAVAILABLE",
  "TIMEOUT",
  "GLOBAL_MAX_CONCURRENT_REQ",
  "MS_MAX_CONCURRENT_REQ",
]);

export class ViesServiceError extends Error {
  readonly code: ViesErrorCode;
  readonly retryable: boolean;
  readonly cause?: unknown;

  constructor(code: ViesErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "ViesServiceError";
    this.code = code;
    this.retryable = TRANSIENT_ERROR_CODES.has(code);
    this.cause = cause;
  }
}

// ----------------------------------------------------------------------------
// Raw response shape (defensive — see module doc comment)
// ----------------------------------------------------------------------------

interface RawCheckVatResponse {
  countryCode?: string;
  vatNumber?: string;
  requestDate?: string;
  valid?: boolean;
  isValid?: boolean; // some documented VIES REST payloads use this name instead
  name?: string;
  address?: string;
  userError?: string; // present on documented error responses, e.g. "MS_UNAVAILABLE"
}

function mapUserErrorToCode(userError: string | undefined): ViesErrorCode | null {
  if (!userError || userError === "VALID") return null;
  const known: ViesErrorCode[] = [
    "INVALID_INPUT",
    "INVALID_REQUESTER_INFO",
    "SERVICE_UNAVAILABLE",
    "MS_UNAVAILABLE",
    "TIMEOUT",
    "IP_BLOCKED",
    "GLOBAL_MAX_CONCURRENT_REQ",
    "MS_MAX_CONCURRENT_REQ",
  ];
  return (known as string[]).includes(userError) ? (userError as ViesErrorCode) : "UNKNOWN";
}

function parseCheckVatResponse(
  raw: RawCheckVatResponse,
  fallback: { countryCode: SupportedVatCountryCode; vatNumber: string },
): Omit<VatCheckResult, "vatId" | "fromCache"> {
  const errorCode = mapUserErrorToCode(raw.userError);
  if (errorCode) {
    throw new ViesServiceError(errorCode, `VIES reported "${raw.userError}" for this VAT ID`);
  }

  const valid = raw.valid ?? raw.isValid;
  if (typeof valid !== "boolean") {
    throw new ViesServiceError(
      "UNKNOWN",
      "VIES response did not include a recognizable valid/isValid boolean field — verify the API contract has not changed",
    );
  }

  return {
    countryCode: (raw.countryCode as SupportedVatCountryCode) ?? fallback.countryCode,
    vatNumber: raw.vatNumber ?? fallback.vatNumber,
    valid,
    name: raw.name?.trim() ? raw.name.trim() : null,
    address: raw.address?.trim() ? raw.address.trim() : null,
    requestDate: raw.requestDate ?? new Date().toISOString(),
  };
}

// ----------------------------------------------------------------------------
// Concurrency guard + result cache
// ----------------------------------------------------------------------------

let activeRequests = 0;
const waitQueue: Array<() => void> = [];

async function acquireSlot(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests++;
    return;
  }
  await new Promise<void>((resolve) => waitQueue.push(resolve));
  activeRequests++;
}

function releaseSlot(): void {
  activeRequests--;
  const next = waitQueue.shift();
  if (next) next();
}

const resultCache = new Map<string, { result: VatCheckResult; expiresAt: number }>();

function getCached(vatId: string): VatCheckResult | null {
  const entry = resultCache.get(vatId);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    resultCache.delete(vatId);
    return null;
  }
  return { ...entry.result, fromCache: true };
}

function setCached(vatId: string, result: VatCheckResult): void {
  resultCache.set(vatId, { result, expiresAt: Date.now() + RESULT_CACHE_TTL_MS });
}

// ----------------------------------------------------------------------------
// Low-level HTTP call with timeout + retry
// ----------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callViesOnce(
  countryCode: string,
  vatNumber: string,
): Promise<RawCheckVatResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${VIES_BASE_URL}/${CHECK_VAT_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ countryCode, vatNumber }),
      signal: controller.signal,
    });

    if (response.status === 503) {
      throw new ViesServiceError("SERVICE_UNAVAILABLE", "VIES returned 503 Service Unavailable");
    }
    if (response.status === 429) {
      throw new ViesServiceError("GLOBAL_MAX_CONCURRENT_REQ", "VIES returned 429 Too Many Requests");
    }
    if (!response.ok) {
      throw new ViesServiceError(
        "UNKNOWN",
        `VIES returned unexpected HTTP status ${response.status}`,
      );
    }

    return (await response.json()) as RawCheckVatResponse;
  } catch (err) {
    if (err instanceof ViesServiceError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new ViesServiceError("TIMEOUT", `VIES did not respond within ${REQUEST_TIMEOUT_MS}ms`, err);
    }
    throw new ViesServiceError("SERVICE_UNAVAILABLE", "Network error calling VIES", err);
  } finally {
    clearTimeout(timeout);
  }
}

async function callViesWithRetry(
  countryCode: string,
  vatNumber: string,
): Promise<RawCheckVatResponse> {
  let lastError: ViesServiceError | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await callViesOnce(countryCode, vatNumber);
    } catch (err) {
      const viesError =
        err instanceof ViesServiceError
          ? err
          : new ViesServiceError("UNKNOWN", "Unexpected error calling VIES", err);
      lastError = viesError;

      if (!viesError.retryable || attempt === MAX_RETRIES) break;
      await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt);
    }
  }

  throw lastError;
}

// ----------------------------------------------------------------------------
// Public API
// ----------------------------------------------------------------------------

export interface CheckVatOptions {
  /** Bypass the result cache and force a fresh call to VIES. */
  skipCache?: boolean;
}

/**
 * Verifies a full VAT ID (e.g. "ATU12345678") against VIES.
 *
 * Throws `ViesServiceError` when VIES itself could not be reached or
 * returned a non-VALID `userError` (member state system down, rate limited,
 * timed out, etc.) — this is distinct from a *valid HTTP response saying the
 * VAT ID is not registered*, which resolves normally with `valid: false`.
 * Callers (e.g. the onboarding server action) should catch
 * `ViesServiceError` and set `CompanyProfile.verificationStatus` to remain
 * PENDING with a retry scheduled, rather than treating a transient VIES
 * outage as a rejected registration.
 */
export async function verifyCompanyVatId(
  vatId: string,
  options: CheckVatOptions = {},
): Promise<VatCheckResult> {
  const normalizedVatId = vatId.replace(/[\s.-]/g, "").toUpperCase();

  if (!options.skipCache) {
    const cached = getCached(normalizedVatId);
    if (cached) return cached;
  }

  const { countryCode, vatNumber } = splitVatId(normalizedVatId);

  await acquireSlot();
  try {
    const raw = await callViesWithRetry(countryCode, vatNumber);
    const parsed = parseCheckVatResponse(raw, { countryCode, vatNumber });
    const result: VatCheckResult = { ...parsed, vatId: normalizedVatId, fromCache: false };
    setCached(normalizedVatId, result);
    return result;
  } finally {
    releaseSlot();
  }
}

/**
 * Batch helper for admin re-verification jobs. Runs checks through the same
 * concurrency guard as single lookups, so it is safe to pass a large batch
 * without manually chunking — throughput is capped by
 * `VIES_MAX_CONCURRENT_REQUESTS` automatically. Individual failures are
 * captured per-item rather than aborting the whole batch.
 */
export async function verifyCompanyVatIdBatch(
  vatIds: string[],
): Promise<Array<{ vatId: string; result?: VatCheckResult; error?: ViesServiceError }>> {
  return Promise.all(
    vatIds.map(async (vatId) => {
      try {
        const result = await verifyCompanyVatId(vatId);
        return { vatId, result };
      } catch (err) {
        const error =
          err instanceof ViesServiceError ? err : new ViesServiceError("UNKNOWN", "Unexpected error", err);
        return { vatId, error };
      }
    }),
  );
}
