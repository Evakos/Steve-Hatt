const SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/1u0g6qC-xsbrjuhRpha80i8MvZdM5frfKhX9fG0a_VUY/edit?usp=sharing";

export default function AdminGuidePage() {
  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-2xl font-bold text-navy">Admin Guide</h1>
      <p className="mt-1 text-base text-text-light">How orders, payments, and the product spreadsheet sync work.</p>

      <section className="mt-8 border border-border bg-white p-5" style={{ borderRadius: "5px" }}>
        <h2 className="font-medium text-navy">Christmas pre-orders</h2>
        <div className="mt-3 space-y-3 text-base leading-relaxed text-text-light">
          <p>
            By default, Christmas pre-orders are{" "}
            <strong className="text-navy">charged in full at checkout</strong> — the fixed
            Christmas prices make the total exact, so the order is authorised and captured
            immediately, just like a normal &quot;pay now&quot; order. No hold, no capture queue,
            no refund — the order moves straight to processing and appears under Orders → Processing.
          </p>
          <p>
            A <strong className="text-navy">legacy deposit/part-payment</strong> option is kept
            behind a feature flag on the Products page if the shop ever wants to switch back. When
            that flag is on, the card is only verified at checkout (no hold), a daily automated job
            places the real hold 5 days before the slot, and staff capture it on the day. An optional
            deposit can be taken upfront, with only the remaining balance held for later. The flag is
            off by default — the full-upfront model above is what runs.
          </p>
          <p>
            Almost every product can be pre-ordered for Christmas by default. A few can be marked as
            excluded (see the spreadsheet sync below). Customers choose Standard or Christmas at
            checkout, same as before — if their basket has an excluded item, Christmas is blocked
            with a message telling them to remove it.
          </p>
          <p>
            The Christmas on/off switch and per-product Christmas prices are managed on the{" "}
            <strong className="text-navy">Products</strong> page, alongside the spreadsheet sync.
            Both take effect immediately, no redeploy needed.
          </p>
        </div>
      </section>

      {/* ── The capture queue (weight-based orders & legacy Christmas only) ── */}
      <section className="mt-6 border border-border bg-white p-5" style={{ borderRadius: "5px" }}>
        <h2 className="font-medium text-navy">The capture queue</h2>
        <p className="mt-1 text-sm text-text-light">
          Only relevant for <strong>weight-based orders</strong> (fish priced by weight) and{" "}
          <strong>legacy Christmas orders</strong> when the deposit flag is on. Default Christmas
          full-upfront skips all of this.
        </p>

        <h3 className="mt-4 font-medium text-navy">How it works: authorise → capture</h3>
        <div className="mt-2 space-y-2 text-base leading-relaxed text-text-light">
          <p>
            <strong className="text-navy">Authorise</strong> = place a hold — the card is checked
            and the money is ring-fenced, but nothing is taken yet.{" "}
            <strong className="text-navy">Capture</strong> = actually take the money for that hold.
          </p>
          <p>
            Fish is priced by weight, so the exact total isn&apos;t known at checkout. We hold an
            estimate, then take the real amount once staff weigh the order.
          </p>
        </div>

        <h3 className="mt-4 font-medium text-navy">Step by step</h3>
        <div className="mt-2 space-y-2 text-base leading-relaxed text-text-light">
          <p>
            A new order lands as <strong className="text-navy">on-hold</strong> under Orders →
            Awaiting capture — the card has been held but not charged.
          </p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Weigh and prepare the order as normal.</li>
            <li>Open the order on the Orders page and enter the real final price for each line.</li>
            <li>
              Click <strong className="text-navy">Capture payment</strong>. Pay360 doesn&apos;t
              support partial capture, so it first captures the full authorised amount, then
              automatically refunds the difference down to the real weighed total.
            </li>
          </ol>
          <p>
            <strong className="text-navy">If the final total is higher</strong> than the authorised
            amount, capture is blocked — that needs a brand new authorisation, which isn&apos;t
            supported yet. Call the customer and take payment another way.
          </p>
          <p>
            <strong className="text-navy">If the refund step fails</strong> after a successful
            capture (rare), the order is marked{" "}
            <code className="text-xs">captured_refund_failed</code> — refund the difference
            manually via the Pay360 Merchant Portal.
          </p>
        </div>

        <h3 className="mt-4 font-medium text-navy">The 7-day clock</h3>
        <div className="mt-2 text-base leading-relaxed text-text-light">
          <p>
            Pay360 holds expire <strong className="text-navy">7 days</strong> after they&apos;re
            placed — after that, capture will likely fail. The order card shows an amber warning
            from day 5, and a red one past 7 days. A daily email lists any expiring orders.
          </p>
        </div>
      </section>

      <section className="mt-6 border border-border bg-white p-5" style={{ borderRadius: "5px" }}>
        <h2 className="font-medium text-navy">Product spreadsheet sync</h2>
        <div className="mt-3 space-y-3 text-base leading-relaxed text-text-light">
          <p>
            Product details (title, price, stock, status, description, tag, preparation, origin, sustainability, storage,
            Christmas price, Christmas deposit) can be edited in the{" "}
            <a href={SPREADSHEET_URL} target="_blank" rel="noopener noreferrer" className="text-navy underline hover:text-lobster">
              shared Google Sheet
            </a>{" "}
            rather than logging into WordPress. On the <strong className="text-navy">Products</strong> page, click{" "}
            <strong className="text-navy">Sync now</strong> to pull the sheet&apos;s &quot;Products&quot; tab and
            push any changes to the shop.
          </p>
          <p>
            Each row needs a <code className="text-xs">product_id</code> to match against, rows without one, or
            with malformed data (e.g. a non-numeric price, an invalid status), are skipped and listed as errors
            rather than silently applied. The sync also refreshes the site&apos;s product cache automatically, so
            changes show up on the shop straight away rather than waiting for the normal cache window.
          </p>
          <p>
            <strong className="text-navy">Weight/size-tiered products</strong> (Salmon Whole, Lobster Cooked,
            Lobster Live, Halibut Steaks, Turbot, Crab | Dressed) don&apos;t have a single price, each size is a
            separate WooCommerce variation. These live on the sheet&apos;s{" "}
            <strong className="text-navy">&quot;Variations&quot;</strong> tab instead, matched by{" "}
            <code className="text-xs">variation_id</code> (not <code className="text-xs">product_id</code>).
            Sync now pulls both tabs in one go.
          </p>
        </div>
      </section>
    </div>
  );
}
