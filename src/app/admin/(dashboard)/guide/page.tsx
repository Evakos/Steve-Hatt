import { getProductSourceInfo } from "@/lib/product-source";

const pillars = [
  { title: "A fast shop", text: "The shopfront runs on a modern, quick front end, so customers browse and order without waiting." },
  { title: "Run it yourselves", text: "Edit products in Airtable, press Sync now, and the shop updates. No WordPress login needed." },
  { title: "Orders in one place", text: "New orders, preparation and completion are all handled on the Orders page of this admin." },
  { title: "Christmas made simple", text: "One switch turns Christmas ordering on. Customers pay in full up front, nothing to capture." },
];

export default function AdminGuidePage() {
  const source = getProductSourceInfo();
  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-navy">Admin Guide</h1>
      <p className="mt-2 text-sm text-text-light">How orders, payments, and the product sync work.</p>

      <section
        className="mt-6 bg-[#1a3a2a] p-6"
        style={{ borderRadius: "5px" }}
      >
        <p className="text-xs font-medium tracking-widest text-teal uppercase">The aim of this rebuild</p>
        <h2 className="mt-2 font-serif text-xl font-bold text-white">
          A fast, modern shop that the Steve Hatt team can run themselves.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/80">
          WordPress and WooCommerce stay as the back shop, where products and orders live. Customers use a quicker
          shopfront on top of it, and the team manages products from Airtable and orders from this admin, with
          straightforward payments.
        </p>
        <div className="mt-5 grid w-full gap-4 sm:grid-cols-2">
          {pillars.map((p) => (
            <div key={p.title} className="w-full bg-white/10 p-5" style={{ borderRadius: "5px" }}>
              <p className="text-sm font-medium text-white">{p.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-white/75">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
      <section className="border border-border bg-white p-6" style={{ borderRadius: "5px" }}>
        <h2 className="font-medium text-navy">Switching Christmas on, step by step</h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-text-light">
          <h3 className="font-medium text-navy">1. Before you switch it on</h3>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              In {source.name}, open <strong className="text-navy">{source.productsTable}</strong> and fill in{" "}
              <code className="text-[0.9em]">Christmas price</code> for every product that costs more at Christmas.
              A blank cell means the normal price is charged.
            </li>
            <li>
              Set <code className="text-[0.9em]">Excluded from Christmas?</code> to{" "}
              <code className="text-[0.9em]">Excluded</code> on anything that can&apos;t be held until December.
            </li>
            <li>
              Check <code className="text-[0.9em]">Stock</code> and <code className="text-[0.9em]">status</code> are
              right (<code className="text-[0.9em]">publish</code> is live, <code className="text-[0.9em]">draft</code> is hidden).
            </li>
            <li>
              Go to the <strong className="text-navy">Products</strong> page and click{" "}
              <strong className="text-navy">Sync now</strong>. It should report no errors.
            </li>
            <li>
              Size products (whole salmon, lobsters, halibut, turbot, dressed crab) always use their normal size
              prices at Christmas. A Christmas price isn&apos;t supported for sizes yet.
            </li>
            <li>
              Place one test order and check the confirmation email arrives and the order shows in Orders.
            </li>
          </ol>

          <h3 className="pt-1 font-medium text-navy">2. Switching it on</h3>
          <p>
            On the <strong className="text-navy">Products</strong> page, under Christmas ordering, turn the switch on
            and click <strong className="text-navy">Save changes</strong>. It takes effect straight away on the live
            site, with no redeploy. The switch is not tied to a date, so it goes on the day you flip it (for example
            1 November).
          </p>
          <p>
            Customers can then choose a Christmas order at checkout. The slots are{" "}
            <strong className="text-navy">Tuesday to Saturday between 20 and 24 December</strong>, because the shop is
            closed on Sunday and Monday. A basket containing an excluded product can&apos;t be booked for Christmas, and
            the customer is told which item to remove.
          </p>

          <h3 className="pt-1 font-medium text-navy">3. What happens to a Christmas order</h3>
          <ol className="list-decimal space-y-2 pl-5">
            <li>The customer pays the full total at checkout and gets a confirmation email.</li>
            <li>You get a new-order email.</li>
            <li>
              The order appears under <strong className="text-navy">Orders</strong> as already paid, with a Christmas
              badge. There is nothing to capture.
            </li>
            <li>Prepare it for the chosen slot, then mark it complete.</li>
          </ol>

          <h3 className="pt-1 font-medium text-navy">4. Cancellations and refunds</h3>
          <p>
            There is no refund button in this admin. To refund a Christmas order, use the Pay360 Merchant Portal, then
            update the order in WordPress.
          </p>

          <h3 className="pt-1 font-medium text-navy">5. Switching it off</h3>
          <p>
            Turn the switch off on the Products page at any time. It also switches itself off once the last Christmas
            date has passed.
          </p>
        </div>
      </section>

      <section className="border border-border bg-white p-6" style={{ borderRadius: "5px" }}>
        <h2 className="font-medium text-navy">Christmas pre-orders</h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-text-light">
          <p>
            By default, Christmas pre-orders are{" "}
            <strong className="text-navy">charged in full at checkout</strong>, the fixed
            Christmas prices make the total exact, so the order is authorised and captured
            immediately, just like a normal &quot;pay now&quot; order. No hold, no capture queue,
            no refund, the order moves straight to processing and appears under Orders to Processing.
          </p>
          <p>
            A <strong className="text-navy">legacy deposit/part-payment</strong> option is kept
            behind a feature flag on the Products page if the shop ever wants to switch back. When
            that flag is on, the card is only verified at checkout (no hold), a daily automated job
            places the real hold 5 days before the slot, and staff capture it on the day. An optional
            deposit can be taken upfront, with only the remaining balance held for later. The flag is
            off by default, the full-upfront model above is what runs.
          </p>
          <p>
            Almost every product can be pre-ordered for Christmas by default. A few can be marked as
            excluded (see the product sync below). Customers choose Standard or Christmas at
            checkout, same as before, if their basket has an excluded item, Christmas is blocked
            with a message telling them to remove it.
          </p>
          <p>
            The Christmas on/off switch and per-product Christmas prices are managed on the{" "}
            <strong className="text-navy">Products</strong> page, alongside the product sync.
            Both take effect immediately, no redeploy needed.
          </p>
        </div>
      </section>

      <section className="border border-border bg-white p-6" style={{ borderRadius: "5px" }}>
        <h2 className="font-medium text-navy">Product sync</h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-text-light">
          <p>
            Product details (title, price, stock, status, description, tag, preparation, origin, sustainability, storage,
            Christmas price, Christmas deposit) can be edited in the{" "}
            <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-navy underline hover:text-lobster">
              {source.name}
            </a>{" "}
            rather than logging into WordPress. On the <strong className="text-navy">Products</strong> page, click{" "}
            <strong className="text-navy">Sync now</strong> to pull the &quot;{source.productsTable}&quot; table and
            push any changes to the shop.
          </p>
          <p>
            Each row needs a <code className="text-[0.9em]">product_id</code> to match against, rows without one, or
            with malformed data (e.g. a non-numeric price, an invalid status), are skipped and listed as errors
            rather than silently applied. The sync also refreshes the site&apos;s product cache automatically, so
            changes show up on the shop straight away rather than waiting for the normal cache window.
          </p>
          <p>
            <strong className="text-navy">Weight/size-tiered products</strong> (Salmon Whole, Lobster Cooked,
            Lobster Live, Halibut Steaks, Turbot, Crab | Dressed) don&apos;t have a single price, each size is a
            separate WooCommerce variation. These live in the{" "}
            <strong className="text-navy">&quot;{source.variationsTable}&quot;</strong> table instead, matched by{" "}
            <code className="text-[0.9em]">variation_id</code> (not <code className="text-[0.9em]">product_id</code>).
            Sync now pulls both tables in one go.
          </p>
        </div>
      </section>

      {/* ── The capture queue (weight-based orders & legacy Christmas only) ── */}
      <section className="border border-border bg-white p-6" style={{ borderRadius: "5px" }}>
        <h2 className="font-medium text-navy">The capture queue</h2>
        <p className="mt-1 text-sm text-text-light">
          Only relevant for <strong>weight-based orders</strong> (fish priced by weight) and{" "}
          <strong>legacy Christmas orders</strong> when the deposit flag is on. Default Christmas
          full-upfront skips all of this.
        </p>

        <h3 className="mt-4 font-medium text-navy">How it works: authorise to capture</h3>
        <div className="mt-2 space-y-2 text-sm leading-relaxed text-text-light">
          <p>
            <strong className="text-navy">Authorise</strong> = place a hold, the card is checked
            and the money is ring-fenced, but nothing is taken yet.{" "}
            <strong className="text-navy">Capture</strong> = actually take the money for that hold.
          </p>
          <p>
            Fish is priced by weight, so the exact total isn&apos;t known at checkout. We hold an
            estimate, then take the real amount once staff weigh the order.
          </p>
        </div>

        <h3 className="mt-4 font-medium text-navy">Step by step</h3>
        <div className="mt-2 space-y-2 text-sm leading-relaxed text-text-light">
          <p>
            A new order lands as <strong className="text-navy">on-hold</strong> under Orders, then
            Awaiting capture, the card has been held but not charged.
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
            amount, capture is blocked, that needs a brand new authorisation, which isn&apos;t
            supported yet. Call the customer and take payment another way.
          </p>
          <p>
            <strong className="text-navy">If the refund step fails</strong> after a successful
            capture (rare), the order is marked{" "}
            <code className="text-[0.9em]">captured_refund_failed</code>, refund the difference
            manually via the Pay360 Merchant Portal.
          </p>
        </div>

        <h3 className="mt-4 font-medium text-navy">The 7-day clock</h3>
        <div className="mt-2 text-sm leading-relaxed text-text-light">
          <p>
            Pay360 holds expire <strong className="text-navy">7 days</strong> after they&apos;re
            placed, after that, capture will likely fail. The order card shows an amber warning
            from day 5, and a red one past 7 days. A daily email lists any expiring orders.
          </p>
        </div>
      </section>
      </div>
    </div>
  );
}
