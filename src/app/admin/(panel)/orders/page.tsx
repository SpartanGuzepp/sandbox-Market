import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { agentKeys, merchants, orders } from "@/db/schema";
import { formatMoney } from "@/lib/money";
import { maskToken } from "@/lib/payments/card-token";
import { refundOrderAction } from "@/lib/admin/actions";
import { DecisionBadge, Flash, PageTitle, StatusBadge, btnSecondary, fmtTime, tableWrap, td, th } from "@/components/admin";

export const metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const sp = await searchParams;
  const rows = await db
    .select({ o: orders, merchant: merchants.name, agent: agentKeys.name })
    .from(orders)
    .leftJoin(merchants, eq(orders.merchantId, merchants.id))
    .leftJoin(agentKeys, eq(orders.agentKeyId, agentKeys.id))
    .orderBy(desc(orders.createdAt))
    .limit(200);
  return (
    <div>
      <PageTitle title="Orders">Every payment attempt: checkouts, subscription renewals and merchant-initiated charges.</PageTitle>
      <Flash ok={sp.ok} error={sp.error} />
      <div className={tableWrap}>
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>{["Time", "Order", "Who", "Merchant", "Items", "Total", "Status", "Decision", ""].map((h) => <th key={h} className={th}>{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ o, merchant, agent }) => (
              <tr key={o.id}>
                <td className={`${td} whitespace-nowrap text-slate-500`}>{fmtTime(o.createdAt)}</td>
                <td className={td}>
                  <span className="font-mono text-xs">{o.id}</span>
                  <p className="text-xs text-slate-500">{o.kind.replace("_", " ")} · {maskToken(o.cardToken)}</p>
                </td>
                <td className={td}>{agent ?? (o.channel === "web" ? "Website visitor" : o.channel)}</td>
                <td className={td}>{merchant}</td>
                <td className={td}>
                  {o.snapshot.lines.map((l, i) => <p key={i} className="text-xs">{l.quantity} × {l.title}{l.size ? ` (${l.size})` : ""}</p>)}
                  {o.snapshot.fees.map((f) => <p key={f.code} className="text-xs text-red-700">+ {f.label} {formatMoney(f.amount_minor, o.currency)}</p>)}
                  {o.snapshot.addons.map((a) => <p key={a.code} className="text-xs text-amber-700">+ {a.label} {formatMoney(a.amount_minor, o.currency)}</p>)}
                </td>
                <td className={`${td} whitespace-nowrap font-medium`}>{formatMoney(o.totalMinor, o.currency)}</td>
                <td className={td}><StatusBadge status={o.status} /></td>
                <td className={td}>
                  <DecisionBadge decision={o.decision} />
                  <p className="mt-1 max-w-xs text-xs text-slate-600">{o.decisionReason}</p>
                  <Link href={`/admin/authorisations?order=${o.id}`} className="text-xs text-blue-700 hover:underline">request/response</Link>
                </td>
                <td className={td}>
                  {o.status === "placed" && (
                    <form action={refundOrderAction}><input type="hidden" name="id" value={o.id} /><button className={btnSecondary}>Refund</button></form>
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td className={td} colSpan={9}>No orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
