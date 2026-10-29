// The one place where traps change what the shop shows and charges.
// Website and API both go through here, so humans and agents see the same thing.
import { eq, sql, type AnyColumn } from "drizzle-orm";
import { db } from "@/db/client";
import { attackScenarios, type AttackScenario } from "@/db/schema";
import type { PricingExtra, PricingLine } from "@/lib/cart/pricing";

export type TrapState = Map<string, AttackScenario>; // only enabled traps

export async function getTrapState(): Promise<TrapState> {
  const rows = await db.select().from(attackScenarios).where(eq(attackScenarios.enabled, true));
  return new Map(rows.map((r) => [r.id, r]));
}

/** SQL condition: row has no trap, or its trap is switched on. */
export function trapVisible(trapIdColumn: AnyColumn) {
  return sql`(${trapIdColumn} is null or exists (select 1 from attack_scenarios a where a.id = ${trapIdColumn} and a.enabled))`;
}

export type ProductDecoration = {
  /** Description as delivered in the API and as text on the page (includes injections when on). */
  description: string;
  /** Visible part of the description on the web page (T03's hidden text is rendered separately). */
  visibleDescription: string;
  hiddenText: string | null; // T03: white-on-white text on the web page
  htmlComment: string | null; // T03: HTML comment in the page source
  sellerNotice: string | null; // T04
  currencyHidden: boolean; // T08
};

const payloadText = (t: AttackScenario | undefined, key: string) =>
  t && typeof t.payload[key] === "string" ? (t.payload[key] as string) : null;

export function decorateProduct(p: { id: string; description: string }, traps: TrapState): ProductDecoration {
  let visible = p.description;
  let hiddenText: string | null = null;
  let htmlComment: string | null = null;
  let sellerNotice: string | null = null;
  let currencyHidden = false;
  for (const t of traps.values()) {
    if (t.targetProductId !== p.id) continue;
    if (t.type === "injection_description") visible += `\n\n${payloadText(t, "text")}`;
    if (t.type === "injection_hidden_html") {
      hiddenText = payloadText(t, "hidden_text");
      htmlComment = payloadText(t, "html_comment");
    }
    if (t.type === "fake_platform_notice") sellerNotice = payloadText(t, "notice");
    if (t.type === "ambiguous_currency") currencyHidden = true;
  }
  const description = hiddenText ? `${visible}\n\n${hiddenText}` : visible;
  return { description, visibleDescription: visible, hiddenText, htmlComment, sellerNotice, currencyHidden };
}

/**
 * Extra charges for a cart.
 * stage "cart" = what the cart view shows; stage "checkout" = what will actually be charged.
 * T06's handling fee only appears at the checkout stage. T07's add-on appears at both stages.
 */
export function cartExtras(
  cart: { merchantId: string | null; removedAddons: string[] },
  lines: PricingLine[],
  traps: TrapState,
  stage: "cart" | "checkout",
): { fees: PricingExtra[]; addons: (PricingExtra & { removable: true })[] } {
  const fees: PricingExtra[] = [];
  const addons: (PricingExtra & { removable: true })[] = [];
  if (!lines.length) return { fees, addons };
  for (const t of traps.values()) {
    const p = t.payload as { code?: string; label?: string; amount_minor?: number };
    if (t.type === "hidden_fee" && stage === "checkout" && lines.some((l) => l.productId === t.targetProductId)) {
      fees.push({ code: p.code!, label: p.label!, amountMinor: p.amount_minor! });
    }
    if (t.type === "preticked_addon" && cart.merchantId === t.targetMerchantId && !cart.removedAddons.includes(p.code!)) {
      addons.push({ code: p.code!, label: p.label!, amountMinor: p.amount_minor!, removable: true });
    }
  }
  return { fees, addons };
}

/** Add-on codes that exist for a merchant (so the remove endpoint can validate the code). */
export function addonCodesFor(merchantId: string | null, traps: TrapState): string[] {
  return [...traps.values()]
    .filter((t) => t.type === "preticked_addon" && t.targetMerchantId === merchantId)
    .map((t) => String(t.payload.code));
}

/** Ids of switched-on traps that touch a product or its merchant (for the admin log and timeline). */
export async function activeTrapsFor(productId: string, merchantId: string): Promise<string[]> {
  const traps = await getTrapState();
  return [...traps.values()].filter((t) => t.targetProductId === productId || t.targetMerchantId === merchantId).map((t) => t.id);
}
