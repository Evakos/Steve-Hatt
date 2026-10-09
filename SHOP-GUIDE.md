# How it all fits together - Steve Hatt

Plain-terms guide for the shop team.

## The three parts (one-way flow)

1. **WordPress + WooCommerce** - the real "back shop". Products, prices and orders actually live here. It's the source of truth.
2. **Airtable** - a friendly front window over WordPress. Edit products in the **Steve Hatt Website** base, press **Sync now** in the admin, and it writes into WordPress. It's an *addition* to WordPress, not a replacement - nothing in WordPress becomes obsolete.
3. **The website** - the shopfront customers see. It *reads* from WordPress and displays the shop. This fast front end is simply **hosted on Vercel** - not a separate system you ever log into or manage.

So the loop is: **edit in Airtable → Sync → WordPress → the website shows it.** One direction, one button.

## How a payment works

**Every order is paid in full at checkout.** The card is charged the full total straight away, the customer gets a confirmation email, and the order lands on the Orders page already paid.

1. Customer checks out and pays in full.
2. The order appears under **Orders being prepared**.
3. Staff prepare it, then press **Mark complete** once collected or delivered.

- **Weights and prices:** the customer pays the price shown for the weight they chose. Any small difference after weighing is ignored for now.
- **Refunds:** there is no refund button. Refund in the Pay360 Merchant Portal, then update the order in WordPress.
- The Christmas deposit option still exists in the code behind a switch, but is off. Any old orders that were only held (not charged) would still show under **Awaiting capture**.

## Updating on the admin side

Everything happens in **`/admin`** (one shared staff login).

**Products page → "Sync now"**
- Change names, prices, descriptions, prep, origin, sustainability, storage → edit the **Website Products** table in Airtable → **Sync now**.
- Weight/size products (whole salmon, lobster, halibut, turbot, crab) → edit the **Website Variations** table. Each size is linked to its product, so you can also open a product and edit its sizes from inside it. Then **Sync now**.
- Sync only changes what you filled in. A blank cell leaves that field on the shop untouched.
- Rows or sizes with a problem (for example a price that isn't a number) are skipped and listed as errors after the sync, so nothing half-applied reaches the shop.

**Airtable tips**
- Open a record (the small expand arrow on a row) to see every field, including the long text like description, in one place.
- **Never edit** `product_id`, `variation_id` or `slug`. They link each row to the right product on the shop.
- Price, stock and Christmas fields can be edited freely. Status controls whether a product is visible: `publish` is live, `draft` is hidden.
- To hide a product without deleting it, set its `status` to `draft` and sync.
- New products: for now they are created in WordPress first, and their `product_id` is then added to Airtable. Creating them straight from Airtable is planned.

**Products page → Christmas controls**
- **Christmas ordering** - a switch you flip on/off when you choose; the 20-24 December slots appear automatically (closed Sun/Mon).
- **Default deposit (£)** - a blanket deposit, used only for products with no deposit of their own.

**Airtable columns (Website Products)**
| Column | What it does |
|---|---|
| `price`, `title`, `description`, `status`, `tag`, `preparation`, `origin`, `sustainability`, `storage` | day-to-day product content |
| `product_id`, `slug`, `category` | identifiers and reference only, do not edit |
| `Stock` | `In stock` / `Out of stock` (drives the Sold out badge) |
| `Excluded from Christmas?` | `Excluded` / `Included` |
| `Christmas price` | festive price (blank = normal price) |
| `Christmas deposit` | up-front deposit (blank = falls back to the Default) |

**Orders page**
- **Orders being prepared**: paid orders to prepare, then **Mark complete**.
- **Awaiting capture** only appears for old held orders.

**Sizes (Website Variations)**
| Column | What it does |
|---|---|
| `price` | price for that size |
| `variation_id`, `parent_product_id`, `Product` | link each size to its product, do not edit |

## Switching Christmas on (step by step)

**Before**
1. In Airtable (**Website Products**), fill in `Christmas price` for products that cost more at Christmas. Blank means the normal price.
2. Set `Excluded from Christmas?` to `Excluded` for anything that can't be held until December.
3. Check `Stock` and `status`, then press **Sync now** on the Products page. It should report no errors.
4. Size products (whole salmon, lobsters, halibut, turbot, dressed crab) use their normal size prices at Christmas for now.
5. Place one test order and check the emails and the Orders page.

**Switching on**
- Products page, **Christmas ordering** switch on, **Save changes**. It is instant and not tied to a date, so it goes on the day you flip it.
- Slots are Tuesday to Saturday between 20 and 24 December (the shop is closed Sunday and Monday).

**What happens to an order**
1. The customer pays in full at checkout and gets a confirmation email.
2. You get a new-order email.
3. The order appears under Orders as already paid, with a Christmas badge. Nothing to capture.
4. Prepare it for the slot, then mark it complete.

**Refunds and cancellations:** there is no refund button. Refund in the Pay360 Merchant Portal, then update the order in WordPress.

**Switching off:** turn the switch off any time. It also switches itself off after the last Christmas date.
