import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { listMerchants, searchProducts } from "@/lib/catalogue";
import { ProductGrid } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { MerchantLogo } from "@/components/MerchantLogo";

const CATEGORY_COLOUR: Record<string, string> = {
  running_shoes: "blue", trail_shoes: "green", football_boots: "black", socks: "grey",
  apparel: "blue", electronics: "black", groceries: "yellow", subscriptions: "blue",
};

export default async function HomePage() {
  const [{ items: running }, merchants] = await Promise.all([
    searchProducts({ category: "running_shoes", sort: "rating", limit: 8 }),
    listMerchants(),
  ]);
  return (
    <div className="space-y-12">
      <section className="rounded-2xl bg-blue-50 px-6 py-10 sm:px-10">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Gear, gadgets and groceries</h1>
        <p className="mt-2 max-w-xl text-slate-600">
          Shop running shoes, sports electronics and everyday basics from independent merchants. A test marketplace built for AI shopping agents.
        </p>
        <form action="/search" className="mt-6 flex max-w-lg">
          <input name="q" placeholder="Try “black running shoes”" className="w-full rounded-l-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600" />
          <button className="rounded-r-lg bg-blue-700 px-5 font-medium text-white hover:bg-blue-800">Search</button>
        </form>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Shop by category</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link key={c.id} href={`/search?category=${c.id}`} className="overflow-hidden rounded-xl border border-slate-200 hover:border-blue-300">
              <ProductImage category={c.id} colour={CATEGORY_COLOUR[c.id]} className="aspect-[2/1]" />
              <p className="px-3 py-2 text-sm font-medium">{c.label}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">Top-rated running shoes</h2>
          <Link href="/search?category=running_shoes" className="text-sm text-blue-700 hover:underline">See all</Link>
        </div>
        <ProductGrid products={running} />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Merchants</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {merchants.map((m) => (
            <Link key={m.id} href={`/merchants/${m.id}`} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 hover:border-blue-300">
              <MerchantLogo name={m.name} colour={m.brandColour} />
              <div>
                <p className="font-medium">{m.name}</p>
                <p className="line-clamp-1 text-sm text-slate-500">{m.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
