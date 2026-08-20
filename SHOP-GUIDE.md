# How it all fits together — Steve Hatt

Plain-terms guide for the shop team.

## The three parts (one-way flow)

1. **WordPress + WooCommerce** — the real "back shop". Products, prices and orders actually live here. It's the source of truth.
2. **The Google Sheet** — a friendly front window over WordPress. Edit products here, press **Sync now**, and it writes into WordPress. It's an *addition* to WordPress, not a replacement — nothing in WordPress becomes obsolete.
3. **The website** — the shopfront customers see. It *reads* from WordPress and displays the shop. This fast front end is simply **hosted on Vercel** — not a separate system you ever log into or manage.

So the loop is: **edit in the sheet → Sync → WordPress → the website shows it.** One direction, one button.

## How a payment works (authorise → capture)

- **Authorise = a hold.** The card is checked and the money is *ring-fenced* — but nothing is taken yet.
- **Capture = actually taking the money** for a previously-held amount.

Fish is priced by weight, so the final price isn't known at checkout. So we **hold an estimate now, weigh it, then take the real amount**:

1. Checkout → **hold** the estimated total.
2. Staff weigh the fish → the **real price** is now known.
3. Staff press **Capture** → the money is taken.

Two rules that matter:

- **Holds expire after 7 days.** Capture within 7 days or it fails.
- **Capture always takes the full held amount** — if the real total is less, we refund the difference.

**Christmas** — orders sit for weeks, so holding at checkout would just expire. Instead the card is **verified** (no hold), then automatically **held a few days before** the slot, then captured on the day.

**Deposit** — removes most of the worry: the **deposit is captured immediately** (real money, no expiry risk), and only the small **balance** is held and settled on the day. An expired or declined card in December then only threatens the balance, not the whole order.

## Updating on the admin side

Everything happens in **`/admin`** (one shared staff login).

**Products page → "Sync now"**
- Change names, prices, descriptions, prep, origin, sustainability, storage → edit the sheet → **Sync now**.
- Weight/size products (whole salmon, lobster, halibut, turbot, crab) → edit the **"Variations"** tab → **Sync now**.

**Products page → Christmas controls**
- **Christmas ordering** — a switch you flip on/off when you choose; the 20–24 December slots appear automatically (closed Sun/Mon).
- **Default deposit (£)** — a blanket deposit, used only for products with no deposit of their own.

**Sheet columns**
| Column | What it does |
|---|---|
| `price`, `title`, `status`, `description`, `tag`, `preparation`, `origin`, `sustainability`, `storage` | day-to-day product content |
| `Excluded from Christmas?` | `Excluded` / `Included` |
| `Christmas price` | festive price (blank = normal price) |
| `Christmas deposit` | up-front deposit (blank = falls back to the Default) |

**Orders page**
- **Awaiting capture** queue: weigh the fish → enter the real weights/prices → **Capture payment**.
- Watch the **7-day clock**.

**Not in the sheet yet:** stock levels — those still live in WooCommerce directly.