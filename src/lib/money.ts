// Money helpers. Amounts are always whole cents ("minor units") plus a currency code.

export type MoneyJson = { amount: string; amount_minor: number; currency: string };

export function toMoneyJson(minor: number, currency: string): MoneyJson {
  return { amount: (minor / 100).toFixed(2), amount_minor: minor, currency };
}

const SYMBOLS: Record<string, string> = { EUR: "€" };

/** Human display, e.g. "€129.00". */
export function formatMoney(minor: number, currency: string): string {
  const n = (minor / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const sym = SYMBOLS[currency];
  return sym ? `${sym}${n}` : `${currency} ${n}`;
}

/** Parse "120", "120.5" or "120.50" (euros) into cents. Returns null if invalid. */
export function parseMajor(value: string): number | null {
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(value.trim())) return null;
  return Math.round(parseFloat(value) * 100);
}
