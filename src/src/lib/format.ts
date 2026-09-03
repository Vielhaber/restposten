const EUR = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
const DATE = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
const DATETIME = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatCents(cents: number): string {
  return EUR.format(cents / 100);
}

export function formatDate(iso: string): string {
  return DATE.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return DATETIME.format(new Date(iso));
}
