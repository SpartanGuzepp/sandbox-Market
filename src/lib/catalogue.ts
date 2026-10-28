// Read-only catalogue queries shared by the web pages and the REST API,
// so humans and agents always see the same data.
import { and, asc, desc, eq, ilike, inArray, lte, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { merchants, products, reviews, type Merchant, type Product, type Review } from "@/db/schema";

export type ProductWithMerchant = Product & {
  merchant: Pick<Merchant, "id" | "name" | "country" | "brandColour">;
  rating: number | null;
  reviewCount: number;
};

export type SearchParams = {
  q?: string;
  category?: string;
  maxPriceMinor?: number;
  colour?: string;
  size?: string;
  merchantId?: string;
  sort?: "relevance" | "price_asc" | "price_desc" | "rating";
  limit?: number;
  offset?: number;
};

/** Very light stemming so "shoes" finds "shoe" and "socks" finds "sock". */
function stem(word: string) {
  return word.length > 3 && word.endsWith("s") ? word.slice(0, -1) : word;
}

const ratingSql = sql<number | null>`(select round(avg(${reviews.rating})::numeric, 1)::float from ${reviews} where ${reviews.productId} = ${products.id})`;
const reviewCountSql = sql<number>`(select count(*)::int from ${reviews} where ${reviews.productId} = ${products.id})`;

const productSelect = {
  product: products,
  merchant: { id: merchants.id, name: merchants.name, country: merchants.country, brandColour: merchants.brandColour },
  rating: ratingSql,
  reviewCount: reviewCountSql,
};

type Row = { product: Product; merchant: ProductWithMerchant["merchant"]; rating: number | null; reviewCount: number };
const flatten = (r: Row): ProductWithMerchant => ({ ...r.product, merchant: r.merchant, rating: r.rating, reviewCount: r.reviewCount });

export async function searchProducts(p: SearchParams): Promise<{ total: number; items: ProductWithMerchant[] }> {
  const conds: SQL[] = [];
  const words = (p.q ?? "")
    .toLowerCase()
    .split(/[^a-z0-9äöüéèàß%-]+/i)
    .filter(Boolean)
    .map(stem);
  for (const w of words) {
    const like = `%${w}%`;
    conds.push(
      or(
        ilike(products.title, like),
        ilike(products.description, like),
        sql`replace(${products.category}, '_', ' ') ilike ${like}`,
        sql`${products.attributes}->>'colour' ilike ${like}`,
        ilike(merchants.name, like),
      )!,
    );
  }
  if (p.category) conds.push(eq(products.category, p.category));
  if (p.maxPriceMinor !== undefined) conds.push(lte(products.priceMinor, p.maxPriceMinor));
  if (p.colour) conds.push(sql`lower(${products.attributes}->>'colour') = ${p.colour.toLowerCase()}`);
  if (p.size) conds.push(sql`${products.attributes}->'sizes' ? ${p.size}`);
  if (p.merchantId) conds.push(eq(products.merchantId, p.merchantId));
  const where = conds.length ? and(...conds) : undefined;

  const order =
    p.sort === "price_asc"
      ? [asc(products.priceMinor), asc(products.id)]
      : p.sort === "price_desc"
        ? [desc(products.priceMinor), asc(products.id)]
        : p.sort === "rating"
          ? [sql`${ratingSql} desc nulls last`, asc(products.id)]
          : // relevance: titles that contain the first search word come first
            words.length
            ? [sql`case when ${products.title} ilike ${`%${words[0]}%`} then 0 else 1 end`, asc(products.title), asc(products.id)]
            : [asc(products.category), asc(products.title), asc(products.id)];

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .innerJoin(merchants, eq(products.merchantId, merchants.id))
    .where(where);

  const rows = await db
    .select(productSelect)
    .from(products)
    .innerJoin(merchants, eq(products.merchantId, merchants.id))
    .where(where)
    .orderBy(...order)
    .limit(Math.min(p.limit ?? 20, 100))
    .offset(p.offset ?? 0);

  return { total: count, items: rows.map(flatten) };
}

export async function getProduct(id: string): Promise<(ProductWithMerchant & { reviews: Review[] }) | null> {
  const [row] = await db
    .select(productSelect)
    .from(products)
    .innerJoin(merchants, eq(products.merchantId, merchants.id))
    .where(eq(products.id, id))
    .limit(1);
  if (!row) return null;
  const revs = await db.select().from(reviews).where(eq(reviews.productId, id)).orderBy(desc(reviews.createdAt));
  return { ...flatten(row), reviews: revs };
}

export async function getProductsByIds(ids: string[]): Promise<ProductWithMerchant[]> {
  if (!ids.length) return [];
  const rows = await db
    .select(productSelect)
    .from(products)
    .innerJoin(merchants, eq(products.merchantId, merchants.id))
    .where(inArray(products.id, ids));
  return rows.map(flatten);
}

export async function getMerchant(id: string): Promise<(Merchant & { productCount: number }) | null> {
  const [m] = await db.select().from(merchants).where(eq(merchants.id, id)).limit(1);
  if (!m) return null;
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(eq(products.merchantId, id));
  return { ...m, productCount: count };
}

export async function listMerchants(): Promise<Merchant[]> {
  return db.select().from(merchants).orderBy(asc(merchants.name));
}

export async function listColours(): Promise<string[]> {
  const rows = await db.execute<{ colour: string }>(
    sql`select distinct lower(attributes->>'colour') as colour from products where attributes->>'colour' is not null order by 1`,
  );
  return rows.map((r) => r.colour);
}
