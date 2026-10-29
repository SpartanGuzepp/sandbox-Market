// Small building blocks for the admin panel.
import Link from "next/link";

export const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/timeline", label: "Demo timeline ↗" },
  { href: "/admin/traps", label: "Traps" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/authorisations", label: "Authorisations" },
  { href: "/admin/activity", label: "Agent activity" },
  { href: "/admin/subscriptions", label: "Subscriptions" },
  { href: "/admin/agents", label: "Agent API keys" },
  { href: "/admin/webhooks", label: "Webhooks" },
  { href: "/admin/merchants", label: "Merchants" },
  { href: "/admin/products", label: "Products" },
];

export function PageTitle({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      {children && <p className="mt-1 max-w-3xl text-sm text-slate-600">{children}</p>}
    </div>
  );
}

export function Flash({ ok, error }: { ok?: string | string[]; error?: string | string[] }) {
  if (typeof ok === "string") return <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{ok}</p>;
  if (typeof error === "string") return <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;
  return null;
}

const DECISION_STYLE: Record<string, string> = {
  approve: "bg-green-100 text-green-800",
  decline: "bg-red-100 text-red-800",
  step_up: "bg-amber-100 text-amber-800",
};
export function DecisionBadge({ decision }: { decision: string | null }) {
  if (!decision) return <span className="text-slate-400">–</span>;
  return <span className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${DECISION_STYLE[decision] ?? "bg-slate-100"}`}>{decision.replace("_", " ")}</span>;
}

const STATUS_STYLE: Record<string, string> = {
  placed: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
  rejected_by_customer: "bg-red-100 text-red-800",
  awaiting_customer_approval: "bg-amber-100 text-amber-800",
  refunded: "bg-slate-200 text-slate-700",
  pending_authorisation: "bg-blue-100 text-blue-800",
};
export function StatusBadge({ status }: { status: string }) {
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status] ?? "bg-slate-100 text-slate-700"}`}>{status.replace(/_/g, " ")}</span>;
}

export function TrapBadge({ id }: { id: string }) {
  return <Link href="/admin/traps" className="rounded bg-red-50 px-1.5 py-0.5 font-mono text-xs text-red-700 ring-1 ring-red-200">{id}</Link>;
}

export function Json({ value }: { value: unknown }) {
  return <pre className="max-h-96 overflow-auto rounded-lg bg-slate-900 p-3 text-xs leading-relaxed text-slate-100">{JSON.stringify(value, null, 2)}</pre>;
}

export const th = "px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500";
export const td = "px-3 py-2 align-top text-sm";
export const tableWrap = "overflow-x-auto rounded-xl border border-slate-200 bg-white";
export const btn = "rounded-lg bg-blue-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-800";
export const btnSecondary = "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-blue-400";

export const fmtTime = (d: Date) => d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" });
