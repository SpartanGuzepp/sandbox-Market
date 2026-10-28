// The website (for humans) keeps the visitor's cart id in a cookie.
import { cookies } from "next/headers";
import { getCartView, loadCart, type CartView } from "@/lib/cart/service";

export const CART_COOKIE = "sm_cart";

export async function getWebCartView(): Promise<CartView | null> {
  const id = (await cookies()).get(CART_COOKIE)?.value;
  if (!id) return null;
  try {
    const cart = await loadCart(id, { channel: "web" });
    if (cart.status !== "open") return null;
    return await getCartView(cart);
  } catch {
    return null;
  }
}
