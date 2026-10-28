"use server";
// Server actions for the website's cart. They use the same cart service as the API.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api/errors";
import { addItem, createCart, loadCart, removeItem, updateItemQuantity } from "@/lib/cart/service";
import { logEvent } from "@/lib/events";
import { CART_COOKIE } from "./cart-cookie";

const WEB_ACTOR = { type: "web" as const, name: "Website visitor" };

async function getOrCreateWebCart() {
  const store = await cookies();
  const id = store.get(CART_COOKIE)?.value;
  if (id) {
    try {
      const cart = await loadCart(id, { channel: "web" });
      if (cart.status === "open") return cart;
    } catch {}
  }
  const cart = await createCart({ channel: "web" });
  store.set(CART_COOKIE, cart.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  await logEvent({ actor: WEB_ACTOR, type: "cart.created", cartId: cart.id, summary: `Created cart ${cart.id}` });
  return cart;
}

const errorMessage = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong.");

export async function addToCartAction(formData: FormData) {
  const productId = String(formData.get("product_id") ?? "");
  const size = formData.get("size") ? String(formData.get("size")) : null;
  const quantity = Number(formData.get("quantity") ?? 1);
  let error: string | null = null;
  try {
    const cart = await getOrCreateWebCart();
    const { product } = await addItem(cart, { productId, quantity, size });
    await logEvent({
      actor: WEB_ACTOR,
      type: "cart.item_added",
      cartId: cart.id,
      summary: `Added ${quantity} × ${product.title}${size ? ` (size ${size})` : ""}`,
      data: { product_id: productId, quantity, size },
    });
  } catch (e) {
    error = errorMessage(e);
  }
  if (error) redirect(`/products/${encodeURIComponent(productId)}?error=${encodeURIComponent(error)}`);
  redirect("/cart?added=1");
}

export async function updateQuantityAction(formData: FormData) {
  const itemId = String(formData.get("item_id"));
  const quantity = Number(formData.get("quantity"));
  let error: string | null = null;
  try {
    const cart = await getOrCreateWebCart();
    await updateItemQuantity(cart, itemId, quantity);
  } catch (e) {
    error = errorMessage(e);
  }
  redirect(error ? `/cart?error=${encodeURIComponent(error)}` : "/cart");
}

export async function removeItemAction(formData: FormData) {
  const itemId = String(formData.get("item_id"));
  let error: string | null = null;
  try {
    const cart = await getOrCreateWebCart();
    const removed = await removeItem(cart, itemId);
    await logEvent({ actor: WEB_ACTOR, type: "cart.item_removed", cartId: cart.id, summary: `Removed ${removed.productId} from cart` });
  } catch (e) {
    error = errorMessage(e);
  }
  redirect(error ? `/cart?error=${encodeURIComponent(error)}` : "/cart");
}
