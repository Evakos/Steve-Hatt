import type { ReactNode } from "react";
import {
  CalendarDays,
  CalendarOff,
  Check,
  ChevronDown,
  ClipboardList,
  CreditCard,
  Gift,
  RefreshCw,
  Snowflake,
  type LucideIcon,
} from "lucide-react";
import { getProductSourceInfo } from "@/lib/product-source";

const pillars = [
  { title: "One shop, all year", text: "The everyday shop and the Christmas shop are brought together, with a switch for Christmas ordering and its dated slots." },
  { title: "Fast and responsive", text: "A modern front end that loads quickly and responds instantly, so customers browse and order without waiting." },
  { title: "Better product information", text: "Origin, preparation, storage and sustainability on every product, so customers know exactly what they are buying." },
  { title: "Accurate, and run by you", text: "Product information is kept in Airtable, checked and owned by the shop, and updated with one click." },
];

const steps = [
  { title: "Update products", text: "Edit prices, stock and Christmas prices in Airtable, then press Sync now." },
  { title: "Switch Christmas on", text: "Use the switch on the Products page, on the day you choose." },
  { title: "Customer orders", text: "They pay in full at checkout and get a confirmation email." },
  { title: "Prepare the order", text: "It appears under Orders being prepared, already paid." },
  { title: "Mark complete", text: "Press Mark complete once it is collected or delivered." },
  { title: "Refund if needed", text: "Refund in the Pay360 portal, then update the order." },
];

const GREEN = "#1a3a2a";

/** One collapsible section: an icon, a title and a one-line summary, then the detail when opened. */
function Section({ icon: Icon, title, blurb, children }: { icon: LucideIcon; title: string; blurb: string; children: ReactNode }) {
  return (
    <details className="group border border-border bg-white shadow-sm" style={{ borderRadius: "20px" }}>
      <summary className="flex cursor-pointer list-none items-center gap-4 p-5 [&::-webkit-details-marker]:hidden">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-cream text-navy" style={{ borderRadius: "999px" }}>
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-navy">{title}</span>
          <span className="block text-sm text-text-light">{blurb}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-text-light transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-3 border-t border-border px-5 pt-4 pb-5 text-sm leading-relaxed text-text-light">{children}</div>
    </details>
  );
}

/** A heading for a group of sections. */
function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-8">
      <p className="text-xs font-medium tracking-widest text-text-light uppercase">{label}</p>
      <div className="mt-3 grid items-start gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
}

/** The date rule again, as a short green strip inside the sections where it matters. */
function DateRuleNote() {
  return (
    <p className="flex items-start gap-2 bg-[#e8f5ed] px-3 py-2.5 text-[#1a3a2a]" style={{ borderRadius: "10px" }}>
      <Snowflake className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        <strong>The date decides.</strong> Only a delivery or collection date from 20th to 24th December makes a
        Christmas order. The day the customer places the order makes no difference.
      </span>
    </p>
  );
}

export default function AdminGuidePage() {
  const source = getProductSourceInfo();
  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-navy">Admin Guide</h1>
      <p className="mt-2 text-sm text-text-light">How orders, slots, Christmas and the product sync work.</p>

      <section className="mt-6 bg-navy p-6" style={{ borderRadius: "20px" }}>
        <p className="text-xs font-medium tracking-widest text-teal uppercase">The aim of this rebuild</p>
        <h2 className="mt-2 font-serif text-xl font-bold text-white">
          One shop for the whole year: faster to use, with better product information.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/80">
          The everyday shop and the Christmas shop now live together, on a front end built for speed. Each product carries
          fuller information (origin, preparation, storage and sustainability), which the shop checks and keeps accurate in Airtable.
          WordPress and WooCommerce stay as the back shop, where products and orders live.
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

      {/* The rule that matters most, stated once loudly. */}
      <section className="mt-6 border border-[#1a3a2a]/20 bg-[#e8f5ed] p-6" style={{ borderRadius: "20px" }}>
        <p className="flex items-center gap-2 text-xs font-medium tracking-widest text-[#1a3a2a] uppercase">
          <Snowflake className="h-4 w-4" />
          The one rule to remember
        </p>
        <h2 className="mt-2 font-serif text-3xl font-bold text-[#1a3a2a]">The date decides</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#1a3a2a]/80">
          Whether an order is a Christmas order depends <strong>only on the delivery or collection date</strong> the customer
          picks. It does not matter when they place the order, or what is in the basket.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="border border-border bg-white p-5" style={{ borderRadius: "14px" }}>
            <p className="text-xs font-medium tracking-widest text-text-light uppercase">Any other date</p>
            <p className="mt-1 font-serif text-lg font-bold text-navy">A normal order</p>
            <ul className="mt-3 space-y-1.5 text-sm text-text-light">
              {["Normal prices", "Paid in full at checkout", "Marked Standard order"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-teal" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-5 text-white" style={{ borderRadius: "14px", backgroundColor: GREEN }}>
            <p className="text-xs font-medium tracking-widest text-white/60 uppercase">20th to 24th December, Tuesday to Saturday</p>
            <p className="mt-1 flex items-center gap-2 font-serif text-lg font-bold">
              <Snowflake className="h-4 w-4" />
              A Christmas order
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-white/85">
              {[
                "Christmas prices, where a product has one",
                "Paid in full at checkout",
                "Marked Christmas order, with a snowflake",
                "Products marked Excluded can't be on it",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-white" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-6 text-xs font-medium tracking-widest text-[#1a3a2a] uppercase">Examples</p>
        <ul className="mt-2 space-y-2 text-sm text-[#1a3a2a]/85">
          {[
            {
              tag: "Normal",
              text: "Ordered on 19 November for a date in early December. A normal order at normal prices, even if the customer plans to freeze it for Christmas.",
            },
            {
              tag: "Christmas",
              text: "Ordered on 19 November for a date from 20th to 24th December. A Christmas order at Christmas prices. The day they order changes nothing.",
            },
            {
              tag: "Closed",
              text: "Anything after 17th December. Online ordering is closed, whatever date they want.",
            },
          ].map((e) => (
            <li key={e.tag} className="flex items-start gap-3 bg-white/70 p-3" style={{ borderRadius: "10px" }}>
              <span
                className="mt-0.5 w-20 shrink-0 px-2 py-0.5 text-center text-[11px] font-semibold text-white"
                style={{ borderRadius: "999px", backgroundColor: e.tag === "Christmas" ? GREEN : e.tag === "Closed" ? "#b42318" : "#1f3a5f" }}
              >
                {e.tag}
              </span>
              <span>{e.text}</span>
            </li>
          ))}
        </ul>

        <p className="mt-5 max-w-3xl text-xs leading-relaxed text-[#1a3a2a]/70">
          At checkout the customer first picks Standard or Christmas, which only decides which dates they are shown. The
          date they end up choosing is what counts. The website checks it again itself when the order is placed, so a page
          left open, or an altered request, cannot give a normal date Christmas prices, or a Christmas date normal prices.
        </p>
      </section>

      <section className="mt-6 border border-border bg-white p-6 shadow-sm" style={{ borderRadius: "20px" }}>
        <h2 className="font-medium text-navy">How it works, at a glance</h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-6 lg:gap-0">
          {steps.map((step, i) => (
            <li key={step.title} className="relative lg:px-3 lg:text-center">
              {i < steps.length - 1 && (
                <span aria-hidden className="absolute top-5 left-1/2 hidden h-px w-full bg-border lg:block" />
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

      <p className="mt-10 text-sm font-medium text-navy">Detailed reference</p>
      <p className="mt-1 text-sm text-text-light">Open any section below for the full detail.</p>

      <Group label="Every day">
        <Section icon={ClipboardList} title="The Orders page" blurb="Tiles, colours and sorting.">
          <p>
            Each order is a tile. The coloured bar at the top says <strong className="text-navy">Delivery</strong> (red)
            or <strong className="text-navy">Collection</strong> (blue), and whether it is a{" "}
            <strong className="text-navy">Christmas order</strong> (with a snowflake) or a Standard order. Underneath are
            the order number, the customer, the delivery or collection time, and the items with their quantities and
            estimated weights. Delivery tiles also have a pink <strong className="text-navy">Deliver to</strong> box with
            the address and phone number, so whoever is driving has everything on the tile.
          </p>
          <p>
            Use the <strong className="text-navy">Sort by</strong> buttons at the top to reorder the tiles:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Oldest first (the default) or Newest first.</li>
            <li>Delivery or collection date, soonest first.</li>
            <li>Customer A to Z.</li>
            <li>Delivery first, Collection first, or Christmas first.</li>
          </ul>
          <p>
            Pending Christmas pre-orders appear in their own read-only section at the bottom, only when there are any.{" "}
            <strong className="text-navy">View website</strong> in the left-hand menu (or the Steve Hatt name above it)
            opens the shop&apos;s front page in a new tab. The red <strong className="text-navy">Sign out</strong> button
            is at the bottom of the menu.
          </p>
        </Section>

        <Section icon={CalendarDays} title="Delivery and collection slots" blurb="Switch slots on or off, months ahead.">
          <p>
            The <strong className="text-navy">Delivery slots</strong> page lists every day customers can book, about five
            months ahead, with one tab for each month. Each day has three slots: Delivery morning (9am-12pm), Delivery
            afternoon (12pm-5pm) and Collection (7am-5pm). Everything is on unless you switch it off.
          </p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Click a slot to switch it <strong className="text-navy">On</strong> or{" "}
              <strong className="text-navy">Off</strong>. Use <strong className="text-navy">Switch day off</strong> for a
              whole day, or <strong className="text-navy">Switch month off</strong> for the open month.
            </li>
            <li>
              Click <strong className="text-navy">Save changes</strong>. It is live on the website straight away, with no
              redeploy. A tab shows how many slots are off in that month.
            </li>
          </ol>
          <p>
            A slot that is off is hidden at checkout, and refused even if a customer already had the page open. Orders
            already placed for it are not cancelled.
          </p>
          <p>
            Sundays, Mondays and the Christmas break (25 December to 3 January) are never offered, so they are not
            listed. Customers can only book about three weeks ahead, plus the Christmas dates once Christmas is on, so
            switching off a later day simply closes it in advance. Good Friday is still listed, so switch it off if you
            are closed.
          </p>
          <DateRuleNote />
          <p>Christmas dates carry a snowflake and a Christmas tag in the list.</p>
        </Section>

        <Section icon={CreditCard} title="Payments and orders" blurb="Paid in full, refunds and weights.">
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
            <strong className="text-navy">Payment mode.</strong> On the <strong className="text-navy">Products</strong>{" "}
            page, under <strong className="text-navy">Payment mode</strong>, choose{" "}
            <strong className="text-navy">Sandbox</strong> (Pay360&apos;s test system, test cards only, no real money) or{" "}
            <strong className="text-navy">Live</strong> (real cards, real money), then{" "}
            <strong className="text-navy">Save changes</strong>. It starts on Sandbox, so nothing takes real money until
            you choose Live and confirm. While Sandbox is on, checkout shows a &quot;Sandbox mode&quot; notice above the
            card form.
          </p>
          <p>
            Nothing is held any more, so the <strong className="text-navy">Awaiting capture</strong> section is switched
            off on the Orders page. If an old held order ever needs capturing, ask for the section to be switched back on.
          </p>
        </Section>
      </Group>

      <Group label="Christmas">
        <Section icon={Snowflake} title="Switching Christmas on, step by step" blurb="Before, during and after.">
          <DateRuleNote />
          <h3 className="pt-1 font-medium text-navy">1. Before you switch it on</h3>
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
            <li>Place one test order and check the confirmation email arrives and the order shows in Orders.</li>
          </ol>

          <h3 className="pt-1 font-medium text-navy">2. Switching it on</h3>
          <p>
            On the <strong className="text-navy">Products</strong> page, under Christmas ordering, turn the switch on
            and click <strong className="text-navy">Save changes</strong>. It takes effect straight away on the live
            site, with no redeploy. It goes on the day you flip it (for example 1 November). Christmas ordering can only
            run from 1 October to 17 December, so a switch left on can never bring it back in January.
          </p>
          <p>
            Customers can then choose a Christmas order at checkout. The slots are{" "}
            <strong className="text-navy">Tuesday to Saturday between 20 and 24 December</strong>, because the shop is
            closed on Sunday and Monday. The booked date decides: any of those dates is a Christmas order with Christmas
            prices, and any other date is a normal order. A basket containing an excluded product can&apos;t be booked
            for a Christmas date, and the customer is told which item to remove.
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
            Turn the switch off on the Products page at any time. It also switches itself off after 17 December, when
            online ordering closes (see Closing for Christmas and reopening).
          </p>
        </Section>

        <Section icon={Gift} title="Christmas pre-orders" blurb="How a Christmas order is paid and chosen.">
          <DateRuleNote />
          <p>
            By default, Christmas pre-orders are <strong className="text-navy">charged in full at checkout</strong>, the
            fixed Christmas prices make the total exact, so the order is authorised and captured immediately, just like a
            normal &quot;pay now&quot; order. No hold, no capture queue, no refund, the order moves straight to
            processing and appears under Orders to Processing.
          </p>
          <p>
            A <strong className="text-navy">legacy deposit/part-payment</strong> option is kept behind a feature flag on
            the Products page if the shop ever wants to switch back. When that flag is on, the card is only verified at
            checkout (no hold), a daily automated job places the real hold 5 days before the slot, and staff capture it
            on the day. An optional deposit can be taken upfront, with only the remaining balance held for later. The flag
            is off by default, the full-upfront model above is what runs.
          </p>
          <p>
            Almost every product can be pre-ordered for Christmas by default. A few can be marked as excluded (see the
            product sync). Customers choose Standard or Christmas at checkout. Either way the booked date has the final
            say: 20 to 24 December is always a Christmas order and any other date never is. If the basket has an excluded
            item, Christmas is blocked with a message telling them to remove it.
          </p>
          <p>
            The Christmas on/off switch and per-product Christmas prices are managed on the{" "}
            <strong className="text-navy">Products</strong> page, alongside the product sync. Both take effect
            immediately, no redeploy needed.
          </p>
        </Section>

        <Section icon={CalendarOff} title="Closing for Christmas and reopening" blurb="Automatic, with an optional reopen date.">
          <p>
            Online ordering <strong className="text-navy">closes by itself after 17 December</strong> (UK time) and{" "}
            <strong className="text-navy">reopens by itself on 4 January</strong>. There is nothing to switch. While it is
            closed the website shows a banner explaining why, add to basket and checkout are blocked, and the order
            system refuses anything that slips through.
          </p>
          <p>
            To reopen on a different day, go to the <strong className="text-navy">Products</strong> page, find{" "}
            <strong className="text-navy">Reopening after Christmas</strong>, pick a date in January and click{" "}
            <strong className="text-navy">Save changes</strong>. It applies to that January only, and{" "}
            <strong className="text-navy">Use the default (4th January)</strong> puts it back.
          </p>
          <p>
            You do not need to remember to switch Christmas off. Christmas ordering only runs from 1 October to
            17 December, so a switch left on cannot bring it back in January.
          </p>
        </Section>
      </Group>

      <Group label="Products">
        <Section icon={RefreshCw} title="Product sync" blurb="Edit in Airtable, press Sync now.">
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
        </Section>
      </Group>
    </div>
  );
}
