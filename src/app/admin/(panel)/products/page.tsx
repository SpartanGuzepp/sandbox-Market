import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { attackScenarios, merchants, products } from "@/db/schema";
import { categoryLabel } from "@/lib/categories";
import { formatMoney } from "@/lib/money";
import { PageTitle, TrapBadge, tableWrap, td, th } from "@/components/admin";

export const metadata = { title: "Products" };

export default async function ProductsAdmin() {
  const [rows, traps] = await Promise.all([
    db.select({ p: products, merchant: merchants.name }).from(products).leftJoin(merchants, eq(products.merchantId, merchants.id)).orderBy(asc(products.merchantId), asc(products.id)),
    db.select().from(attackScenarios),
  ]);
  const trapsFor = (productId: string, merchantId: string, own: string | null) =>
    [...new Set([...(own ? [own] : []), ...traps.filter((t) => t.targetProductId === productId || t.targetMerchantId === merchantId).map((t) => t.id)])];
  return (
    <div>
      <PageTitle title="Products">All 60 products including trap-only ones. Red badges show which traps touch a product.</PageTitle>
      <div className={tableWrap}>
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>{["Product", "Merchant", "Category", "Price", "Shipping", "Traps"].map((h) => <th key={h} className={th}>{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ p, merchant }) => (
              <tr key={p.id}>
                <td className={td}><a href={`/products/${p.id}`} className="hover:text-blue-700">{p.title}</a><p className="font-mono text-xs text-slate-500">{p.id}</p></td>
                <td className={td}>{merchant}</td>
                <td className={td}>{categoryLabel(p.category)}</td>
                <td className={`${td} whitespace-nowrap`}>{formatMoney(p.priceMinor, p.currency)}{p.isRecurring && " / month"}</td>
                <td className={`${td} whitespace-nowrap`}>{formatMoney(p.shippingMinor, p.currency)}</td>
                <td className={td}><div className="flex flex-wrap gap-1">{trapsFor(p.id, p.merchantId, p.trapId).map((id) => <TrapBadge key={id} id={id} />)}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
