import { and, desc, gt, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { events } from "@/db/schema";
import { hasSession } from "@/lib/session";
import { TIMELINE_BROWSING, TIMELINE_CORE, type TimelineEvent } from "@/lib/timeline";
import { config } from "@/lib/env";

// GET /admin/timeline/feed?after=<event id>: new timeline events for the projector view (admin only).
export async function GET(req: Request) {
  if (!(await hasSession("admin"))) return Response.json({ error: "not logged in" }, { status: 401 });
  const after = Number(new URL(req.url).searchParams.get("after") ?? 0) || 0;
  const rows = await db
    .select()
    .from(events)
    .where(and(gt(events.id, after), inArray(events.type, [...TIMELINE_CORE, ...TIMELINE_BROWSING])))
    .orderBy(desc(events.id))
    .limit(after ? 200 : 40);
  const items: TimelineEvent[] = rows.reverse().map((e) => ({
    id: e.id,
    ts: e.ts.toISOString(),
    type: e.type,
    actorType: e.actorType,
    actorName: e.actorName,
    summary: e.summary,
    orderId: e.orderId,
    data: e.data,
  }));
  return Response.json(
    { items, config: { leash: config.authoriserUrl() ? "leash" : "no_leash", basketDetails: config.sendBasketDetails() } },
    { headers: { "Cache-Control": "no-store" } },
  );
}
