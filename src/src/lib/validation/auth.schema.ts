/**
 * B2B User Registration — Zod validation schemas.
 *
 * Covers: user credentials, company legal/tax identity (including strict
 * Austrian/German VAT-ID format validation), company address, and the
 * buyer-side resale-channel declaration used later for channel/geo-fencing
 * enforcement at checkout.
 *
 * NOTE: These schemas validate *format* only (regex shape, checksums that
 * can be computed offline). They do NOT confirm the VAT ID is registered
 * and active at the tax authority — that requires a live call to VIES,
 * performed server-side after this schema passes. See `vies.service.ts`.
 * The two are intentionally decoupled: format validation gives instant
 * feedback in the registration form, VIES validation runs asynchronously
 * (VIES has no uptime SLA) and flips `CompanyProfile.verificationStatus`.
 */

import { z } from "zod";

// ----------------------------------------------------------------------------
// Supported VAT countries (Phase 1 scope: Austria & Germany, per DACH focus).
// Extend `VAT_COUNTRY_PATTERNS` when the platform expands to other EU states —
// keep in sync with the VIES-supported country code list in vies.service.ts.
// ----------------------------------------------------------------------------

export const SUPPORTED_VAT_COUNTRY_CODES = ["AT", "DE"] as const;
export type SupportedVatCountryCode = (typeof SUPPORTED_VAT_COUNTRY_CODES)[number];

/**
 * Per-country VAT-ID format rules.
 *
 * AT: "ATU" + 8 digits                      e.g. ATU12345678
 * DE: "DE"  + 9 digits                      e.g. DE123456789
 *
 * Both regexes anchor the full string (^...$) and expect the country prefix
 * to be part of the submitted value — this matches how VIES itself expects
 * `countryCode` (2-letter) and `vatNumber` (digits only, prefix stripped) to
 * be split, so the transform below produces both shapes.
 */
const VAT_COUNTRY_PATTERNS: Record<SupportedVatCountryCode, RegExp> = {
  AT: /^ATU\d{8}$/,
  DE: /^DE\d{9}$/,
};

/** Postal code shape per country, used to catch obvious address typos early. */
const POSTAL_CODE_PATTERNS: Record<SupportedVatCountryCode, RegExp> = {
  AT: /^\d{4}$/,
  DE: /^\d{5}$/,
};

export function isValidVatIdFormat(
  countryCode: string,
  vatId: string,
): countryCode is SupportedVatCountryCode {
  const pattern = VAT_COUNTRY_PATTERNS[countryCode as SupportedVatCountryCode];
  return Boolean(pattern) && pattern.test(vatId);
}

/**
 * Splits a full VAT ID ("ATU12345678") into the `{countryCode, vatNumber}`
 * shape the VIES REST API expects. Assumes the value already passed
 * `isValidVatIdFormat`.
 */
export function splitVatId(vatId: string): { countryCode: SupportedVatCountryCode; vatNumber: string } {
  const countryCode = vatId.slice(0, 2) as SupportedVatCountryCode;
  // Austria's VIES vatNumber is the digits only, WITHOUT the "U" — VIES
  // expects "ATU" to be reduced to countryCode "AT" + vatNumber "U12345678".
  const vatNumber = vatId.slice(2);
  return { countryCode, vatNumber };
}

// ----------------------------------------------------------------------------
// Reusable field-level schemas
// ----------------------------------------------------------------------------

export const vatCountryCodeSchema = z.enum(SUPPORTED_VAT_COUNTRY_CODES, {
  message: "VAT country must be one of: AT, DE",
});

/**
 * Strict, country-aware VAT-ID schema. Normalizes whitespace/casing before
 * testing the regex so "atu 12345678" and "ATU12345678" both validate.
 */
export const vatIdSchema = z
  .string()
  .transform((value) => value.replace(/[\s.-]/g, "").toUpperCase())
  .superRefine((value, ctx) => {
    const countryCode = value.slice(0, 2);
    if (countryCode !== "AT" && countryCode !== "DE") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "VAT ID must start with a supported country prefix (ATU or DE)",
      });
      return;
    }
    const pattern = VAT_COUNTRY_PATTERNS[countryCode];
    if (!pattern.test(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          countryCode === "AT"
            ? 'Austrian VAT ID must match "ATU" followed by 8 digits (e.g. ATU12345678)'
            : 'German VAT ID must match "DE" followed by 9 digits (e.g. DE123456789)',
      });
    }
  });

export const companyAddressSchema = z
  .object({
    street: z.string().trim().min(2, "Street is required").max(200),
    houseNumber: z.string().trim().max(20).optional(),
    postalCode: z.string().trim().min(4).max(5),
    city: z.string().trim().min(1, "City is required").max(120),
    countryCode: vatCountryCodeSchema,
  })
  .superRefine((address, ctx) => {
    const pattern = POSTAL_CODE_PATTERNS[address.countryCode];
    if (!pattern.test(address.postalCode)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["postalCode"],
        message:
          address.countryCode === "AT"
            ? "Austrian postal codes are 4 digits"
            : "German postal codes are 5 digits",
      });
    }
  });

/** Mirrors `ResaleChannel` in schema.prisma — keep the two in sync. */
export const resaleChannelSchema = z.enum([
  "AMAZON",
  "EBAY",
  "KAUFLAND_DE",
  "OTTO_MARKET",
  "BRICK_AND_MORTAR",
  "OWN_WEBSITE",
  "WHOLESALE_B2B",
  "EXPORT_EU",
  "EXPORT_NON_EU",
  "OTHER",
]);

/** Mirrors `Role` in schema.prisma. ADMIN is never selectable via self-registration. */
export const selfRegistrationRoleSchema = z.enum(["BUYER", "SELLER"]);

const PASSWORD_MIN_LENGTH = 10;
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(128)
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a digit")
  .regex(/[^a-zA-Z0-9]/, "Password must contain a symbol");

// international format, e.g. +436641234567
const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{6,14}$/, "Phone must be in international format, e.g. +436641234567");

// ----------------------------------------------------------------------------
// B2B Registration — top-level schema
// ----------------------------------------------------------------------------

export const b2bRegistrationSchema = z
  .object({
    // --- User / credentials ---
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    password: passwordSchema,
    confirmPassword: z.string(),
    contactName: z.string().trim().min(2, "Contact name is required").max(150),
    role: selfRegistrationRoleSchema,

    // --- Company / tax identity ---
    legalName: z.string().trim().min(2, "Legal company name is required").max(200),
    tradingName: z.string().trim().max(200).optional(),
    vatCountryCode: vatCountryCodeSchema,
    vatId: vatIdSchema,
    registrationNumber: z.string().trim().max(50).optional(),

    // --- Address ---
    address: companyAddressSchema,

    phone: phoneSchema.optional(),
    website: z.string().trim().url("Enter a valid URL, e.g. https://example.com").optional(),

    // --- Buyer-only: declared resale channels (drives channel/geo-fencing) ---
    resaleChannels: z.array(resaleChannelSchema).optional(),

    acceptedTermsAt: z.boolean().refine((v) => v === true, {
      message: "You must accept the Terms of Service and NDA policy to register",
    }),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }

    // The VAT ID's own prefix must agree with the separately-selected
    // vatCountryCode — catches copy/paste of the wrong country's UID into
    // the right dropdown value.
    const vatPrefix = data.vatId.slice(0, 2);
    if (vatPrefix !== data.vatCountryCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["vatId"],
        message: `VAT ID prefix does not match selected VAT country (${data.vatCountryCode})`,
      });
    }

    if (data.role === "BUYER" && (!data.resaleChannels || data.resaleChannels.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["resaleChannels"],
        message: "Select at least one declared resale channel",
      });
    }
  });

export type B2bRegistrationInput = z.infer<typeof b2bRegistrationSchema>;

// ----------------------------------------------------------------------------
// Login — kept alongside registration since both live in the auth surface.
// ----------------------------------------------------------------------------

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
