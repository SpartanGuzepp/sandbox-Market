import Link from "next/link";
import type { Metadata } from "next";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import { listColours, searchProducts } from "@/lib/catalogue";
import { parseMajor } from "@/lib/money";
import { ProductGrid } from "@/components/ProductCard";

export const metadata: Metadata = { title: "Search" };

const PAGE_SIZE = 24;
const SORTS = [
  { id: "relevance", label: "Relevance" },
  { id: "price_asc", label: "Price: low to high" },
  { id: "price_desc", label: "Price: high to low" },
  { id: "rating", label: "Rating" },
] as const;

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" && sp[k] ? (sp[k] as string) : undefined);
  const q = str("q");
  const category = CATEGORIES.some((c) => c.id === str("category")) ? str("category") : undefined;
  const maxPrice = str("max_price");
  const colour = str("colour");
  const size = str("size");
  const sort = (SORTS.find((s) => s.id === str("sort"))?.id ?? "relevance") as (typeof SORTS)[number]["id"];
  const page = Math.max(1, Number(str("page") ?? 1) || 1);

  const [{ total, items }, colours] = await Promise.all([
    searchProducts({
      q,
      category,
      maxPriceMinor: maxPrice ? (parseMajor(maxPrice) ?? undefined) : undefined,
      colour,
      size,
      sort,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
    listColours(),
  ]);

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ q, category, max_price: maxPrice, colour, size, sort })) if (v) params.set(k, v);
    params.set("page", String(p));
    return `/search?${params}`;
  };
  const heading = q ? `Results for “${q}”` : category ? categoryLabel(category) : "All products";
  const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600";

  return (
    <div className="grid gap-8 md:grid-cols-[220px_1fr]">
      <aside>
        <form action="/search" className="space-y-4 rounded-xl border border-slate-200 p-4">
          <h2 className="font-semibold">Filters</h2>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Search</span>
            <input name="q" defaultValue={q} className={input} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Category</span>
            <select name="category" defaultValue={category ?? ""} className={input}>
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Max price (€)</span>
            <input name="max_price" inputMode="decimal" defaultValue={maxPrice} className={input} placeholder="e.g. 120" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Colour</span>
            <select name="colour" defaultValue={colour ?? ""} className={input}>
              <option value="">Any colour</option>
              {colours.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Size</span>
            <input name="size" defaultValue={size} className={input} placeholder="e.g. 42 or M" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Sort by</span>
            <select name="sort" defaultValue={sort} className={input}>
              {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>
          <button className="w-full rounded-lg bg-blue-700 py-2 text-sm font-medium text-white hover:bg-blue-800">Apply</button>
          <Link href="/search" className="block text-center text-sm text-blue-700 hover:underline">Clear filters</Link>
        </form>
      </aside>
      <section>
        <h1 className="text-2xl font-semibold">{heading}</h1>
        <p className="mb-4 text-sm text-slate-500">{total} {total === 1 ? "product" : "products"}</p>
        {items.length ? <ProductGrid products={items} /> : <p className="text-slate-600">No products match these filters.</p>}
        {total > PAGE_SIZE && (
          <div className="mt-6 flex gap-2">
            {page > 1 && <Link href={pageHref(page - 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">Previous</Link>}
            {page * PAGE_SIZE < total && <Link href={pageHref(page + 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">Next</Link>}
          </div>
        )}
      </section>
    </div>
  );
}
