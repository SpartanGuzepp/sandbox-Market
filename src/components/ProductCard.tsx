import Link from "next/link";
import type { ProductWithMerchant } from "@/lib/catalogue";
import { formatMoney } from "@/lib/money";
import { ProductImage } from "./ProductImage";
import { Stars } from "./Stars";

export function ProductCard({ p }: { p: ProductWithMerchant }) {
  return (
    <Link href={`/products/${p.id}`} className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-blue-300 hover:shadow-sm">
      <ProductImage category={p.category} colour={p.attributes.colour} className="aspect-[4/3]" />
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-xs text-slate-500">{p.merchant.name}</p>
        <h3 className="line-clamp-2 text-sm font-medium text-slate-900 group-hover:text-blue-700">{p.title}</h3>
        <Stars rating={p.rating} count={p.reviewCount} />
        <p className="mt-auto pt-1 font-semibold text-slate-900">
          {formatMoney(p.priceMinor, p.currency)}
          {p.isRecurring && <span className="text-sm font-normal text-slate-500"> / {p.billingInterval}</span>}
        </p>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: ProductWithMerchant[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} p={p} />
      ))}
    </div>
  );
}
