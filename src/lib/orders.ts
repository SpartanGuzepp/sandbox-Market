// Read helpers for orders.
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { authorisations, merchants, orders } from "@/db/schema";

export async function getOrderWithAuth(orderId: string) {
  const [row] = await db
    .select({ order: orders, merchantName: merchants.name })
    .from(orders)
    .leftJoin(merchants, eq(orders.merchantId, merchants.id))
    .where(eq(orders.id, orderId));
  if (!row) return null;
  const [auth] = await db
    .select()
    .from(authorisations)
    .where(eq(authorisations.orderId, orderId))
    .orderBy(desc(authorisations.createdAt))
    .limit(1);
  return { ...row, auth: auth ?? null };
}
