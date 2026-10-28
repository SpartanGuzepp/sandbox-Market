export function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const COUNTRY_NAMES: Record<string, string> = { CH: "Switzerland", DE: "Germany", XX: "Not stated" };
export const countryName = (code: string) => COUNTRY_NAMES[code] ?? code;

export function daysSince(d: Date, now = new Date()) {
  return Math.floor((now.getTime() - d.getTime()) / 86_400_000);
}
