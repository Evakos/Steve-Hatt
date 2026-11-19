# How it all fits together - Steve Hatt

Plain-terms guide for the shop team.

## The three parts (one-way flow)

1. **WordPress + WooCommerce** - the real "back shop". Products, prices and orders actually live here. It's the source of truth.
2. **Airtable** - a friendly front window over WordPress. Edit products in the **Steve Hatt Website** base and the shop updates by itself within a few seconds (the **Sync now** button in the admin is a backup). It's an *addition* to WordPress, not a replacement - nothing in WordPress becomes obsolete.
3. **The website** - the shopfront customers see. It *reads* from WordPress and displays the shop. This fast front end is simply **hosted on Vercel** - not a separate system you ever log into or manage.

So the loop is: **edit in Airtable → automatic sync → WordPress → the website shows it.** One direction, no button to press.

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

**Editing products (Airtable updates the shop by itself)**
- Change names, prices, descriptions, prep, origin, sustainability, storage → edit the **Website Products** table in Airtable. It is live within a few seconds.
- Weight/size products (whole salmon, lobster, halibut, turbot, crab) → edit the **Website Variations** table. Each size is linked to its product, so you can also open a product and edit its sizes from inside it.
- It works through an Airtable automation on each table. If a change doesn't appear, open **Automations → History** in Airtable and look for an error (a missing photo, a price that isn't a number). Errors show there, not on the row.
- **Products page → Sync now** re-sends everything and is still there as a backup.
- Sync only changes what you filled in. A blank cell leaves that field on the shop untouched.
- Rows or sizes with a problem (for example a price that isn't a number) are skipped and listed as errors after the sync, so nothing half-applied reaches the shop.

**Airtable tips**
- Open a record (the small expand arrow on a row) to see every field, including the long text like description, in one place.
- **Never edit** `product_id`, `variation_id` or `slug`. They link each row to the right product on the shop.
- Price, stock and Christmas fields can be edited freely. Status controls whether a product is visible: `publish` is live, `draft` is hidden.
- To hide a product without deleting it, set its `status` to `draft` and sync.
- New products: add a row in **Website Products** and leave `product_id` blank. It is added to the shop once it has a title, a price (or sizes), a category and a photo. New sizes work the same way in **Website Variations**.

**Products page → Christmas controls**
- **Christmas ordering** - a switch you flip on/off when you choose. It also needs the Christmas days picked on the **Delivery slots** page (**Choose days**); nothing is picked for you, and Christmas ordering isn't offered until some are.
- **Default deposit (£)** - a blanket deposit, used only for products with no deposit of their own.
- Customers choose **Standard** or **For Christmas** in the basket. The basket, mini-cart and checkout then show the Christmas prices. While Christmas is on, a product with a Christmas price also shows it in grey beside the normal price on its page.

**Delivery slots page → master switch**
- **Customers choose a time window at checkout** - slide it off and **Save changes** to remove the time windows for everyone. Customers still pick a delivery or collection date, just not a morning or afternoon time. A date is still offered unless all of its slots are switched off. Christmas orders still pick one of the Christmas days.

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
| `Christmas price` | what that size costs on a Christmas order (blank = the normal price) |
| `Christmas deposit` | deposit per unit of that size on a Christmas pre-order (blank = the product's deposit) |
| `variation_id`, `parent_product_id`, `Product` | link each size to its product, do not edit |

## Switching Christmas on (step by step)

**Before**
1. In Airtable (**Website Products**), fill in `Christmas price` for products that cost more at Christmas. Blank means the normal price.
2. Set `Excluded from Christmas?` to `Excluded` for anything that can't be held until December.
3. Check `Stock` and `status`. Edits go live on their own, and **Sync now** on the Products page re-sends everything and should report no errors.
4. Size products (whole salmon, lobsters, halibut, turbot, dressed crab): fill in `Christmas price` on each size in **Website Variations**. A blank size keeps its normal price.
5. Place one test order and check the emails and the Orders page.

**Switching on**
- Products page, **Christmas ordering** switch on, **Save changes**. It is instant and not tied to a date, so it goes on the day you flip it.
- The days customers can book are the Christmas days you pick on the **Delivery slots** page (**Choose days**, then **Save changes**). Pick them again each year. They are only offered for Christmas orders, never for a normal one.

**What happens to an order**
1. The customer pays in full at checkout and gets a confirmation email.
2. You get a new-order email.
3. The order appears under Orders as already paid, with a Christmas badge. Nothing to capture.
4. Prepare it for the slot, then mark it complete.

**Refunds and cancellations:** there is no refund button. Refund in the Pay360 Merchant Portal, then update the order in WordPress.

**Switching off:** turn the switch off any time. It also switches itself off after the last Christmas date.
