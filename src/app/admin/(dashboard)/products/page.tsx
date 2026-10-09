import SyncProductsPanel from "./sync-products-panel";
import ChristmasSettingsPanel from "./christmas-settings-panel";
import { getProductSourceInfo } from "@/lib/product-source";

const code = "text-[0.9em]";

export default function AdminProductsPage() {
  const source = getProductSourceInfo();
  return (
    <div className="max-w-4xl">
      <h1 className="font-serif text-2xl font-bold text-navy">Sync products from {source.name}</h1>
      <p className="mt-3 text-sm leading-relaxed text-text-light">
        Pulls the &quot;{source.productsTable}&quot; table from {source.name} and updates each product&apos;s title,
        price, publish status, stock, description, preparation options, origin, sustainability, storage text and
        Christmas pre-order eligibility on the live site.
      </p>

      <ul className="mt-5 max-w-3xl list-disc space-y-3 pl-5 text-sm leading-relaxed text-text-light">
        <li>
          <strong className="font-medium text-navy">Stock.</strong> Set a {source.rowWord}&apos;s{" "}
          <code className={code}>Stock</code> column to <code className={code}>In stock</code> or{" "}
          <code className={code}>Out of stock</code> to switch a product between available and sold out. Out-of-stock
          products still show in the shop but are marked &quot;Sold out&quot; and can&apos;t be added to an order.
        </li>
        <li>
          <strong className="font-medium text-navy">Christmas eligibility.</strong> Almost every product can be
          pre-ordered for Christmas by default. Set <code className={code}>Excluded from Christmas?</code> to{" "}
          <code className={code}>Excluded</code> to opt a product out (<code className={code}>Included</code> or blank
          leaves it eligible).
        </li>
        <li>
          <strong className="font-medium text-navy">Christmas price.</strong> Set{" "}
          <code className={code}>Christmas price</code> to override a product&apos;s price for Christmas orders only.
          Leave it blank to charge the normal price. It never shows as a second price in the shop, it is applied once a
          customer has chosen to order for Christmas at checkout.
        </li>
        <li>
          <strong className="font-medium text-navy">Sizes.</strong> Weight and size products (Salmon Whole, Lobster,
          Halibut Steaks, Turbot, Crab | Dressed) have no single price, each size is its own WooCommerce variation.
          Sync also reads the &quot;{source.variationsTable}&quot; table and updates each size&apos;s{" "}
          <code className={code}>price</code>, matched by <code className={code}>variation_id</code>. Christmas pricing
          isn&apos;t supported for sizes yet.
        </li>
      </ul>

      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-block text-sm text-navy underline hover:text-lobster"
      >
        {source.linkLabel} →
      </a>

      <SyncProductsPanel />

      <h2 className="mt-12 font-serif text-xl font-bold text-navy">Christmas ordering</h2>
      <p className="mt-2 text-sm leading-relaxed text-text-light">
        Whether customers see the option to shop for Christmas at all, site-wide. Takes effect immediately, no redeploy
        needed.
      </p>
      <ChristmasSettingsPanel />
    </div>
  );
}
