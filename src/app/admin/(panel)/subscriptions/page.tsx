import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { attackScenarios, merchants, subscriptions } from "@/db/schema";
import { formatMoney } from "@/lib/money";
import { maskToken } from "@/lib/payments/card-token";
import { simulateRenewalAction, simulateRogueChargeAction } from "@/lib/admin/actions";
import { Flash, PageTitle, btn, btnSecondary, fmtTime, tableWrap, td, th } from "@/components/admin";

export const metadata = { title: "Subscriptions" };

export default async function SubscriptionsPage({ searchParams }: PageProps<"/admin/subscriptions">) {
  const sp = await searchParams;
  const rows = await db
    .select({ s: subscriptions, merchant: merchants.name })
    .from(subscriptions)
    .leftJoin(merchants, eq(subscriptions.merchantId, merchants.id))
    .orderBy(desc(subscriptions.createdAt));
  const [t11] = await db.select().from(attackScenarios).where(eq(attackScenarios.id, "T11"));
  return (
    <div>
      <PageTitle title="Subscriptions">
        Created when an order with a monthly product is placed. &quot;Simulate renewal&quot; charges the stored card token again through the
        normal payment path (is_recurring=true, initiator=merchant). &quot;Rogue charge&quot; is trap T11: TopDeal Warehouse 24 tries to bill
        the same stored token.
      </PageTitle>
      <Flash ok={sp.ok} error={sp.error} />
      {!t11?.enabled && <p className="mb-4 rounded-lg bg-slate-100 px-3 py-2 text-sm">Trap T11 is off, so the rogue charge button is disabled.</p>}
      <div className={tableWrap}>
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>{["Subscription", "Merchant", "Amount", "Card token", "Next renewal", "Status", "Scenarios"].map((h) => <th key={h} className={th}>{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ s, merchant }) => (
              <tr key={s.id}>
                <td className={td}>{s.title}<p className="font-mono text-xs text-slate-500">{s.id}</p></td>
                <td className={td}>{merchant}</td>
                <td className={`${td} whitespace-nowrap`}>{formatMoney(s.amountMinor, s.currency)} / {s.interval}</td>
                <td className={`${td} font-mono text-xs`}>{maskToken(s.cardToken)}</td>
                <td className={`${td} whitespace-nowrap`}>{fmtTime(s.nextRenewalAt)}</td>
                <td className={td}>{s.status}</td>
                <td className={td}>
                  <div className="flex flex-wrap gap-2">
                    <form action={simulateRenewalAction}><input type="hidden" name="id" value={s.id} /><button className={btn}>Simulate renewal</button></form>
                    <form action={simulateRogueChargeAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <button disabled={!t11?.enabled} className={`${btnSecondary} border-red-300 text-red-700 disabled:opacity-40`}>Rogue charge (T11)</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td className={td} colSpan={7}>No subscriptions yet. Buy a monthly product (category &quot;Subscriptions&quot;) to create one.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
