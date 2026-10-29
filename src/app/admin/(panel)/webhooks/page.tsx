import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { webhookDeliveries } from "@/db/schema";
import { config } from "@/lib/env";
import { WEBHOOK_EVENT_TYPES } from "@/lib/webhooks";
import { PageTitle, fmtTime, tableWrap, td, th } from "@/components/admin";

export const metadata = { title: "Webhooks" };

export default async function WebhooksPage() {
  const rows = await db.select().from(webhookDeliveries).orderBy(desc(webhookDeliveries.id)).limit(200);
  const urls = config.webhookUrls();
  return (
    <div className="space-y-6">
      <PageTitle title="Webhooks">
        Configured in the WEBHOOK_URLS environment variable. Each POST is signed: X-Sandbox-Signature = sha256=HMAC(WEBHOOK_SECRET, body).
      </PageTitle>
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <p><span className="text-slate-500">URLs:</span> {urls.length ? urls.join(", ") : "none configured"}</p>
        <p className="mt-1"><span className="text-slate-500">Signing:</span> {config.webhookSecret() ? "WEBHOOK_SECRET set" : "WEBHOOK_SECRET not set (unsigned)"}</p>
        <p className="mt-1"><span className="text-slate-500">Events sent:</span> <span className="font-mono text-xs">{[...WEBHOOK_EVENT_TYPES].join(", ")}</span></p>
      </div>
      <div className={tableWrap}>
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>{["Time", "Event", "URL", "Result", "Time taken"].map((h) => <th key={h} className={th}>{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((d) => (
              <tr key={d.id}>
                <td className={`${td} whitespace-nowrap text-slate-500`}>{fmtTime(d.createdAt)}</td>
                <td className={`${td} font-mono text-xs`}>{d.eventType} <span className="text-slate-400">evt_{d.eventId}</span></td>
                <td className={`${td} text-xs`}>{d.url}</td>
                <td className={td}>
                  {d.statusCode && d.statusCode < 300 ? <span className="text-green-700">HTTP {d.statusCode}</span> : <span className="text-red-700">{d.statusCode ? `HTTP ${d.statusCode}` : "failed"} {d.error}</span>}
                </td>
                <td className={td}>{d.latencyMs} ms</td>
              </tr>
            ))}
            {!rows.length && <tr><td className={td} colSpan={5}>No deliveries yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
