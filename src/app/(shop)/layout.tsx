import { Footer, Header } from "@/components/SiteChrome";
import { getWebCartView } from "@/lib/web/cart-cookie";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const cart = await getWebCartView();
  const cartCount = cart?.breakdown.lines.reduce((n, l) => n + l.quantity, 0) ?? 0;
  return (
    <>
      <Header cartCount={cartCount} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      <Footer />
    </>
  );
}
