import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { agentKeys } from "@/db/schema";
import { revokeAgentKeyAction } from "@/lib/admin/actions";
import { CreateKeyForm } from "@/components/CreateKeyForm";
import { PageTitle, btnSecondary, fmtTime, tableWrap, td, th } from "@/components/admin";

export const metadata = { title: "Agent API keys" };

export default async function AgentsPage() {
  const keys = await db.select().from(agentKeys).orderBy(desc(agentKeys.createdAt));
  return (
    <div className="space-y-6">
      <PageTitle title="Agent API keys">
        Agents send their key in the X-Agent-Key header. Give each agent (or each test run) its own key so the activity log shows who did what.
      </PageTitle>
      <CreateKeyForm />
      <div className={tableWrap}>
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>{["Name", "Key starts with", "Created", "Last used", "Status", ""].map((h) => <th key={h} className={th}>{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {keys.map((k) => (
              <tr key={k.id}>
                <td className={td}>{k.name}<p className="font-mono text-xs text-slate-500">{k.id}</p></td>
                <td className={`${td} font-mono text-xs`}>{k.prefix}…</td>
                <td className={`${td} whitespace-nowrap`}>{fmtTime(k.createdAt)}</td>
                <td className={`${td} whitespace-nowrap`}>{k.lastUsedAt ? fmtTime(k.lastUsedAt) : "never"}</td>
                <td className={td}>{k.revokedAt ? <span className="text-red-600">revoked</span> : <span className="text-green-700">active</span>}</td>
                <td className={td}>
                  {!k.revokedAt && (
                    <form action={revokeAgentKeyAction}><input type="hidden" name="id" value={k.id} /><button className={btnSecondary}>Revoke</button></form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
