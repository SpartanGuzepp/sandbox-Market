import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

export function SandboxBanner() {
  return (
    <div role="note" className="bg-blue-700 px-4 py-1.5 text-center text-sm font-medium text-white">
      Sandbox: fictional merchants, no real payments.
    </div>
  );
}

export function Header({ cartCount }: { cartCount: number }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-white">S</span>
          Sandbox Market
        </Link>
        <form action="/search" className="order-3 flex w-full sm:order-none sm:w-auto sm:flex-1">
          <input
            name="q"
            placeholder="Search shoes, socks, gadgets…"
            className="w-full rounded-l-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
          />
          <button className="rounded-r-lg bg-blue-700 px-4 text-sm font-medium text-white hover:bg-blue-800">Search</button>
        </form>
        <Link href="/cart" className="ml-auto text-sm font-medium text-slate-700 hover:text-blue-700 sm:ml-0">
          Cart{cartCount > 0 && <span className="ml-1 rounded-full bg-blue-700 px-2 py-0.5 text-xs text-white">{cartCount}</span>}
        </Link>
      </div>
      <nav className="mx-auto flex max-w-6xl gap-4 overflow-x-auto px-4 pb-2 text-sm text-slate-600">
        {CATEGORIES.map((c) => (
          <Link key={c.id} href={`/search?category=${c.id}`} className="whitespace-nowrap hover:text-blue-700">
            {c.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-4 py-6 text-sm text-slate-500">
        <p>Sandbox Market is a fictional test shop for AI shopping agents. No real goods, no real payments.</p>
        <p className="flex gap-4">
          <a href="/agents.md" className="text-blue-700 hover:underline">For AI agents</a>
          <a href="/api/v1/openapi.json" className="text-blue-700 hover:underline">API spec</a>
        </p>
      </div>
    </footer>
  );
}
