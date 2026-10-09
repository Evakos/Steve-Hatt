import { ChevronDown } from "lucide-react";
import { getProductSourceInfo } from "@/lib/product-source";

const pillars = [
  { title: "A fast shop", text: "The shopfront runs on a modern, quick front end, so customers browse and order without waiting." },
  { title: "Run it yourselves", text: "Edit products in Airtable, press Sync now, and the shop updates. No WordPress login needed." },
  { title: "Paid at checkout", text: "Every order is paid in full at checkout and lands on the Orders page ready to prepare." },
  { title: "Christmas made simple", text: "One switch turns Christmas ordering on, with dated slots for the 20th to the 24th." },
];

const steps = [
  { title: "Update products", text: "Edit prices, stock and Christmas prices in Airtable, then press Sync now." },
  { title: "Switch Christmas on", text: "Use the switch on the Products page, on the day you choose." },
  { title: "Customer orders", text: "They pay in full at checkout and get a confirmation email." },
  { title: "Prepare the order", text: "It appears under Orders being prepared, already paid." },
  { title: "Mark complete", text: "Press Mark complete once it is collected or delivered." },
  { title: "Refund if needed", text: "Refund in the Pay360 portal, then update the order." },
];

export default function AdminGuidePage() {
  const source = getProductSourceInfo();
  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-navy">Admin Guide</h1>
      <p className="mt-2 text-sm text-text-light">How orders, payments, and the product sync work.</p>

      <section
        className="mt-6 bg-navy p-6"
        style={{ borderRadius: "20px" }}
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
            <div key={p.title} className="w-full bg-white/10 p-5" style={{ borderRadius: "14px" }}>
              <p className="text-sm font-medium text-white">{p.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-white/75">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 border border-border bg-white p-6 shadow-sm" style={{ borderRadius: "20px" }}>
        <h2 className="font-medium text-navy">How it works, at a glance</h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-6 lg:gap-0">
          {steps.map((step, i) => (
            <li key={step.title} className="relative lg:px-3 lg:text-center">
              {i < steps.length - 1 && (
                <span
                  aria-hidden
                  className="absolute top-5 left-1/2 hidden h-px w-full bg-border lg:block"
                />
              )}
              <span
                className="relative z-10 flex h-10 w-10 items-center justify-center bg-navy text-sm font-medium text-white lg:mx-auto"
                style={{ borderRadius: "999px" }}
              >
                {i + 1}
              </span>
              <p className="mt-3 text-sm font-medium text-navy">{step.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-text-light">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <p className="mt-8 text-sm font-medium text-navy">Detailed reference</p>
      <p className="mt-1 text-sm text-text-light">Open any section below for the full detail.</p>

      <div className="mt-4 grid items-start gap-6 md:grid-cols-2">
      <details className="group border border-border bg-white p-6 shadow-sm" style={{ borderRadius: "20px" }}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium text-navy [&::-webkit-details-marker]:hidden">
          {"Switching Christmas on, step by step"}
          <ChevronDown className="h-4 w-4 shrink-0 text-text-light transition-transform group-open:rotate-180" />
        </summary>
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
      </details>

      <details className="group border border-border bg-white p-6 shadow-sm" style={{ borderRadius: "20px" }}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium text-navy [&::-webkit-details-marker]:hidden">
          {"Christmas pre-orders"}
          <ChevronDown className="h-4 w-4 shrink-0 text-text-light transition-transform group-open:rotate-180" />
        </summary>
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
      </details>

      <details className="group border border-border bg-white p-6 shadow-sm" style={{ borderRadius: "20px" }}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium text-navy [&::-webkit-details-marker]:hidden">
          {"Product sync"}
          <ChevronDown className="h-4 w-4 shrink-0 text-text-light transition-transform group-open:rotate-180" />
        </summary>
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
      </details>

      <details className="group border border-border bg-white p-6 shadow-sm" style={{ borderRadius: "20px" }}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium text-navy [&::-webkit-details-marker]:hidden">
          {"Payments and orders"}
          <ChevronDown className="h-4 w-4 shrink-0 text-text-light transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-text-light">
          <p>
            <strong className="text-navy">Every order is paid in full at checkout</strong>, Christmas or not. The
            customer&apos;s card is charged the full total straight away and they get a confirmation email.
          </p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              The order arrives on the <strong className="text-navy">Orders</strong> page under{" "}
              <strong className="text-navy">Orders being prepared</strong>, already paid.
            </li>
            <li>Prepare it for the chosen delivery or collection slot.</li>
            <li>
              Click <strong className="text-navy">Mark complete</strong> once it has been collected or delivered.
            </li>
          </ol>
          <p>
            <strong className="text-navy">Weights and prices.</strong> For now, the customer pays the price shown for
            the weight they chose. Any small difference after weighing is ignored.
          </p>
          <p>
            <strong className="text-navy">Refunds and cancellations.</strong> There is no refund button in this admin.
            Refund in the Pay360 Merchant Portal, then update the order in WordPress.
          </p>
          <p>
            Older orders that were only held (not charged) would still appear under{" "}
            <strong className="text-navy">Awaiting capture</strong> on the Orders page, with a 7 day expiry warning. New
            orders no longer go there.
          </p>
        </div>
      </details>
      </div>
    </div>
  );
}
