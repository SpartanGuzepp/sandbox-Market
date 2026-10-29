"use client";
// Projector-friendly live timeline: agent action -> authorisation decision -> reason.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TIMELINE_BROWSING, type TimelineEvent } from "@/lib/timeline";

type Feed = { items: TimelineEvent[]; config: { leash: string; basketDetails: boolean } };

const DECISION = {
  approve: { label: "APPROVED", box: "border-green-500 bg-green-50", text: "text-green-700" },
  decline: { label: "DECLINED", box: "border-red-500 bg-red-50", text: "text-red-700" },
  step_up: { label: "ASK CUSTOMER", box: "border-amber-500 bg-amber-50", text: "text-amber-700" },
} as const;

const ICON: Record<string, string> = {
  "cart.created": "🛒", "cart.item_added": "➕", "cart.item_updated": "✏️", "cart.item_removed": "➖", "cart.addon_removed": "✂️",
  "checkout.attempted": "💳", "charge.attempted": "🔁", "order.placed": "✅", "order.declined": "⛔",
  "order.awaiting_customer_approval": "📱", "order.customer_approved": "👍", "order.customer_rejected": "👎", "order.refunded": "↩️",
  "product.searched": "🔎", "product.viewed": "👀", "merchant.viewed": "🏪", "trap.toggled": "🪤", "admin.reset": "🔄",
};

const time = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export function Timeline() {
  const [items, setItems] = useState<TimelineEvent[]>([]);
  const [cfg, setCfg] = useState<Feed["config"] | null>(null);
  const [showBrowsing, setShowBrowsing] = useState(false);
  const [clearedAt, setClearedAt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const lastId = useRef(0);

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const res = await fetch(`/admin/timeline/feed?after=${lastId.current}`, { cache: "no-store" });
        if (res.status === 401) return setError("Logged out. Log in to the admin panel again.");
        const feed: Feed = await res.json();
        if (stop) return;
        setCfg(feed.config);
        setError(null);
        if (feed.items.length) {
          lastId.current = Math.max(lastId.current, feed.items[feed.items.length - 1].id);
          // Merge without duplicates (a slow request and a fresh one can return the same events).
          setItems((prev) => {
            const seen = new Set(prev.map((e) => e.id));
            return [...prev, ...feed.items.filter((e) => !seen.has(e.id))].slice(-300);
          });
        }
      } catch {
        setError("Connection lost, retrying…");
      }
      if (!stop) setTimeout(tick, 2000);
    };
    tick();
    return () => {
      stop = true;
    };
  }, []);

  const visible = items
    .filter((e) => e.id > clearedAt)
    .filter((e) => showBrowsing || !TIMELINE_BROWSING.includes(e.type))
    .reverse();

  return (
    <div className="flex-1 bg-white">
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-4 border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-2xl font-semibold">Live payment timeline</h1>
        {cfg && (
          <div className="flex gap-2 text-base">
            <span className={`rounded-full px-3 py-1 font-medium ${cfg.leash === "leash" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}`}>
              {cfg.leash === "leash" ? "Leash connected" : "No leash: everything approved"}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1">Basket details {cfg.basketDetails ? "ON" : "OFF"}</span>
          </div>
        )}
        <div className="ml-auto flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={showBrowsing} onChange={(e) => setShowBrowsing(e.target.checked)} /> Show browsing</label>
          <button onClick={() => setClearedAt(lastId.current)} className="rounded-lg border border-slate-300 px-3 py-1.5 hover:border-blue-400">Clear screen</button>
          <Link href="/admin" className="text-blue-700 hover:underline">Admin</Link>
        </div>
      </header>
      {error && <p className="bg-red-50 px-6 py-2 text-red-700">{error}</p>}

      <ol className="mx-auto max-w-5xl space-y-3 px-6 py-6">
        {visible.length === 0 && <li className="py-20 text-center text-2xl text-slate-400">Waiting for agent activity…</li>}
        {visible.map((e) => {
          if (e.type === "authorisation.result") {
            const d = DECISION[e.data.decision as keyof typeof DECISION] ?? DECISION.decline;
            const amount = ((e.data.amount_minor as number) / 100).toFixed(2);
            return (
              <li key={e.id} className={`rounded-2xl border-l-8 p-5 ${d.box}`}>
                <div className="flex flex-wrap items-baseline gap-4">
                  <span className={`text-3xl font-bold tracking-wide ${d.text}`}>{d.label}</span>
                  <span className="text-2xl font-medium">€{amount}</span>
                  <span className="text-lg text-slate-500">{e.actorName} · {time(e.ts)}</span>
                </div>
                <p className="mt-2 text-2xl leading-snug text-slate-900">{String(e.data.reason)}</p>
              </li>
            );
          }
          const traps = Array.isArray(e.data.active_traps) ? (e.data.active_traps as string[]) : [];
          const small = TIMELINE_BROWSING.includes(e.type);
          return (
            <li key={e.id} className={`flex items-start gap-4 rounded-xl px-4 py-3 ${small ? "text-lg text-slate-600" : "bg-slate-50 text-xl"}`}>
              <span className="w-8 text-center" aria-hidden>{ICON[e.type] ?? "•"}</span>
              <div className="min-w-0 flex-1">
                <span className="font-semibold">{e.actorName ?? e.actorType}</span> <span>{e.summary}</span>
                {traps.length > 0 && <span className="ml-2 rounded bg-red-600 px-2 py-0.5 text-base font-semibold text-white">trap {traps.join(", ")}</span>}
              </div>
              <span className="whitespace-nowrap text-base text-slate-400">{time(e.ts)}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
