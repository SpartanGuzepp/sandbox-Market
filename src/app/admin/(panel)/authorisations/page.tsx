import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { authorisations } from "@/db/schema";
import { formatMoney } from "@/lib/money";
import { DecisionBadge, Json, PageTitle, fmtTime } from "@/components/admin";

export const metadata = { title: "Authorisations" };

export default async function AuthorisationsPage({ searchParams }: PageProps<"/admin/authorisations">) {
  const { order } = await searchParams;
  const q = db.select().from(authorisations).orderBy(desc(authorisations.createdAt)).limit(200);
  const rows = typeof order === "string" ? await q.where(eq(authorisations.orderId, order)) : await q;
  return (
    <div>
      <PageTitle title="Authorisation requests and responses">
        Exactly what was sent to the payment authoriser and what it answered. Line items appear in the request only when SEND_BASKET_DETAILS=true.
      </PageTitle>
      <ul className="space-y-3">
        {rows.map((a) => {
          const r = a.request as { amount_minor: number; currency: string; merchant_name: string; is_recurring: boolean; line_items?: unknown[] };
          return (
            <li key={a.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-3">
                <DecisionBadge decision={a.decision} />
                <span className="font-medium">{formatMoney(r.amount_minor, r.currency)} to {r.merchant_name}</span>
                {r.is_recurring && <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-800">recurring</span>}
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{r.line_items ? "with basket details" : "card fields only"}</span>
                <span className="text-sm text-slate-500">{fmtTime(a.createdAt)} · {a.authoriser === "no_leash" ? "no leash" : "leash"} · {a.latencyMs} ms</span>
              </div>
              <p className="mt-2 text-sm"><span className="text-slate-500">Reason:</span> {a.reason}</p>
              {a.error && <p className="mt-1 text-sm text-red-700">Error: {a.error}</p>}
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-blue-700">Show request and response</summary>
                <div className="mt-2 grid gap-3 lg:grid-cols-2">
                  <div><p className="mb-1 text-xs font-medium text-slate-500">REQUEST · {a.id} · order {a.orderId}</p><Json value={a.request} /></div>
                  <div><p className="mb-1 text-xs font-medium text-slate-500">RESPONSE{a.httpStatus ? ` · HTTP ${a.httpStatus}` : ""}</p><Json value={a.response} /></div>
                </div>
              </details>
            </li>
          );
        })}
        {!rows.length && <li className="text-sm text-slate-500">No authorisation requests yet.</li>}
      </ul>
    </div>
  );
}
