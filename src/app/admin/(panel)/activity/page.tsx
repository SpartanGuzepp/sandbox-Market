import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { agentKeys, events } from "@/db/schema";
import { PageTitle, fmtTime, tableWrap, td, th } from "@/components/admin";

export const metadata = { title: "Agent activity" };

export default async function ActivityPage({ searchParams }: PageProps<"/admin/activity">) {
  const { agent } = await searchParams;
  const keys = await db.select({ id: agentKeys.id, name: agentKeys.name }).from(agentKeys).orderBy(asc(agentKeys.name));
  const q = db.select().from(events).orderBy(desc(events.id)).limit(300);
  const rows = typeof agent === "string" ? await q.where(eq(events.actorId, agent)) : await q;
  return (
    <div>
      <PageTitle title="Activity log">Every action, newest first: which agent (or visitor, customer, merchant, admin) did what.</PageTitle>
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link href="/admin/activity" className={`rounded-full px-3 py-1 ${!agent ? "bg-blue-700 text-white" : "bg-white ring-1 ring-slate-200"}`}>Everyone</Link>
        {keys.map((k) => (
          <Link key={k.id} href={`/admin/activity?agent=${k.id}`} className={`rounded-full px-3 py-1 ${agent === k.id ? "bg-blue-700 text-white" : "bg-white ring-1 ring-slate-200"}`}>{k.name}</Link>
        ))}
      </div>
      <div className={tableWrap}>
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>{["Time", "Actor", "Event", "What happened", "Cart / order"].map((h) => <th key={h} className={th}>{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((e) => (
              <tr key={e.id}>
                <td className={`${td} whitespace-nowrap text-slate-500`}>{fmtTime(e.ts)}</td>
                <td className={td}><span className="text-xs text-slate-500">{e.actorType}</span><br />{e.actorName}</td>
                <td className={`${td} font-mono text-xs`}>{e.type}</td>
                <td className={td}>
                  {e.summary}
                  {Array.isArray(e.data.active_traps) && e.data.active_traps.length > 0 && (
                    <span className="ml-2 rounded bg-red-50 px-1.5 text-xs text-red-700">trap {(e.data.active_traps as string[]).join(", ")}</span>
                  )}
                </td>
                <td className={`${td} font-mono text-xs text-slate-500`}>{e.cartId}<br />{e.orderId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
