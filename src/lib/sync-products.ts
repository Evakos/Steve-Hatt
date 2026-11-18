import { NextResponse, after } from "next/server";
import { revalidateTag } from "next/cache";
import { readProductRows } from "@/lib/product-source";
import { parseAttachmentCell } from "@/lib/airtable";
import {
  createWooProduct,
  createWooVariation,
  getWooProduct,
  listAllWooProducts,
  listWooCategories,
  getAllProducts,
  listWooVariations,
  updateWooProduct,
  updateWooProductVariation,
  PRODUCTS_TAG,
} from "@/lib/woocommerce/products";
import type { WooProduct, WooProductVariation } from "@/lib/woocommerce/types";

const META_KEYS = {
  tag: "_steve_hatt_tag",
  preparation: "_steve_hatt_preparation",
  origin: "_steve_hatt_origin",
  sustainability: "_steve_hatt_sustainability",
  storage: "_steve_hatt_storage",
  excludedFromChristmas: "_steve_hatt_excluded_from_christmas",
  christmasPrice: "_steve_hatt_christmas_price",
  christmasDeposit: "_steve_hatt_christmas_deposit",
  priceType: "_steve_hatt_price_type",
  pricePerKg: "_steve_hatt_price_per_kg",
  photoKey: "_steve_hatt_photo_key",
  weight: "_steve_hatt_weight",
  featuredFor: "_steve_hatt_featured_for",
  preparationNotes: "_steve_hatt_preparation_notes",
  /** The Airtable record a product was created from, so a repeat sync finds it instead of adding it twice. */
  airtableRecord: "_steve_hatt_airtable_record",
} as const;

const VALID_STATUSES = new Set(["draft", "pending", "private", "publish"]);
// "Excluded from Christmas?" takes a dropdown now: "Excluded" opts the product out, "Included" (or
// a blank cell) leaves it eligible. The legacy true/false values are still accepted for old rows.
const EXCLUDED_TRUE_VALUES = new Set(["excluded", "true", "1", "yes"]);
const EXCLUDED_FALSE_VALUES = new Set(["included", "false", "0", "no"]);

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** A file name boiled down so the same photo compares equal however WordPress renamed it
 * (spaces, "-scaled", a "-1" added to avoid a clash). */
function photoFingerprint(nameOrUrl: string | undefined): string {
  if (!nameOrUrl) return "";
  const base = decodeURIComponent(nameOrUrl.split("?")[0].split("/").pop() ?? "").replace(/\.[a-z0-9]+$/i, "");
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-scaled$/, "")
    .replace(/-\d+$/, "");
}

/** The photo's name for WooCommerce, always ending in a real image extension. */
function photoFileName(filename: string, type: string): string {
  const cleaned = filename.replace(/[^\w.\-]+/g, "_");
  if (/\.(jpe?g|png|webp|gif)$/i.test(cleaned)) return cleaned;
  return `${cleaned.replace(/\.[^.]*$/, "") || "photo"}.${IMAGE_EXTENSIONS[type] ?? "jpg"}`;
}

/** A product name as a page address: lowercase words joined by hyphens. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readStoredMeta(product: WooProduct | undefined, key: string): string {
  const value = product?.meta_data.find((m) => m.key === key)?.value;
  return typeof value === "string" ? value : "";
}

interface SyncResult {
  kind: "product" | "variation";
  productId: number;
  title: string;
  status: "created" | "updated" | "skipped" | "error";
  message?: string;
}

/**
 * Pushes the Airtable sheet into the shop. With no `recordId` it goes through every row (the admin
 * "Sync now" button). With a `recordId` it only handles that Airtable record: the product row and its
 * sizes, or the size row and the product it belongs to. That is what the Airtable automation calls
 * the moment a row changes, so an edit is live straight away. Callers must authenticate first.
 */
export async function runProductSync(request: Request, options: { recordId?: string } = {}) {
  // Read the products sheet, the shop and the sizes sheet at the same time rather than one after
  // another. Each is awaited below; the catch here just stops an early return from leaving the
  // others as unhandled rejections.
  const productRowsRead = readProductRows("Products");
  const shopRead = Promise.all([listAllWooProducts(), listWooCategories()]);
  const variationRowsRead = readProductRows("Variations");
  for (const read of [productRowsRead, shopRead, variationRowsRead]) read.catch(() => undefined);

  let rows: Record<string, string>[];
  try {
    rows = await productRowsRead;
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to read the sheet" }, { status: 502 });
  }

  // What the shop holds right now, so photos, categories and sizes are only touched when edited.
  let existingProducts: Map<number, WooProduct>;
  let categoryByName: Map<string, { id: number; name: string }>;
  try {
    const [products, categories] = await shopRead;
    existingProducts = new Map(products.map((p) => [p.id, p]));
    categoryByName = new Map(categories.map((c) => [c.name.toLowerCase(), c]));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to read the shop" }, { status: 502 });
  }

  // How a row with no product_id is matched to a product the shop already has: by the Airtable record
  // it was created from, then by page address. This is what stops a repeat sync adding it twice.
  const productByRecord = new Map<string, WooProduct>();
  const productBySlug = new Map<string, WooProduct>();
  for (const p of existingProducts.values()) {
    productBySlug.set(p.slug, p);
    const record = readStoredMeta(p, META_KEYS.airtableRecord);
    if (record) productByRecord.set(record, p);
  }

  // WooCommerce downloads photos from this site (Airtable's own links have no file extension, which
  // it refuses), so it needs the public address: the production domain on Vercel, else this request's.
  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const photoOrigin = productionHost ? `https://${productionHost}` : new URL(request.url).origin;

  const results: SyncResult[] = [];

  // The Variations table is read first: a new product that has sizes needs no price of its own, and
  // is only published once its sizes are in.
  let variationRows: Record<string, string>[] = [];
  let variationReadError: string | undefined;
  try {
    variationRows = await variationRowsRead;
  } catch (err) {
    variationReadError = err instanceof Error ? err.message : "Failed to read the Variations tab";
  }
  // A single changed record: narrow the work to that product (or size) and what belongs to it.
  const onlyRecord = options.recordId?.trim();
  if (onlyRecord) {
    const linkedRecords = (row: Record<string, string>) =>
      (row.Product ?? "").split(",").map((id) => id.trim()).filter(Boolean);
    const changedSize = variationRows.find((r) => r.__recordId === onlyRecord);
    if (changedSize) {
      const parentRecords = new Set(linkedRecords(changedSize));
      const parentProductId = changedSize.parent_product_id?.trim();
      rows = rows.filter(
        (r) => parentRecords.has(r.__recordId) || (!!parentProductId && r.product_id?.trim() === parentProductId)
      );
      variationRows = [changedSize];
    } else {
      rows = rows.filter((r) => r.__recordId === onlyRecord);
      variationRows = variationRows.filter((r) => linkedRecords(r).includes(onlyRecord));
    }
  }
  const recordsWithSizes = new Set(
    variationRows.flatMap((r) => (r.Product ?? "").split(",").map((id) => id.trim()).filter(Boolean))
  );
  const productTitleByRecord = new Map(rows.map((r) => [r.__recordId, r.title ?? ""]));
  const wooIdByRecord = new Map<string, number>();
  const pendingPublish = new Map<number, "draft" | "pending" | "private" | "publish">();

  async function goLive(parentProductId: number) {
    const finalStatus = pendingPublish.get(parentProductId);
    if (!finalStatus) return;
    pendingPublish.delete(parentProductId);
    await updateWooProduct(parentProductId, { status: finalStatus });
  }

  for (const row of rows) {
    const title = row.title ?? "";
    let productId = Number(row.product_id);
    // A row with no product_id is a product added in Airtable: it is linked to the shop product it
    // already matches, or created as a new one.
    let isNew = false;
    let linkRecord = false;
    if (!Number.isFinite(productId) || productId <= 0) {
      const derivedSlug = row.slug?.trim() || slugify(title);
      const known =
        (row.__recordId ? productByRecord.get(row.__recordId) : undefined) ??
        (derivedSlug ? productBySlug.get(derivedSlug) : undefined);
      if (known) {
        productId = known.id;
        linkRecord = true;
      } else if (title) {
        isNew = true;
        linkRecord = true;
      } else {
        results.push({ kind: "product", productId: NaN, title, status: "skipped", message: "No product_id and no title to create a product from" });
        continue;
      }
    }

    if (row.__recordId && Number.isFinite(productId) && productId > 0) wooIdByRecord.set(row.__recordId, productId);
    const hasSizes = !!row.__recordId && recordsWithSizes.has(row.__recordId);

    let preparation: string[] | undefined;
    if (row.preparation) {
      try {
        const parsed = JSON.parse(row.preparation);
        if (!Array.isArray(parsed) || !parsed.every((v) => typeof v === "string")) throw new Error();
        preparation = parsed;
      } catch {
        results.push({
          kind: "product",
          productId,
          title,
          status: "error",
          message: `preparation column isn't a valid JSON array, got: ${row.preparation}`,
        });
        continue;
      }
    }

    let regularPrice: string | undefined;
    if (row.price) {
      const parsedPrice = Number(row.price);
      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        results.push({ kind: "product", productId, title, status: "error", message: `price column isn't a valid non-negative number, got: ${row.price}` });
        continue;
      }
      regularPrice = parsedPrice.toFixed(2);
    }

    let wooStatus: "draft" | "pending" | "private" | "publish" | undefined;
    if (row.status) {
      if (!VALID_STATUSES.has(row.status)) {
        results.push({
          kind: "product",
          productId,
          title,
          status: "error",
          message: `status column must be one of draft/pending/private/publish, got: ${row.status}`,
        });
        continue;
      }
      wooStatus = row.status as typeof wooStatus;
    }

    const excludedFromChristmasRaw = row["Excluded from Christmas?"];
    let excludedFromChristmas: boolean | undefined;
    if (excludedFromChristmasRaw) {
      const normalised = excludedFromChristmasRaw.trim().toLowerCase();
      if (EXCLUDED_TRUE_VALUES.has(normalised)) {
        excludedFromChristmas = true;
      } else if (EXCLUDED_FALSE_VALUES.has(normalised)) {
        excludedFromChristmas = false;
      } else {
        results.push({
          kind: "product",
          productId,
          title,
          status: "error",
          message: `"Excluded from Christmas?" column must be Excluded or Included, got: ${excludedFromChristmasRaw}`,
        });
        continue;
      }
    }

    // Manual per-product Christmas price override (same idea as previous years' separate
    // Christmas price spreadsheet) - see computeUnitPriceForOrder for how this is applied at
    // checkout. Blank means "no override, use the normal price even for Christmas orders".
    const christmasPriceRaw = row["Christmas price"];
    let christmasPrice: string | undefined;
    if (christmasPriceRaw) {
      const parsedChristmasPrice = Number(christmasPriceRaw);
      if (!Number.isFinite(parsedChristmasPrice) || parsedChristmasPrice < 0) {
        results.push({
          kind: "product",
          productId,
          title,
          status: "error",
          message: `"Christmas price" column isn't a valid non-negative number, got: ${christmasPriceRaw}`,
        });
        continue;
      }
      christmasPrice = parsedChristmasPrice.toFixed(2);
    }

    const christmasDepositRaw = row["Christmas deposit"];
    let christmasDeposit: string | undefined;
    if (christmasDepositRaw) {
      const parsedChristmasDeposit = Number(christmasDepositRaw);
      if (!Number.isFinite(parsedChristmasDeposit) || parsedChristmasDeposit < 0) {
        results.push({
          kind: "product",
          productId,
          title,
          status: "error",
          message: `"Christmas deposit" column isn't a valid non-negative number, got: ${christmasDepositRaw}`,
        });
        continue;
      }
      christmasDeposit = parsedChristmasDeposit.toFixed(2);
    }

    // How the price works. "fixed" (the default when blank) is one price for the product. "per-kg"
    // means priced by weight: the customer picks a weight and pays price x weight, where the price
    // is £ per kg (taken from the optional "Price per kg" column, else from the "price" column).
    // "per-piece" means the price is for each one (an oyster, a prawn).
    const priceTypeRaw = row["Price type"];
    let priceType: "fixed" | "per-kg" | "per-piece" | undefined;
    let pricePerKg: string | undefined;
    if (priceTypeRaw) {
      const normalisedType = priceTypeRaw.trim().toLowerCase();
      if (normalisedType === "fixed" || normalisedType === "per-kg" || normalisedType === "per-piece") {
        priceType = normalisedType;
      } else {
        results.push({
          kind: "product",
          productId,
          title,
          status: "error",
          message: `"Price type" column must be fixed, per-kg or per-piece, got: ${priceTypeRaw}`,
        });
        continue;
      }
    }
    if (priceType === "per-kg") {
      const perKgRaw = row["Price per kg"] || row.price;
      const parsedPerKg = Number(perKgRaw);
      if (!perKgRaw || !Number.isFinite(parsedPerKg) || parsedPerKg <= 0) {
        results.push({
          kind: "product",
          productId,
          title,
          status: "error",
          message: `A per-kg product needs a "Price per kg" (or a "price"), got: ${perKgRaw ?? "nothing"}`,
        });
        continue;
      }
      pricePerKg = parsedPerKg.toFixed(2);
    }

    // Manual availability toggle - "In stock" / "Out of stock" (optionally "On backorder").
    // Blank leaves WooCommerce's current stock status untouched.
    const stockRaw = row["Stock"];
    let stockStatus: "instock" | "outofstock" | "onbackorder" | undefined;
    if (stockRaw) {
      const normalisedStock = stockRaw.trim().toLowerCase();
      if (normalisedStock === "in stock" || normalisedStock === "instock") {
        stockStatus = "instock";
      } else if (normalisedStock === "out of stock" || normalisedStock === "outofstock") {
        stockStatus = "outofstock";
      } else if (normalisedStock === "on backorder" || normalisedStock === "onbackorder") {
        stockStatus = "onbackorder";
      } else {
        results.push({
          kind: "product",
          productId,
          title,
          status: "error",
          message: `"Stock" column must be "In stock" or "Out of stock", got: ${stockRaw}`,
        });
        continue;
      }
    }

    // Page address. Changing it changes the product's web address (old links stop working).
    const slug = row.slug?.trim() || undefined;
    if (slug && !SLUG_PATTERN.test(slug)) {
      results.push({
        kind: "product",
        productId,
        title,
        status: "error",
        message: `"slug" can only use lowercase letters, numbers and hyphens, got: ${slug}`,
      });
      continue;
    }

    // Category. Several can be given, separated by " | "; the first is the one shown on the product.
    let categoryIds: { id: number }[] | undefined;
    if (row.category) {
      const names = row.category.split("|").map((n) => n.trim()).filter(Boolean);
      const found = names.map((n) => categoryByName.get(n.toLowerCase()));
      const unknown = names.filter((_, i) => !found[i]);
      if (unknown.length > 0) {
        results.push({
          kind: "product",
          productId,
          title,
          status: "error",
          message: `Unknown category ${unknown.join(", ")}. Use ${[...categoryByName.values()].map((c) => c.name).join(", ")}.`,
        });
        continue;
      }
      categoryIds = found.map((c) => ({ id: c!.id }));
    }

    // Photo. The shop is only given the photo again when the Airtable file has changed (each upload
    // has its own id, remembered on the product); a photo that is already live is just recorded.
    let photoMarker: { key: string; value: string } | undefined;
    let newImages: { src: string; alt: string }[] | undefined;
    let photoAlreadyLive = false;
    const photos = parseAttachmentCell(row.Photo);
    if (photos.length > 0 && row.__recordId) {
      const photoKey = photos.map((p) => p.id).join(",");
      const current = existingProducts.get(productId);
      const storedKey = readStoredMeta(current, META_KEYS.photoKey);
      if (storedKey !== photoKey) {
        photoMarker = { key: META_KEYS.photoKey, value: photoKey };
        photoAlreadyLive = !storedKey && photoFingerprint(current?.images[0]?.src) === photoFingerprint(photos[0].filename);
        if (!photoAlreadyLive) {
          newImages = photos.map((p) => ({
            src: `${photoOrigin}/api/product-photo/${row.__recordId}/${p.id}/${photoFileName(p.filename, p.type)}`,
            alt: row.title || "",
          }));
        }
      }
    }

    // "Featured" puts the product in the home page's Christmas section; "Not featured" takes it out.
    const featuredRaw = row["Featured at Christmas"];
    let featuredFor: string[] | undefined;
    if (featuredRaw) {
      const normalisedFeatured = featuredRaw.trim().toLowerCase();
      if (normalisedFeatured === "featured") {
        featuredFor = ["christmas"];
      } else if (normalisedFeatured === "not featured") {
        featuredFor = [];
      } else {
        results.push({
          kind: "product",
          productId,
          title,
          status: "error",
          message: `"Featured at Christmas" column must be Featured or Not featured, got: ${featuredRaw}`,
        });
        continue;
      }
    }

    const metaData: { key: string; value: string }[] = [];
    if (photoAlreadyLive && photoMarker) metaData.push(photoMarker);
    if (row["Pack size"]) metaData.push({ key: META_KEYS.weight, value: row["Pack size"] });
    if (row["Preparation notes"]) metaData.push({ key: META_KEYS.preparationNotes, value: row["Preparation notes"] });
    if (featuredFor !== undefined) metaData.push({ key: META_KEYS.featuredFor, value: JSON.stringify(featuredFor) });
    if (row.tag) metaData.push({ key: META_KEYS.tag, value: row.tag });
    if (preparation) metaData.push({ key: META_KEYS.preparation, value: JSON.stringify(preparation) });
    if (row.origin) metaData.push({ key: META_KEYS.origin, value: row.origin });
    if (row.sustainability) metaData.push({ key: META_KEYS.sustainability, value: row.sustainability });
    if (row.storage) metaData.push({ key: META_KEYS.storage, value: row.storage });
    if (excludedFromChristmas !== undefined) {
      metaData.push({ key: META_KEYS.excludedFromChristmas, value: String(excludedFromChristmas) });
    }
    if (christmasPrice !== undefined) {
      metaData.push({ key: META_KEYS.christmasPrice, value: christmasPrice });
    }
    if (christmasDeposit !== undefined) {
      metaData.push({ key: META_KEYS.christmasDeposit, value: christmasDeposit });
    }
    if (priceType !== undefined) {
      metaData.push({ key: META_KEYS.priceType, value: priceType });
      // Anything that is no longer per-kg has its stored per-kg price cleared, so it can't linger.
      metaData.push({ key: META_KEYS.pricePerKg, value: pricePerKg ?? "0" });
    }

    if (linkRecord && row.__recordId) metaData.push({ key: META_KEYS.airtableRecord, value: row.__recordId });

    // A new product has to be complete enough to show properly: a product without a photo would
    // break its pages, and one without a category or price can't be browsed or bought.
    if (isNew) {
      const missing: string[] = [];
      if (!regularPrice && !pricePerKg && !hasSizes) missing.push("a price");
      if (!categoryIds) missing.push("a category");
      if (!newImages) missing.push("a photo");
      if (missing.length > 0) {
        results.push({
          kind: "product",
          productId,
          title,
          status: "error",
          message: `A new product needs ${missing.join(", ")} before it can be added to the shop.`,
        });
        continue;
      }
    }

    // A new product is created as a draft and only goes live once its photo is on, so the shop never
    // shows one without a picture. Its final state is the Status column, else published.
    const finalStatus = wooStatus ?? "publish";

    try {
      if (isNew) {
        const created = await createWooProduct({
          name: title,
          slug: slug ?? slugify(title),
          categories: categoryIds,
          regular_price: regularPrice ?? pricePerKg,
          status: "draft",
          stock_status: stockStatus ?? "instock",
          description: row.description || undefined,
          meta_data: metaData.length > 0 ? metaData : undefined,
        });
        productId = created.id;
        existingProducts.set(created.id, created);
        productBySlug.set(created.slug, created);
        if (row.__recordId) {
          productByRecord.set(row.__recordId, created);
          wooIdByRecord.set(row.__recordId, created.id);
        }
      } else {
        await updateWooProduct(productId, {
          name: row.title || undefined,
          slug,
          categories: categoryIds,
          regular_price: regularPrice,
          status: wooStatus,
          stock_status: stockStatus,
          description: row.description || undefined,
          meta_data: metaData.length > 0 ? metaData : undefined,
        });
      }
      // The photo goes in its own request so a problem with it can't stop the price and text saving.
      if (newImages && photoMarker) {
        try {
          await updateWooProduct(productId, { images: newImages, meta_data: [photoMarker] });
        } catch (err) {
          results.push({
            kind: "product",
            productId,
            title,
            status: "error",
            message: `${isNew ? "Created as a draft, not live yet" : "Saved"}, but the photo didn't update: ${err instanceof Error ? err.message : "upload failed"}`,
          });
          continue;
        }
      }
      if (isNew && hasSizes) pendingPublish.set(productId, finalStatus);
      else if (isNew) await updateWooProduct(productId, { status: finalStatus });
      results.push({
        kind: "product",
        productId,
        title,
        status: isNew ? "created" : "updated",
        message: isNew
          ? hasSizes
            ? "Added as a draft, goes live once its sizes are added"
            : finalStatus === "publish"
              ? "Added to the shop"
              : `Added to the shop as ${finalStatus}`
          : undefined,
      });
    } catch (err) {
      results.push({ kind: "product", productId, title, status: "error", message: err instanceof Error ? err.message : "Update failed" });
    }
  }

  // Weight/size-tiered products (variable products, e.g. Salmon Whole, Turbot) have no single
  // price of their own - each size is a separate WooCommerce variation, priced independently.
  // The "Variations" tab lets staff edit those prices the same way as the main Products tab.
  if (variationReadError) {
    results.push({ kind: "variation", productId: NaN, title: "Variations tab", status: "error", message: variationReadError });
  }

  // Sizes already renamed on the shop, so each product's own list of sizes can be brought in step.
  const variationsByParent = new Map<number, WooProductVariation[]>();
  const renames: { parentProductId: number; parentTitle: string; attributeName: string; from: string; to: string }[] = [];

  for (const row of variationRows) {
    // The parent is the "Product" link on the row (what staff pick); parent_product_id is only used
    // for sizes that already exist.
    const link = (row.Product ?? "").split(",")[0].trim();
    let parentProductId = Number(row.parent_product_id);
    if ((!Number.isFinite(parentProductId) || parentProductId <= 0) && link) parentProductId = wooIdByRecord.get(link) ?? NaN;
    const parentTitle = row.parent_title || productTitleByRecord.get(link) || "";
    const title = `${parentTitle} (${row["Size name"] || row.attributes || ""})`.trim();
    let variationId = Number(row.variation_id);

    // Hiding a size: "private" or "draft" keeps it on the books but stops customers seeing it.
    const sizeStatusRaw = row.status?.trim().toLowerCase();
    let sizeStatus: "publish" | "private" | undefined;
    if (sizeStatusRaw) {
      if (sizeStatusRaw === "publish") sizeStatus = "publish";
      else if (sizeStatusRaw === "private" || sizeStatusRaw === "draft") sizeStatus = "private";
      else {
        results.push({ kind: "variation", productId: NaN, title, status: "error", message: `status column must be publish, private or draft, got: ${row.status}` });
        continue;
      }
    }

    if (!Number.isFinite(parentProductId) || parentProductId <= 0) {
      results.push({
        kind: "variation",
        productId: Number.isFinite(variationId) ? variationId : NaN,
        title,
        status: "skipped",
        message: "Pick the product this size belongs to in the Product column",
      });
      continue;
    }

    // No variation_id means a size added in Airtable: matched to the product's size of the same name,
    // or added as a new one. (Matching is what stops a repeat sync adding it twice.)
    if (!Number.isFinite(variationId) || variationId <= 0) {
      const newSize = row["Size name"]?.trim();
      const newPrice = Number(row.price);
      if (!newSize) {
        results.push({ kind: "variation", productId: NaN, title, status: "error", message: "A new size needs a Size name" });
        continue;
      }
      try {
        let siblings = variationsByParent.get(parentProductId);
        if (!siblings) {
          siblings = await listWooVariations(parentProductId);
          variationsByParent.set(parentProductId, siblings);
        }
        const same = siblings.find((v) => v.attributes[0]?.option.toLowerCase() === newSize.toLowerCase());
        if (same) {
          variationId = same.id;
        } else {
          if (!row.price || !Number.isFinite(newPrice) || newPrice < 0) {
            results.push({ kind: "variation", productId: NaN, title, status: "error", message: "A new size needs a price" });
            continue;
          }
          // The product's own list of sizes has to include it, and the product has to be one with sizes.
          const parent = await getWooProduct(parentProductId);
          const sizeAttribute = parent.attributes.find((a) => a.variation);
          const attributeName = sizeAttribute?.name ?? "Size";
          const attributes = sizeAttribute
            ? parent.attributes.map((a) => (a === sizeAttribute && !a.options.includes(newSize) ? { ...a, options: [...a.options, newSize] } : a))
            : [
                ...parent.attributes,
                { id: 0, name: "Size", position: parent.attributes.length, visible: true, variation: true, options: [newSize] },
              ];
          await updateWooProduct(parentProductId, { type: "variable", attributes });
          const made = await createWooVariation(parentProductId, {
            regular_price: newPrice.toFixed(2),
            status: sizeStatus ?? "publish",
            attributes: [{ name: attributeName, option: newSize }],
          });
          siblings.push(made);
          await goLive(parentProductId);
          results.push({ kind: "variation", productId: made.id, title, status: "created", message: "Size added" });
          continue;
        }
      } catch (err) {
        results.push({ kind: "variation", productId: NaN, title, status: "error", message: err instanceof Error ? err.message : "Couldn't add the size" });
        continue;
      }
    }

    let regularPrice: string | undefined;
    if (row.price) {
      const parsedPrice = Number(row.price);
      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        results.push({ kind: "variation", productId: variationId, title, status: "error", message: `price column isn't a valid non-negative number, got: ${row.price}` });
        continue;
      }
      regularPrice = parsedPrice.toFixed(2);
    }

    // "Size name" is the label customers see for this size, e.g. Medium 750g. Only sent when it differs
    // from what the shop has, so an untouched size is never rewritten.
    const sizeName = row["Size name"]?.trim();
    let attributes: { name: string; option: string }[] | undefined;
    let rename: (typeof renames)[number] | undefined;
    if (sizeName) {
      try {
        let siblings = variationsByParent.get(parentProductId);
        if (!siblings) {
          siblings = await listWooVariations(parentProductId);
          variationsByParent.set(parentProductId, siblings);
        }
        const attribute = siblings.find((v) => v.id === variationId)?.attributes[0];
        if (attribute && attribute.option !== sizeName) {
          if (siblings.some((v) => v.id !== variationId && v.attributes[0]?.option.toLowerCase() === sizeName.toLowerCase())) {
            results.push({
              kind: "variation",
              productId: variationId,
              title,
              status: "error",
              message: `Another size of this product is already called "${sizeName}"`,
            });
            continue;
          }
          attributes = [{ name: attribute.name, option: sizeName }];
          rename = {
            parentProductId,
            parentTitle: row.parent_title ?? "",
            attributeName: attribute.name,
            from: attribute.option,
            to: sizeName,
          };
        }
      } catch (err) {
        results.push({
          kind: "variation",
          productId: variationId,
          title,
          status: "error",
          message: err instanceof Error ? err.message : "Couldn't read the current sizes",
        });
        continue;
      }
    }

    try {
      await updateWooProductVariation(parentProductId, variationId, { regular_price: regularPrice, attributes, status: sizeStatus });
      if (rename) renames.push(rename);
      await goLive(parentProductId);
      results.push({ kind: "variation", productId: variationId, title, status: "updated" });
    } catch (err) {
      results.push({ kind: "variation", productId: variationId, title, status: "error", message: err instanceof Error ? err.message : "Update failed" });
    }
  }

  // A renamed size also has to change in the product's own list of sizes (what wp-admin shows), or
  // the two would disagree. Done once per product, after all of its sizes have been handled.
  for (const parentId of new Set(renames.map((r) => r.parentProductId))) {
    const mine = renames.filter((r) => r.parentProductId === parentId);
    try {
      const parent = await getWooProduct(parentId);
      const attributes = parent.attributes.map((a) => {
        const forThis = mine.filter((r) => r.attributeName === a.name);
        if (forThis.length === 0) return a;
        return { ...a, options: a.options.map((o) => forThis.find((r) => r.from === o)?.to ?? o) };
      });
      await updateWooProduct(parentId, { attributes });
    } catch (err) {
      results.push({
        kind: "variation",
        productId: parentId,
        title: mine[0].parentTitle,
        status: "error",
        message: `Sizes renamed, but the product's list of sizes didn't update: ${err instanceof Error ? err.message : "update failed"}`,
      });
    }
  }

  for (const parentId of pendingPublish.keys()) {
    results.push({
      kind: "product",
      productId: parentId,
      title: [...productTitleByRecord.entries()].find(([record]) => wooIdByRecord.get(record ?? "") === parentId)?.[1] ?? String(parentId),
      status: "error",
      message: "Added as a draft because none of its sizes could be added. Fix the sizes and sync again, then set its status to publish.",
    });
  }

  // Product pages and the shop grid are ISR-cached under this tag (see woocommerce/products.ts).
  // Expiring it straight away, rather than the stale-while-revalidate "max" profile, means the very
  // next visitor sees the edit instead of one more stale page. Next's docs recommend { expire: 0 }
  // for exactly this: an outside service (Airtable) calling a route handler.
  revalidateTag(PRODUCTS_TAG, { expire: 0 });

  // Rebuild what visitors are about to ask for once this response has gone, so the first person to
  // open the shop after an edit doesn't wait on WooCommerce (that rebuild takes several seconds).
  // Nothing here can fail the sync.
  after(async () => {
    try {
      await getAllProducts();
      await Promise.all([fetch(`${photoOrigin}/shop`), fetch(photoOrigin)]);
    } catch {
      // Warming is best effort: the next visitor just rebuilds the page themselves.
    }
  });

  return NextResponse.json({
    created: results.filter((r) => r.status === "created").length,
    updated: results.filter((r) => r.status === "updated").length,
    errors: results.filter((r) => r.status === "error").length,
    total: results.length,
    results,
  });
}
