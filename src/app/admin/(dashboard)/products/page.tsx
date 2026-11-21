import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import SyncProductsPanel from "./sync-products-panel";
import ChristmasSettingsPanel from "./christmas-settings-panel";
import PaymentModePanel from "./payment-mode-panel";
import { getProductSourceInfo } from "@/lib/product-source";
import { getServerEnv } from "@/lib/env";
import { isPaymentSandboxMode } from "@/lib/feature-flags";

const code = "text-[0.9em]";

/** One row of the notes accordion. Rows share a name, so opening one closes the others where the browser supports it. */
function Note({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details name="product-notes" className="group border-b border-border last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-medium text-navy transition-colors hover:bg-sand/50 [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="h-4 w-4 shrink-0 text-text-light transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <p className="px-5 pb-5 text-sm leading-relaxed text-text-light">{children}</p>
    </details>
  );
}

export default async function AdminProductsPage() {
  const source = getProductSourceInfo();
  const sandbox = await isPaymentSandboxMode();
  const mock = getServerEnv().CARDSTREAM_MOCK;
  return (
    <div className="max-w-4xl">
      <h1 className="font-serif text-2xl font-bold text-navy">Sync products from {source.name}</h1>
      <p className="mt-3 text-sm leading-relaxed text-text-light">
        Pulls the &quot;{source.productsTable}&quot; table from {source.name} and updates each product&apos;s title,
        price, publish status, stock, description, preparation options, origin, sustainability, storage text and
        Christmas pre-order eligibility on the live site.
      </p>

      <div className="mt-5 overflow-hidden border border-border bg-cream" style={{ borderRadius: "14px" }}>
        <Note title="Stock">
          Set a {source.rowWord}&apos;s <code className={code}>Stock</code> column to <code className={code}>In stock</code>{" "}
          or <code className={code}>Out of stock</code> to switch a product between available and sold out. Out-of-stock
          products still show in the shop but are marked &quot;Sold out&quot; and can&apos;t be added to an order.
        </Note>
        <Note title="Christmas eligibility">
          Almost every product can be pre-ordered for Christmas by default. Set{" "}
          <code className={code}>Excluded from Christmas?</code> to <code className={code}>Excluded</code> to opt a
          product out (<code className={code}>Included</code> or blank leaves it eligible).
        </Note>
        <Note title="Christmas price">
          Set <code className={code}>Christmas price</code> to override a product&apos;s price for Christmas orders only.
          Leave it blank to charge the normal price. While Christmas ordering is on it shows in grey beside the normal
          price, and it is charged once a customer has chosen to order for Christmas in the basket or at checkout.
        </Note>
        <Note title="Priced by weight">
          Set <code className={code}>Price type</code> to <code className={code}>per-kg</code> for a product sold by
          weight, and the customer picks a weight and pays the price for that weight. The{" "}
          <code className={code}>price</code> column is then the £ per kg. Use <code className={code}>per-piece</code>{" "}
          when the price is for each one, and <code className={code}>fixed</code> (or blank) for a single price.
        </Note>
        <Note title="Product page and home page">
          <code className={code}>Pack size</code> is the short note beside the price (for example Approx. 250g).{" "}
          <code className={code}>Preparation notes</code> holds one line per preparation option, written{" "}
          <code className={code}>Option: what it means</code>, and shows as the tooltip. Any option left out keeps the
          built-in wording. <code className={code}>Featured at Christmas</code> chooses the products shown in the
          Christmas section of the home page (up to 8, skipping anything out of stock or excluded).
        </Note>
        <Note title="Photos, category and page address">
          <code className={code}>Photo</code> is the product photo: drop a new one in and it goes on the shop within a few seconds
          (the first image is the main one). <code className={code}>category</code> must be one of the shop&apos;s categories
          (Cured, Fresh, Oysters, Shellfish, Smoked), with several separated by <code className={code}>|</code> and the
          first one shown. <code className={code}>slug</code> is the web address of the page: lowercase letters, numbers and
          hyphens only, and changing it breaks any link already shared, so leave it alone unless there is a reason.
        </Note>
        <Note title="Sizes">
          Weight and size products (Salmon Whole, Lobster, Halibut Steaks, Turbot, Crab | Dressed) have no single price,
          each size is its own WooCommerce variation. Sync also reads the &quot;{source.variationsTable}&quot; table and
          updates each size&apos;s <code className={code}>price</code> and <code className={code}>Size name</code> (the label
          customers see, such as Medium 750g), matched by <code className={code}>variation_id</code>. Each size can also have
          its own <code className={code}>Christmas price</code> and <code className={code}>Christmas deposit</code>; leave
          them blank for the normal price.
        </Note>
      </div>

      <div className="mt-4 border border-border bg-cream p-5" style={{ borderRadius: "14px" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-navy">Sync now</h2>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-navy underline hover:text-lobster"
          >
            {source.linkLabel}
          </a>
        </div>
        <SyncProductsPanel />
      </div>

      <h2 className="mt-12 font-serif text-xl font-bold text-navy">Christmas ordering</h2>
      <p className="mt-2 text-sm leading-relaxed text-text-light">
        Whether customers see the option to shop for Christmas at all, site-wide. Takes effect immediately, no redeploy
        needed.
      </p>
      <ChristmasSettingsPanel />

      <h2 className="mt-12 font-serif text-xl font-bold text-navy">Payment mode</h2>
      <p className="mt-2 text-sm leading-relaxed text-text-light">
        Live payments is off by default, which means sandbox: card payments go to Pay360&apos;s test system, so no real
        money moves and only test cards work. Tick it to take real payments. It takes effect immediately, no redeploy
        needed.
      </p>
      <PaymentModePanel initialSandbox={sandbox} mock={mock} />
    </div>
  );
}
