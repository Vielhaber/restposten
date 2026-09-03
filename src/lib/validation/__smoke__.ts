/**
 * Quick runtime smoke test for the Zod validation schemas — not a full test
 * suite, just a fast sanity check that the VAT/EAN/manifest edge cases
 * behave as documented. Run with `npm run smoke:validation`.
 */
import {
  b2bRegistrationSchema,
  isValidVatIdFormat,
  splitVatId,
} from "./auth.schema";
import {
  isValidEan13,
  manifestCsvRowSchema,
  manifestUploadSchema,
  manifestItemSchema,
  summarizeManifest,
} from "./manifest.schema";

function assert(cond: unknown, msg: string): void {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  } else {
    console.log("ok:", msg);
  }
}

// --- VAT ID format ---
assert(isValidVatIdFormat("AT", "ATU12345678") === true, "AT VAT ID valid format accepted");
assert(isValidVatIdFormat("DE", "DE123456789") === true, "DE VAT ID valid format accepted");
assert(isValidVatIdFormat("AT", "ATU1234567") === false, "AT VAT ID too short rejected");
assert(isValidVatIdFormat("DE", "DE12345678") === false, "DE VAT ID too short rejected (needs 9 digits)");
assert(isValidVatIdFormat("FR", "FR12345678901") === false, "unsupported country rejected");

const split = splitVatId("ATU12345678");
assert(split.countryCode === "AT" && split.vatNumber === "U12345678", "splitVatId AT shape correct");

// --- Full registration schema ---
const validRegistration = {
  email: "buyer@example.com",
  password: "Str0ng!Passw0rd",
  confirmPassword: "Str0ng!Passw0rd",
  contactName: "Maria Muster",
  role: "BUYER" as const,
  legalName: "Muster Handels GmbH",
  vatCountryCode: "AT" as const,
  vatId: "atu 12345678", // deliberately messy input to test normalization
  address: {
    street: "Hauptstraße",
    houseNumber: "12",
    postalCode: "1010",
    city: "Wien",
    countryCode: "AT" as const,
  },
  resaleChannels: ["EXPORT_EU" as const],
  acceptedTermsAt: true,
};

const regResult = b2bRegistrationSchema.safeParse(validRegistration);
assert(regResult.success, "valid registration payload parses");
if (regResult.success) {
  assert(regResult.data.vatId === "ATU12345678", "vatId normalized to uppercase, no spaces");
}

const mismatchedCountry = { ...validRegistration, vatCountryCode: "DE" as const };
assert(!b2bRegistrationSchema.safeParse(mismatchedCountry).success, "VAT prefix / country mismatch rejected");

const buyerNoChannels = { ...validRegistration, resaleChannels: [] };
assert(!b2bRegistrationSchema.safeParse(buyerNoChannels).success, "buyer without resale channels rejected");

const badPostal = { ...validRegistration, address: { ...validRegistration.address, postalCode: "12345" } };
assert(!b2bRegistrationSchema.safeParse(badPostal).success, "AT postal code with 5 digits rejected");

// --- EAN-13 ---
assert(isValidEan13("4006381333931") === true, "known-valid EAN-13 (IFA/GS1 sample) accepted");
assert(isValidEan13("4006381333932") === false, "EAN-13 with wrong check digit rejected");
assert(isValidEan13("12345") === false, "too-short EAN rejected");

// --- Manifest CSV row coercion ---
const csvRow = {
  ean: "4006381333931",
  title: "Bosch Cordless Drill",
  condition: "b_grade_return",
  quantity: "12",
  msrpCents: "9999",
  costBasisCents: "2500",
};
const csvResult = manifestCsvRowSchema.safeParse(csvRow);
assert(csvResult.success, "CSV row with string numerics + lowercase condition parses");
if (csvResult.success) {
  assert(csvResult.data.quantity === 12 && typeof csvResult.data.quantity === "number", "quantity coerced to number");
  assert(csvResult.data.condition === "B_GRADE_RETURN", "condition coerced to uppercase enum");
}

const badEanRow = { ...csvRow, ean: "4006381333932" };
assert(!manifestCsvRowSchema.safeParse(badEanRow).success, "CSV row with invalid EAN checksum rejected");

// --- Full manifest upload + duplicate detection ---
const item1 = manifestItemSchema.parse({
  ean: "4006381333931",
  title: "Item A",
  condition: "A_GRADE",
  quantity: 10,
  msrpCents: 5000,
  costBasisCents: 1000,
});
const item2 = manifestItemSchema.parse({
  ean: "4006381333931",
  title: "Item A duplicate",
  condition: "A_GRADE",
  quantity: 5,
  msrpCents: 5000,
  costBasisCents: 1000,
});
assert(!manifestUploadSchema.safeParse({ items: [item1, item2] }).success, "duplicate EAN+condition within one manifest rejected");

const summary = summarizeManifest([item1]);
assert(summary.totalManifestItems === 10 && summary.totalMsrpCents === 50000, "summarizeManifest aggregates correctly");

console.log(process.exitCode === 1 ? "\nSOME CHECKS FAILED" : "\nALL CHECKS PASSED");
