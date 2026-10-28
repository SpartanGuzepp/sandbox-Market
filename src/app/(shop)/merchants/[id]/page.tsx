import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMerchant, searchProducts } from "@/lib/catalogue";
import { countryName, formatDate } from "@/lib/format";
import { MerchantLogo } from "@/components/MerchantLogo";
import { ProductGrid } from "@/components/ProductCard";
import { Stars } from "@/components/Stars";

export async function generateMetadata({ params }: PageProps<"/merchants/[id]">): Promise<Metadata> {
  const m = await getMerchant((await params).id);
  return { title: m?.name ?? "Merchant not found" };
}

export default async function MerchantPage({ params }: PageProps<"/merchants/[id]">) {
  const { id } = await params;
  const m = await getMerchant(id);
  if (!m) notFound();
  const { items } = await searchProducts({ merchantId: id, limit: 100 });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start gap-4">
        <MerchantLogo name={m.name} colour={m.brandColour} size={64} />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{m.name}</h1>
          <Stars rating={m.rating} count={m.reviewCount} />
          <p className="mt-2 max-w-2xl text-slate-700">{m.description}</p>
        </div>
      </div>

      <dl className="grid max-w-3xl gap-x-6 gap-y-2 rounded-xl border border-slate-200 p-4 text-sm sm:grid-cols-[180px_1fr]">
        <dt className="text-slate-500">Country</dt><dd>{countryName(m.country)}</dd>
        <dt className="text-slate-500">On Sandbox Market since</dt><dd>{formatDate(m.joinedAt)}</dd>
        <dt className="text-slate-500">Merchant category code</dt><dd>{m.mcc}</dd>
        <dt className="text-slate-500">Currency</dt><dd>{m.currency}</dd>
        <dt className="text-slate-500">Return policy</dt><dd>{m.returnPolicy}</dd>
        <dt className="text-slate-500">Merchant id</dt><dd className="font-mono text-xs leading-5">{m.id}</dd>
      </dl>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Products ({items.length})</h2>
        <ProductGrid products={items} />
      </section>
    </div>
  );
}
