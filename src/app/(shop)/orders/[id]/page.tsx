import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getOrderWithAuth } from "@/lib/orders";
import { formatMoney } from "@/lib/money";
import { AutoRefresh } from "@/components/AutoRefresh";

export const metadata: Metadata = { title: "Order" };

const HEADLINE: Record<string, { title: string; style: string }> = {
  placed: { title: "Thank you, your order is placed", style: "bg-green-50 text-green-900" },
  declined: { title: "Payment declined", style: "bg-red-50 text-red-900" },
  awaiting_customer_approval: { title: "Waiting for your approval", style: "bg-amber-50 text-amber-900" },
  rejected_by_customer: { title: "Payment rejected in your banking app", style: "bg-red-50 text-red-900" },
  refunded: { title: "Order refunded", style: "bg-slate-100 text-slate-900" },
};

export default async function OrderPage({ params }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const full = await getOrderWithAuth(id);
  if (!full || full.order.channel !== "web") notFound();
  const o = full.order;
  const h = HEADLINE[o.status] ?? { title: o.status, style: "bg-slate-100" };
  const fmt = (m: number) => formatMoney(m, o.currency);
  return (
    <div className="mx-auto max-w-lg space-y-6">
      {o.status === "awaiting_customer_approval" && <AutoRefresh seconds={3} />}
      <div className={`rounded-xl px-4 py-4 ${h.style}`}>
        <h1 className="text-xl font-semibold">{h.title}</h1>
        {full.auth && <p className="mt-1 text-sm">Reason: {full.auth.reason}</p>}
        {o.status === "awaiting_customer_approval" && (
          <p className="mt-2 text-sm">Open the <Link href="/bank" target="_blank" className="font-medium underline">banking app</Link> to approve or reject this payment.</p>
        )}
      </div>
      <section className="rounded-xl border border-slate-200 p-4 text-sm">
        <p className="mb-2 text-slate-500">Order <span className="font-mono">{o.id}</span> · {full.merchantName}</p>
        {o.snapshot.lines.map((l, i) => <p key={i} className="flex justify-between"><span>{l.quantity} × {l.title}{l.size ? ` (${l.size})` : ""}</span><span>{fmt(l.line_total_minor)}</span></p>)}
        <p className="flex justify-between"><span>Shipping</span><span>{fmt(o.snapshot.shipping_minor)}</span></p>
        {o.snapshot.fees.map((f) => <p key={f.code} className="flex justify-between"><span>{f.label}</span><span>{fmt(f.amount_minor)}</span></p>)}
        {o.snapshot.addons.map((a) => <p key={a.code} className="flex justify-between"><span>{a.label}</span><span>{fmt(a.amount_minor)}</span></p>)}
        <p className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base font-semibold"><span>Total</span><span>{fmt(o.totalMinor)}</span></p>
      </section>
      <Link href="/" className="inline-block text-blue-700 hover:underline">Continue shopping</Link>
    </div>
  );
}
