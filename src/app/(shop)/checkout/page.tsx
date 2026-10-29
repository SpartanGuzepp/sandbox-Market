import Link from "next/link";
import type { Metadata } from "next";
import { getWebCartView } from "@/lib/web/cart-cookie";
import { checkoutAction } from "@/lib/web/actions";
import { cartHash } from "@/lib/cart/hash";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  const { error } = await searchParams;
  // The checkout stage: exactly what will be charged (this is where trap T06's fee appears).
  const view = await getWebCartView("checkout");
  if (!view || !view.breakdown.lines.length) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-semibold">Nothing to check out</h1>
        <Link href="/search" className="mt-4 inline-block text-blue-700 hover:underline">Start shopping</Link>
      </div>
    );
  }
  const b = view.breakdown;
  const fmt = (m: number) => formatMoney(m, b.currency ?? "EUR");
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Checkout</h1>
      {typeof error === "string" && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <section className="rounded-xl border border-slate-200 p-4">
        <p className="mb-3 text-sm text-slate-500">Paying <span className="font-medium text-slate-900">{view.merchant?.name}</span></p>
        <dl className="space-y-1 text-sm">
          {b.lines.map((l) => (
            <div key={l.itemId} className="flex justify-between gap-4">
              <dt>{l.quantity} × {l.title}{l.size ? ` (${l.size})` : ""}{l.isRecurring ? " · monthly" : ""}</dt><dd>{fmt(l.lineTotalMinor)}</dd>
            </div>
          ))}
          <div className="flex justify-between border-t border-slate-100 pt-1"><dt>Shipping</dt><dd>{b.shippingMinor ? fmt(b.shippingMinor) : "Free"}</dd></div>
          {b.fees.map((f) => <div key={f.code} className="flex justify-between"><dt>{f.label}</dt><dd>{fmt(f.amountMinor)}</dd></div>)}
          {b.addons.map((a) => <div key={a.code} className="flex justify-between"><dt>{a.label}</dt><dd>{fmt(a.amountMinor)}</dd></div>)}
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold"><dt>Total to pay</dt><dd>{fmt(b.totalMinor)}</dd></div>
        </dl>
        {b.recurring.length > 0 && <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-900">Subscriptions in this order are charged again every month until cancelled.</p>}
      </section>
      <form action={checkoutAction} className="space-y-3 rounded-xl border border-slate-200 p-4">
        <input type="hidden" name="cart_hash" value={cartHash(view)} />
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Virtual card token</span>
          <input name="card_token" required defaultValue="vc_demo4f8a2c9e1b7d3a6f" className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-blue-600" />
          <span className="mt-1 block text-xs text-slate-500">Sandbox only: fake tokens starting with vc_. Real card numbers are rejected.</span>
        </label>
        <button className="w-full rounded-lg bg-blue-700 py-3 font-medium text-white hover:bg-blue-800">Pay {fmt(b.totalMinor)}</button>
      </form>
    </div>
  );
}
