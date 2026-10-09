import SyncProductsPanel from "./sync-products-panel";
import ChristmasSettingsPanel from "./christmas-settings-panel";
import { getProductSourceInfo } from "@/lib/product-source";

export default function AdminProductsPage() {
  const source = getProductSourceInfo();
  return (
    <>
      <h1 className="font-serif text-2xl font-bold text-navy">Sync products from {source.name}</h1>
      <p className="mt-1 text-base text-text-light">
        Pulls the &quot;{source.productsTable}&quot; table from {source.name} and updates each product&apos;s title, price,
        publish status, stock, description, preparation options, origin, sustainability, storage text and Christmas
        pre-order eligibility on the live site.
      </p>
      <p className="mt-2 text-base text-text-light">
        Set a {source.rowWord}&apos;s <code className="text-[0.9em]">Stock</code> column to <code className="text-[0.9em]">In stock</code> or{" "}
        <code className="text-[0.9em]">Out of stock</code> to switch a product between available and sold out. Out-of-stock
        products still show in the shop but are marked &quot;Sold out&quot; and can&apos;t be added to an order.
      </p>
      <p className="mt-2 text-base text-text-light">
        Almost every product can be pre-ordered for Christmas by default. Set a {source.rowWord}&apos;s{" "}
        <code className="text-[0.9em]">Excluded from Christmas?</code> column to <code className="text-[0.9em]">Excluded</code> to
        opt a specific product out (<code className="text-[0.9em]">Included</code> or blank leaves it eligible).
      </p>
      <p className="mt-2 text-base text-text-light">
        Christmas items typically cost more around the festive period. Set a {source.rowWord}&apos;s{" "}
        <code className="text-[0.9em]">Christmas price</code> column to override that product&apos;s price, only for
        Christmas orders, same as previous years&apos; separate Christmas price list. Leave it blank to charge the
        normal price even at Christmas. It never shows up as a second price anywhere in the shop, it&apos;s applied
        once a customer has chosen to order for Christmas at checkout.
      </p>
      <p className="mt-2 text-base text-text-light">
        Weight/size-tiered products (Salmon Whole, Lobster, Halibut Steaks, Turbot, Crab | Dressed) have no single
        price of their own, each size is its own WooCommerce variation. Sync now also reads the{" "}
        <code className="text-[0.9em]">&quot;{source.variationsTable}&quot;</code> table and updates each size&apos;s price from its{" "}
        <code className="text-[0.9em]">price</code> column, matched by <code className="text-[0.9em]">variation_id</code>.
        Christmas pricing isn&apos;t supported for these yet.
      </p>
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-base text-navy underline hover:text-lobster"
      >
        {source.linkLabel} →
      </a>

      <SyncProductsPanel />

      <h2 className="mt-8 font-serif text-xl font-bold text-navy">Christmas ordering</h2>
      <p className="mt-1 text-base text-text-light">
        Whether customers see the option to shop for Christmas at all, site-wide. Takes effect immediately, no
        redeploy needed.
      </p>
      <ChristmasSettingsPanel />
    </>
  );
}
