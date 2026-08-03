import SyncProductsPanel from "./sync-products-panel";

const SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/1u0g6qC-xsbrjuhRpha80i8MvZdM5frfKhX9fG0a_VUY/edit?usp=sharing";

export default function AdminProductsPage() {
  return (
    <>
      <h1 className="font-serif text-2xl font-bold text-navy">Sync products from Google Sheet</h1>
      <p className="mt-1 text-base text-text-light">
        Pulls the &quot;Products&quot; tab of the shared spreadsheet and updates each product&apos;s title, price,
        publish status, description, preparation options, origin, sustainability, storage text and Christmas
        pre-order eligibility on the live site.
      </p>
      <p className="mt-2 text-sm text-text-light">
        Almost every product can be pre-ordered for Christmas by default. Set a row&apos;s{" "}
        <code className="text-xs">excluded_from_christmas</code> column to <code className="text-xs">true</code> to
        opt a specific product out (leave blank to leave it eligible).
      </p>
      <p className="mt-2 text-sm text-text-light">
        Weight/size-tiered products (Salmon Whole, Lobster, Halibut Steaks, Turbot, Crab | Dressed) have no single
        price of their own, each size is its own WooCommerce variation. Sync now also reads the{" "}
        <code className="text-xs">&quot;Variations&quot;</code> tab and updates each size&apos;s price from its{" "}
        <code className="text-xs">price</code> column, matched by <code className="text-xs">variation_id</code>.
      </p>
      <a
        href={SPREADSHEET_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-base text-navy underline hover:text-lobster"
      >
        Open the spreadsheet →
      </a>

      <SyncProductsPanel />
    </>
  );
}
