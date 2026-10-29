import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { adminLogoutAction } from "@/lib/admin/actions";
import { NAV } from "@/components/admin";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · Sandbox Market" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="flex flex-1 flex-col bg-slate-50 md:flex-row">
      <aside className="border-b border-slate-200 bg-white md:w-56 md:border-r md:border-b-0">
        <div className="flex items-center justify-between px-4 py-4">
          <Link href="/admin" className="font-semibold">Admin</Link>
          <Link href="/" className="text-xs text-blue-700 hover:underline">View shop</Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-3 text-sm md:flex-col md:overflow-visible">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-lg px-3 py-1.5 text-slate-700 hover:bg-blue-50 hover:text-blue-800">
              {n.label}
            </Link>
          ))}
          <form action={adminLogoutAction} className="md:mt-4">
            <button className="whitespace-nowrap rounded-lg px-3 py-1.5 text-left text-slate-500 hover:text-red-600">Log out</button>
          </form>
        </nav>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
