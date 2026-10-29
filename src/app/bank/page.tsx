import type { Metadata } from "next";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { merchants, orders } from "@/db/schema";
import { requireBank } from "@/lib/session";
import { bankDecisionAction, bankLogoutAction } from "@/lib/bank-actions";
import { formatMoney } from "@/lib/money";
import { maskToken } from "@/lib/payments/card-token";
import { BankFrame } from "@/components/BankFrame";
import { AutoRefresh } from "@/components/AutoRefresh";

export const metadata: Metadata = { title: "Banking app" };

const STATUS_TEXT: Record<string, string> = {
  placed: "Paid",
  declined: "Declined",
  rejected_by_customer: "You rejected",
  refunded: "Refunded",
};

export default async function BankHome({ searchParams }: PageProps<"/bank">) {
  await requireBank();
  const { error } = await searchParams;
  // A bank only knows the merchant, the amount and the card: no basket.
  const rows = await db
    .select({ o: orders, merchant: merchants.name, country: merchants.country })
    .from(orders)
    .leftJoin(merchants, eq(orders.merchantId, merchants.id))
    .where(inArray(orders.status, ["awaiting_customer_approval", "placed", "declined", "rejected_by_customer", "refunded"]))
    .orderBy(desc(orders.updatedAt))
    .limit(20);
  const pending = rows.filter((r) => r.o.status === "awaiting_customer_approval");
  const history = rows.filter((r) => r.o.status !== "awaiting_customer_approval").slice(0, 8);

  return (
    <BankFrame>
      <AutoRefresh seconds={3} />
      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <h2 className="mb-3 font-semibold">Waiting for your approval</h2>
      {pending.length === 0 && <p className="mb-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Nothing to approve.</p>}
      <ul className="mb-6 space-y-3">
        {pending.map(({ o, merchant, country }) => (
          <li key={o.id} className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4">
            <p className="text-sm text-slate-600">Payment request</p>
            <p className="text-3xl font-semibold">{formatMoney(o.totalMinor, o.currency)}</p>
            <p className="mt-1 font-medium">{merchant}{country && country !== "XX" ? ` · ${country}` : ""}</p>
            <p className="text-xs text-slate-500">Card {maskToken(o.cardToken)}{o.isRecurring ? " · recurring payment" : ""}</p>
            {o.decisionReason && <p className="mt-2 text-sm text-amber-900">Why we&apos;re asking: {o.decisionReason}</p>}
            <form action={bankDecisionAction} className="mt-3 grid grid-cols-2 gap-2">
              <input type="hidden" name="order_id" value={o.id} />
              <button name="decision" value="reject" className="rounded-xl border border-slate-300 bg-white py-2 font-medium text-red-700">Reject</button>
              <button name="decision" value="approve" className="rounded-xl bg-blue-700 py-2 font-medium text-white">Approve</button>
            </form>
          </li>
        ))}
      </ul>
      <h2 className="mb-2 font-semibold">Recent</h2>
      <ul className="divide-y divide-slate-100 text-sm">
        {history.map(({ o, merchant }) => (
          <li key={o.id} className="flex justify-between py-2">
            <span>{merchant}<br /><span className="text-xs text-slate-500">{STATUS_TEXT[o.status] ?? o.status}</span></span>
            <span className={o.status === "placed" ? "font-medium" : "text-slate-400 line-through"}>{formatMoney(o.totalMinor, o.currency)}</span>
          </li>
        ))}
      </ul>
      <form action={bankLogoutAction} className="mt-6 text-center"><button className="text-sm text-slate-500 hover:text-red-600">Lock app</button></form>
    </BankFrame>
  );
}
