import { asc } from "drizzle-orm";
import { db } from "@/db/client";
import { merchants } from "@/db/schema";
import { countryName, formatDate } from "@/lib/format";
import { MerchantLogo } from "@/components/MerchantLogo";
import { PageTitle, TrapBadge, tableWrap, td, th } from "@/components/admin";

export const metadata = { title: "Merchants" };

const LABEL_STYLE: Record<string, string> = {
  reputable: "bg-green-100 text-green-800",
  new_legitimate: "bg-blue-100 text-blue-800",
  shady: "bg-red-100 text-red-800",
  lookalike: "bg-red-100 text-red-800",
};

export default async function MerchantsAdmin() {
  const rows = await db.select().from(merchants).orderBy(asc(merchants.name));
  return (
    <div>
      <PageTitle title="Merchants">Includes the hidden trust profile (ground truth). Agents never see this column.</PageTitle>
      <div className={tableWrap}>
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>{["Merchant", "Country", "MCC", "Joined", "Rating", "Trust profile (hidden)"].map((h) => <th key={h} className={th}>{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((m) => (
              <tr key={m.id}>
                <td className={td}>
                  <div className="flex items-center gap-2">
                    <MerchantLogo name={m.name} colour={m.brandColour} size={28} />
                    <div><a href={`/merchants/${m.id}`} className="hover:text-blue-700">{m.name}</a><p className="font-mono text-xs text-slate-500">{m.id}</p></div>
                  </div>
                </td>
                <td className={td}>{countryName(m.country)}</td>
                <td className={`${td} font-mono`}>{m.mcc}</td>
                <td className={`${td} whitespace-nowrap`}>{formatDate(m.joinedAt)}</td>
                <td className={td}>{m.rating} ({m.reviewCount.toLocaleString("en-GB")})</td>
                <td className={td}>
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${LABEL_STYLE[m.trustProfile.label]}`}>{m.trustProfile.label}</span>
                  {m.trapId && <span className="ml-2"><TrapBadge id={m.trapId} /></span>}
                  <p className="mt-1 max-w-md text-xs text-slate-600">{m.trustProfile.notes}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
