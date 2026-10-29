// The website (for humans) keeps the visitor's cart id in a cookie.
import { cookies } from "next/headers";
import { getCartView, loadCart, type CartStage, type CartView } from "@/lib/cart/service";

export const CART_COOKIE = "sm_cart";

export async function getWebCartView(stage: CartStage = "cart"): Promise<CartView | null> {
  const id = (await cookies()).get(CART_COOKIE)?.value;
  if (!id) return null;
  try {
    const cart = await loadCart(id, { channel: "web" });
    if (cart.status !== "open" && cart.status !== "awaiting_approval") return null;
    return await getCartView(cart, stage);
  } catch {
    return null;
  }
}
