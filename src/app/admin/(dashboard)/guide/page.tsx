const SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/1u0g6qC-xsbrjuhRpha80i8MvZdM5frfKhX9fG0a_VUY/edit?usp=sharing";

export default function AdminGuidePage() {
  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-2xl font-bold text-navy">Admin Guide</h1>
      <p className="mt-1 text-base text-text-light">How payment capture and the product spreadsheet sync work.</p>

      <section className="mt-8 border border-border bg-white p-5" style={{ borderRadius: "5px" }}>
        <h2 className="font-medium text-navy">1. Capturing payment</h2>
        <div className="mt-3 space-y-3 text-base leading-relaxed text-text-light">
          <p>
            When a customer checks out, their card is only <strong className="text-navy">authorised</strong> (a
            hold placed for the estimated, weight-based total), never charged. The order sits as{" "}
            <strong className="text-navy">on-hold</strong> under Orders → Awaiting capture.
          </p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Weigh and prepare the order as normal.</li>
            <li>Open the order on the Orders page and enter the real final price for each line item.</li>
            <li>
              Click <strong className="text-navy">Capture payment</strong>. Pay360 doesn&apos;t support partial
              capture, so this always captures the <strong className="text-navy">full authorised amount</strong>{" "}
              first, then automatically refunds the difference down to the real weighed total.
            </li>
          </ol>
          <p>
            <strong className="text-navy">If the refund step fails</strong> after a successful full capture (rare,
            but possible), the order is marked <code className="text-xs">captured_refund_failed</code>, the
            difference needs to be refunded manually via the Pay360 Merchant Portal.
          </p>
          <p>
            <strong className="text-navy">If the final weighed total is higher</strong> than the original
            authorised amount, capture is blocked outright, that needs a brand new authorisation, which isn&apos;t
            supported yet, so call the customer and take payment another way.
          </p>
        </div>
      </section>

      <section className="mt-6 border border-border bg-white p-5" style={{ borderRadius: "5px" }}>
        <h2 className="font-medium text-navy">2. The 7-day clock</h2>
        <div className="mt-3 space-y-3 text-base leading-relaxed text-text-light">
          <p>
            Pay360 authorisations expire <strong className="text-navy">7 days</strong> after they&apos;re placed,
            after that, capture will likely fail outright. The order card shows an amber warning from day 5, and
            a red one once it&apos;s past 7 days. Capture orders promptly, don&apos;t let them sit.
          </p>
        </div>
      </section>

      <section className="mt-6 border border-border bg-white p-5" style={{ borderRadius: "5px" }}>
        <h2 className="font-medium text-navy">3. Christmas pre-orders</h2>
        <div className="mt-3 space-y-3 text-base leading-relaxed text-text-light">
          <p>
            Pre-orders can be placed as early as 1st November for delivery on 23rd–24th December, far beyond the
            7-day hold window. So for these, the card is only <strong className="text-navy">verified</strong> at
            checkout, no hold yet. A daily automated job places the real authorisation{" "}
            <strong className="text-navy">5 days before</strong> the delivery slot, using a stored card token.
          </p>
          <p>
            From that point the order behaves exactly like a normal one and appears in the usual capture queue
            above. If the re-authorisation is declined (expired card, insufficient funds, etc.), both the customer
            and staff get an email so it can be sorted out before the delivery date.
          </p>
          <p>
            Almost every product can be pre-ordered for Christmas by default, a few can be marked as excluded (see
            the spreadsheet sync below). Customers shop normally and choose Standard or Christmas at checkout,
            same as before, but if their basket has an item that&apos;s not Christmas-eligible, choosing Christmas
            is blocked with a message telling them to remove it first, so the two can&apos;t get mixed into one
            order without us noticing.
          </p>
        </div>
      </section>

      <section className="mt-6 border border-border bg-white p-5" style={{ borderRadius: "5px" }}>
        <h2 className="font-medium text-navy">4. Turning Christmas ordering on/off</h2>
        <div className="mt-3 space-y-3 text-base leading-relaxed text-text-light">
          <p>
            Whether customers see the option to shop for Christmas at all is controlled by a single site-wide
            switch, so it doesn&apos;t show up outside the pre-order season. There isn&apos;t a self-service button
            for this yet (it needs a Vercel API token this environment couldn&apos;t create), so for now flipping it
            means running one command:
          </p>
          <pre className="overflow-x-auto border border-border bg-cream p-3 text-xs text-navy" style={{ borderRadius: "5px" }}>
            {`vercel edge-config update ecfg_1xaio7etrgjc7pabu3esnegidumg --patch '[{"operation":"upsert","key":"christmasShopActive","value":true}]'`}
          </pre>
          <p>Use <code className="text-xs">value:false</code> to turn it back off. Takes effect immediately, no redeploy needed.</p>
        </div>
      </section>

      <section className="mt-6 border border-border bg-white p-5" style={{ borderRadius: "5px" }}>
        <h2 className="font-medium text-navy">5. Christmas seasonal price premium</h2>
        <div className="mt-3 space-y-3 text-base leading-relaxed text-text-light">
          <p>
            Christmas items (turkey, whole salmon, lobster etc.) typically cost more around the festive period.
            Rather than duplicating every seasonal product into a separate &quot;Christmas version&quot; with its
            own price (two catalogues to keep in sync, easy to get wrong), there&apos;s a single percentage
            premium that&apos;s added on top of the normal price, automatically, only once a customer has chosen
            to order for Christmas at checkout.
          </p>
          <p>
            <strong className="text-navy">This never shows up as a second price anywhere in the shop.</strong> Every
            product page and the shop grid always show one price, the same one, all year round. The premium is
            purely a checkout-time calculation, disclosed to the customer with a note next to the &quot;For
            Christmas&quot; option before they commit, then itemised as its own line in the order summary.
          </p>
          <p>Same mechanism as the on/off switch above, one more Edge Config value:</p>
          <pre className="overflow-x-auto border border-border bg-cream p-3 text-xs text-navy" style={{ borderRadius: "5px" }}>
            {`vercel edge-config update ecfg_1xaio7etrgjc7pabu3esnegidumg --patch '[{"operation":"upsert","key":"christmasPremiumPercent","value":10}]'`}
          </pre>
          <p>
            That example sets a 10% premium. Set <code className="text-xs">value:0</code> to switch it off without
            turning off Christmas ordering entirely. Takes effect immediately, no redeploy, and can be changed as
            often as needed through the season.
          </p>
        </div>
      </section>

      <section className="mt-6 border border-border bg-white p-5" style={{ borderRadius: "5px" }}>
        <h2 className="font-medium text-navy">6. Product spreadsheet sync</h2>
        <div className="mt-3 space-y-3 text-base leading-relaxed text-text-light">
          <p>
            Product details (title, price, status, description, tag, preparation, origin, sustainability, storage)
            can be edited in the{" "}
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
