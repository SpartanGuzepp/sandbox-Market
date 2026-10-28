// Cart operations shared by the REST API (agents) and the website (humans).
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { cartItems, carts, products, type Cart } from "@/db/schema";
import { ApiError, notFound } from "@/lib/api/errors";
import { newId } from "@/lib/ids";
import { computeBreakdown, type Breakdown } from "./pricing";
import { getMerchant } from "@/lib/catalogue";

export const MAX_QUANTITY = 10;

export type CartView = {
  cart: Cart;
  merchant: { id: string; name: string } | null;
  breakdown: Breakdown;
};

export async function createCart(opts: { channel: "api" | "web"; agentKeyId?: string | null }) {
  const [cart] = await db
    .insert(carts)
    .values({ id: newId("crt"), channel: opts.channel, agentKeyId: opts.agentKeyId ?? null })
    .returning();
  return cart;
}

/** Load a cart. If `agentKeyId` is given, the cart must belong to that agent (others get a 404). */
export async function loadCart(cartId: string, owner?: { agentKeyId?: string; channel?: "web" }) {
  const [cart] = await db.select().from(carts).where(eq(carts.id, cartId)).limit(1);
  if (!cart) throw notFound("Cart", cartId);
  if (owner?.agentKeyId && cart.agentKeyId !== owner.agentKeyId) throw notFound("Cart", cartId);
  if (owner?.channel && cart.channel !== owner.channel) throw notFound("Cart", cartId);
  return cart;
}

export async function getCartView(cart: Cart): Promise<CartView> {
  const rows = await db
    .select({ item: cartItems, product: products })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.cartId, cart.id))
    .orderBy(asc(cartItems.createdAt), asc(cartItems.id));

  const breakdown = computeBreakdown(
    cart.currency,
    rows.map(({ item, product }) => ({
      itemId: item.id,
      productId: product.id,
      title: product.title,
      size: item.size,
      quantity: item.quantity,
      unitPriceMinor: product.priceMinor,
      shippingMinor: product.shippingMinor,
      isRecurring: product.isRecurring,
      billingInterval: product.billingInterval,
    })),
  );
  const m = cart.merchantId ? await getMerchant(cart.merchantId) : null;
  return { cart, merchant: m ? { id: m.id, name: m.name } : null, breakdown };
}

function assertOpen(cart: Cart) {
  if (cart.status !== "open") throw new ApiError(409, "cart_not_open", `Cart '${cart.id}' is ${cart.status} and can no longer be changed.`);
}

export async function addItem(cart: Cart, input: { productId: string; quantity: number; size?: string | null }) {
  assertOpen(cart);
  const [product] = await db.select().from(products).where(eq(products.id, input.productId)).limit(1);
  if (!product) throw notFound("Product", input.productId);

  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > MAX_QUANTITY) {
    throw new ApiError(400, "invalid_quantity", `Quantity must be a whole number from 1 to ${MAX_QUANTITY}.`);
  }

  // Size rules: required when the product has sizes, and must be one of them.
  const sizes = product.attributes.sizes ?? [];
  let size: string | null = null;
  if (sizes.length) {
    if (!input.size) {
      throw new ApiError(400, "size_required", `This product needs a size. Available sizes: ${sizes.join(", ")}.`, { available_sizes: sizes });
    }
    if (!sizes.includes(String(input.size))) {
      throw new ApiError(400, "invalid_size", `Size '${input.size}' is not available. Available sizes: ${sizes.join(", ")}.`, { available_sizes: sizes });
    }
    size = String(input.size);
  }

  // One cart = one merchant = one currency (= one card authorisation).
  if (cart.merchantId && cart.merchantId !== product.merchantId) {
    throw new ApiError(
      409,
      "merchant_mismatch",
      `This cart already contains items from merchant '${cart.merchantId}'. Each cart can only hold items from one merchant. Create a new cart for '${product.merchantId}'.`,
      { cart_merchant_id: cart.merchantId, product_merchant_id: product.merchantId },
    );
  }

  return db.transaction(async (tx) => {
    if (!cart.merchantId) {
      await tx.update(carts).set({ merchantId: product.merchantId, currency: product.currency }).where(eq(carts.id, cart.id));
    }
    const [existing] = await tx
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, product.id), size ? eq(cartItems.size, size) : undefined))
      .limit(1);
    let itemId: string;
    if (existing) {
      const qty = existing.quantity + input.quantity;
      if (qty > MAX_QUANTITY) throw new ApiError(400, "invalid_quantity", `A cart line can hold at most ${MAX_QUANTITY} units.`);
      await tx.update(cartItems).set({ quantity: qty }).where(eq(cartItems.id, existing.id));
      itemId = existing.id;
    } else {
      itemId = newId("itm");
      await tx.insert(cartItems).values({ id: itemId, cartId: cart.id, productId: product.id, quantity: input.quantity, size });
    }
    await tx.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cart.id));
    return { itemId, product };
  });
}

export async function updateItemQuantity(cart: Cart, itemId: string, quantity: number) {
  assertOpen(cart);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    throw new ApiError(400, "invalid_quantity", `Quantity must be a whole number from 1 to ${MAX_QUANTITY}.`);
  }
  const res = await db
    .update(cartItems)
    .set({ quantity })
    .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)))
    .returning();
  if (!res.length) throw notFound("Cart item", itemId);
  return res[0];
}

export async function removeItem(cart: Cart, itemId: string) {
  assertOpen(cart);
  const res = await db.delete(cartItems).where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id))).returning();
  if (!res.length) throw notFound("Cart item", itemId);
  // An empty cart is no longer tied to a merchant.
  const remaining = await db.select({ id: cartItems.id }).from(cartItems).where(eq(cartItems.cartId, cart.id)).limit(1);
  if (!remaining.length) await db.update(carts).set({ merchantId: null, currency: null }).where(eq(carts.id, cart.id));
  return res[0];
}
