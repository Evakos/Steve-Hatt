import { getAllProducts } from "@/lib/products";
import { isChristmasShopActive } from "@/lib/feature-flags";
import Header from "@/components/header";
import AnnouncementBanner from "@/components/announcement-banner";
import CartModeSwitcher from "@/components/cart-mode-switcher";
import ShopGrid from "./shop-grid";

export default async function ShopPage() {
  const [products, christmasActive] = await Promise.all([getAllProducts(), isChristmasShopActive()]);

  return (
    <main className="flex flex-1 flex-col">
      <AnnouncementBanner />
      <Header />

      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-xs tracking-widest text-text-light uppercase">Fresh today</p>
          <h1 className="mt-2 font-serif text-4xl font-bold text-navy">Shop All Fish</h1>
          <p className="mt-3 max-w-xl text-lg leading-relaxed text-text-light">
            {products.length} products, priced by weight where noted, the amount shown at checkout is an estimate;
            we confirm the exact final price once your order is prepared.
          </p>

          {christmasActive && (
            <div className="mt-6 max-w-md">
              <CartModeSwitcher />
            </div>
          )}

          <ShopGrid products={products} />
        </div>
      </section>
    </main>
  );
}
