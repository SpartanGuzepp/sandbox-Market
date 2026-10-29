import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { config } from "@/lib/env";
import { resetDatabaseAction } from "@/lib/admin/actions";
import { Flash, PageTitle, btn } from "@/components/admin";

async function count(table: string, where = "true") {
  const rows = await db.execute<{ n: number }>(sql.raw(`select count(*)::int as n from ${table} where ${where}`));
  return rows[0].n;
}

export default async function AdminHome({ searchParams }: PageProps<"/admin">) {
  const sp = await searchParams;
  const [orders, awaiting, auths, events, trapsOn, keys, subs] = await Promise.all([
    count("orders"),
    count("orders", "status = 'awaiting_customer_approval'"),
    count("authorisations"),
    count("events"),
    count("attack_scenarios", "enabled"),
    count("agent_keys", "revoked_at is null"),
    count("subscriptions", "status = 'active'"),
  ]);
  const url = config.authoriserUrl();
  const hooks = config.webhookUrls();

  const stats = [
    { label: "Orders", value: orders, href: "/admin/orders" },
    { label: "Awaiting customer approval", value: awaiting, href: "/admin/orders" },
    { label: "Authorisation requests", value: auths, href: "/admin/authorisations" },
    { label: "Events logged", value: events, href: "/admin/activity" },
    { label: "Traps switched on", value: `${trapsOn} / 11`, href: "/admin/traps" },
    { label: "Active agent keys", value: keys, href: "/admin/agents" },
    { label: "Active subscriptions", value: subs, href: "/admin/subscriptions" },
  ];

  return (
    <div className="space-y-8">
      <PageTitle title="Overview" />
      <Flash ok={sp.ok} error={sp.error} />

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Payment configuration (read-only, from environment variables)</h2>
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[220px_1fr]">
          <dt className="text-slate-500">Payment authoriser</dt>
          <dd>
            {url ? (
              <span>Leash at <code className="rounded bg-slate-100 px-1">{url}</code></span>
            ) : (
              <span className="font-medium text-amber-700">No leash: every payment is approved</span>
            )}
          </dd>
          <dt className="text-slate-500">Request signing secret</dt><dd>{config.authoriserSecret() ? "set" : "not set"}</dd>
          <dt className="text-slate-500">SEND_BASKET_DETAILS</dt>
          <dd>{config.sendBasketDetails() ? "true: line items are sent to the authoriser" : "false: only card-network fields are sent"}</dd>
          <dt className="text-slate-500">Webhook URLs</dt><dd>{hooks.length ? hooks.join(", ") : "none"}</dd>
        </dl>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-300">
            <p className="text-2xl font-semibold">{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-xl border border-red-200 bg-white p-5">
        <h2 className="font-semibold">Reset and reseed</h2>
        <p className="mt-1 text-sm text-slate-600">
          Deletes all carts, orders, authorisations, subscriptions, events and agent keys, then reloads the original merchants,
          products and reviews and switches every trap back on. The demo agent key from DEMO_AGENT_KEY is recreated.
        </p>
        <form action={resetDatabaseAction} className="mt-3 flex flex-wrap gap-2">
          <input name="confirm" placeholder="Type RESET" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
          <button className={btn}>Reset database</button>
        </form>
      </section>
    </div>
  );
}
