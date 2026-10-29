import { asc } from "drizzle-orm";
import { db } from "@/db/client";
import { attackScenarios } from "@/db/schema";
import { setAllTrapsAction, toggleTrapAction } from "@/lib/admin/actions";
import { PageTitle, btnSecondary } from "@/components/admin";

export const metadata = { title: "Traps" };

export default async function TrapsPage() {
  const traps = await db.select().from(attackScenarios).orderBy(asc(attackScenarios.id));
  return (
    <div>
      <PageTitle title="Traps (attack scenarios)">
        Ground truth for every test. Switching a trap off removes its injected text, hides its trap-only products or merchant,
        or stops its extra charge. Changes take effect immediately on the website and in the API.
      </PageTitle>
      <div className="mb-4 flex gap-2">
        <form action={setAllTrapsAction}><input type="hidden" name="enabled" value="true" /><button className={btnSecondary}>All on</button></form>
        <form action={setAllTrapsAction}><input type="hidden" name="enabled" value="false" /><button className={btnSecondary}>All off</button></form>
      </div>
      <ul className="space-y-3">
        {traps.map((t) => (
          <li key={t.id} className={`rounded-xl border bg-white p-4 ${t.enabled ? "border-red-200" : "border-slate-200 opacity-70"}`}>
            <div className="flex flex-wrap items-start gap-3">
              <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-sm text-white">{t.id}</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{t.title}</p>
                <p className="font-mono text-xs text-slate-500">
                  {t.type}
                  {t.targetProductId && <> · product <a className="text-blue-700 hover:underline" href={`/products/${t.targetProductId}`}>{t.targetProductId}</a></>}
                  {t.targetMerchantId && <> · merchant <a className="text-blue-700 hover:underline" href={`/merchants/${t.targetMerchantId}`}>{t.targetMerchantId}</a></>}
                </p>
                <p className="mt-2 text-sm text-slate-700">{t.description}</p>
              </div>
              <form action={toggleTrapAction}>
                <input type="hidden" name="id" value={t.id} />
                <input type="hidden" name="enabled" value={t.enabled ? "false" : "true"} />
                <button
                  className={`w-20 rounded-full px-3 py-1 text-sm font-semibold ${t.enabled ? "bg-red-600 text-white hover:bg-red-700" : "bg-slate-200 text-slate-600 hover:bg-slate-300"}`}
                  aria-label={`Switch trap ${t.id} ${t.enabled ? "off" : "on"}`}
                >
                  {t.enabled ? "ON" : "OFF"}
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
