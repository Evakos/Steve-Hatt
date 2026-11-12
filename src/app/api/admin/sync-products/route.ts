import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isStaffAuthenticated } from "@/lib/staff-auth";
import { readProductRows } from "@/lib/product-source";
import { parseAttachmentCell } from "@/lib/airtable";
import {
  getWooProduct,
  listAllWooProducts,
  listWooCategories,
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

function readStoredMeta(product: WooProduct | undefined, key: string): string {
  const value = product?.meta_data.find((m) => m.key === key)?.value;
  return typeof value === "string" ? value : "";
}

interface SyncResult {
  kind: "product" | "variation";
  productId: number;
  title: string;
  status: "updated" | "skipped" | "error";
  message?: string;
}

export async function POST(request: Request) {
  // Defense-in-depth: proxy.ts already gates /api/admin/*, but per the framework's own guidance
  // a matcher/route refactor could silently drop that coverage, so re-check here too.
  if (!(await isStaffAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let rows: Record<string, string>[];
  try {
    rows = await readProductRows("Products");
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to read the sheet" }, { status: 502 });
  }

  // What the shop holds right now, so photos, categories and sizes are only touched when edited.
  let existingProducts: Map<number, WooProduct>;
  let categoryByName: Map<string, { id: number; name: string }>;
  try {
    const [products, categories] = await Promise.all([listAllWooProducts(), listWooCategories()]);
    existingProducts = new Map(products.map((p) => [p.id, p]));
    categoryByName = new Map(categories.map((c) => [c.name.toLowerCase(), c]));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to read the shop" }, { status: 502 });
  }

  // WooCommerce downloads photos from this site (Airtable's own links have no file extension, which
  // it refuses), so it needs the public address: the production domain on Vercel, else this request's.
  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const photoOrigin = productionHost ? `https://${productionHost}` : new URL(request.url).origin;

  const results: SyncResult[] = [];

  for (const row of rows) {
    const title = row.title ?? "";
    const productId = Number(row.product_id);
    if (!Number.isFinite(productId) || productId <= 0) {
      results.push({ kind: "product", productId: NaN, title, status: "skipped", message: "Missing or invalid product_id" });
      continue;
    }

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

    try {
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
            message: `Saved, but the photo didn't update: ${err instanceof Error ? err.message : "upload failed"}`,
          });
          continue;
        }
      }
      results.push({ kind: "product", productId, title, status: "updated" });
    } catch (err) {
      results.push({ kind: "product", productId, title, status: "error", message: err instanceof Error ? err.message : "Update failed" });
    }
  }

  // Weight/size-tiered products (variable products, e.g. Salmon Whole, Turbot) have no single
  // price of their own - each size is a separate WooCommerce variation, priced independently.
  // The "Variations" tab lets staff edit those prices the same way as the main Products tab.
  let variationRows: Record<string, string>[] = [];
  try {
    variationRows = await readProductRows("Variations");
  } catch (err) {
    results.push({
      kind: "variation",
      productId: NaN,
      title: "Variations tab",
      status: "error",
      message: err instanceof Error ? err.message : "Failed to read the Variations tab",
    });
  }

  // Sizes already renamed on the shop, so each product's own list of sizes can be brought in step.
  const variationsByParent = new Map<number, WooProductVariation[]>();
  const renames: { parentProductId: number; parentTitle: string; attributeName: string; from: string; to: string }[] = [];

  for (const row of variationRows) {
    const title = `${row.parent_title ?? ""} (${row.attributes ?? ""})`.trim();
    const variationId = Number(row.variation_id);
    const parentProductId = Number(row.parent_product_id);

    if (!Number.isFinite(variationId) || variationId <= 0) {
      results.push({ kind: "variation", productId: NaN, title, status: "skipped", message: "Missing or invalid variation_id" });
      continue;
    }
    if (!Number.isFinite(parentProductId) || parentProductId <= 0) {
      results.push({ kind: "variation", productId: variationId, title, status: "skipped", message: "Missing or invalid parent_product_id" });
      continue;
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
      await updateWooProductVariation(parentProductId, variationId, { regular_price: regularPrice, attributes });
      if (rename) renames.push(rename);
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

  // Product pages are ISR-cached under this tag (see woocommerce/products.ts) - without this,
  // the sheet edit wouldn't show up on the live site for up to 2 minutes. Next 16 requires a
  // stale-window profile as the second argument; "max" is the docs' recommended default.
  revalidateTag(PRODUCTS_TAG, "max");

  return NextResponse.json({
    updated: results.filter((r) => r.status === "updated").length,
    errors: results.filter((r) => r.status === "error").length,
    total: results.length,
    results,
  });
}
