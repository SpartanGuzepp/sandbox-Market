import Link from "next/link";
import type { Metadata } from "next";
import { getWebCartView } from "@/lib/web/cart-cookie";
import { formatMoney } from "@/lib/money";
import { removeItemAction, updateQuantityAction } from "@/lib/web/actions";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage({ searchParams }: PageProps<"/cart">) {
  const { error } = await searchParams;
  const view = await getWebCartView();
  const lines = view?.breakdown.lines ?? [];

  if (!view || lines.length === 0) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-semibold">Your cart is empty</h1>
        <Link href="/search" className="mt-4 inline-block text-blue-700 hover:underline">Start shopping</Link>
      </div>
    );
  }
  const b = view.breakdown;
  const cur = b.currency ?? "EUR";
  const fmt = (m: number) => formatMoney(m, cur);

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_320px]">
      <section>
        <h1 className="text-2xl font-semibold">Cart</h1>
        <p className="mb-4 text-sm text-slate-500">
          Sold by <Link href={`/merchants/${view.merchant?.id}`} className="text-blue-700 hover:underline">{view.merchant?.name}</Link>.
          Each cart holds items from one merchant.
        </p>
        {typeof error === "string" && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200">
          {lines.map((l) => (
            <li key={l.itemId} className="flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <Link href={`/products/${l.productId}`} className="font-medium hover:text-blue-700">{l.title}</Link>
                <p className="text-sm text-slate-500">
                  {l.size && <>Size {l.size} · </>}
                  {fmt(l.unitPriceMinor)} each{l.isRecurring && <> · billed every {l.billingInterval}</>}
                </p>
              </div>
              <form action={updateQuantityAction} className="flex items-center gap-2">
                <input type="hidden" name="item_id" value={l.itemId} />
                <select name="quantity" defaultValue={String(l.quantity)} className="rounded-lg border border-slate-300 px-2 py-1 text-sm">
                  {Array.from({ length: 10 }, (_, i) => <option key={i + 1}>{i + 1}</option>)}
                </select>
                <button className="text-sm text-blue-700 hover:underline">Update</button>
              </form>
              <p className="w-24 text-right font-medium">{fmt(l.lineTotalMinor)}</p>
              <form action={removeItemAction}>
                <input type="hidden" name="item_id" value={l.itemId} />
                <button className="text-sm text-slate-500 hover:text-red-600">Remove</button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <aside className="h-fit space-y-3 rounded-xl border border-slate-200 p-4">
        <h2 className="font-semibold">Summary</h2>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between"><dt>Items</dt><dd>{fmt(b.subtotalMinor)}</dd></div>
          <div className="flex justify-between"><dt>Shipping</dt><dd>{b.shippingMinor ? fmt(b.shippingMinor) : "Free"}</dd></div>
          {b.fees.map((f) => <div key={f.code} className="flex justify-between"><dt>{f.label}</dt><dd>{fmt(f.amountMinor)}</dd></div>)}
          {b.addons.map((a) => <div key={a.code} className="flex justify-between"><dt>{a.label}</dt><dd>{fmt(a.amountMinor)}</dd></div>)}
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold"><dt>Total</dt><dd>{fmt(b.totalMinor)}</dd></div>
        </dl>
        {b.recurring.length > 0 && (
          <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-900">
            Includes subscriptions that bill again every month until cancelled.
          </p>
        )}
        <button disabled className="w-full cursor-not-allowed rounded-lg bg-slate-200 py-3 text-sm font-medium text-slate-500">
          Checkout (coming in Phase 3)
        </button>
      </aside>
    </div>
  );
}
