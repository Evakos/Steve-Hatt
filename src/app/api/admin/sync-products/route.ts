import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isStaffAuthenticated } from "@/lib/staff-auth";
import { readSheetAsRows } from "@/lib/google-sheets";
import { updateWooProduct, updateWooProductVariation, PRODUCTS_TAG } from "@/lib/woocommerce/products";

const META_KEYS = {
  tag: "_steve_hatt_tag",
  preparation: "_steve_hatt_preparation",
  origin: "_steve_hatt_origin",
  sustainability: "_steve_hatt_sustainability",
  storage: "_steve_hatt_storage",
  excludedFromChristmas: "_steve_hatt_excluded_from_christmas",
  christmasPrice: "_steve_hatt_christmas_price",
  christmasDeposit: "_steve_hatt_christmas_deposit",
} as const;

const VALID_STATUSES = new Set(["draft", "pending", "private", "publish"]);
const VALID_BOOLEANS = new Set(["true", "false", "1", "0", "yes", "no"]);
const TRUTHY = new Set(["true", "1", "yes"]);

interface SyncResult {
  kind: "product" | "variation";
  productId: number;
  title: string;
  status: "updated" | "skipped" | "error";
  message?: string;
}

export async function POST() {
  // Defense-in-depth: proxy.ts already gates /api/admin/*, but per the framework's own guidance
  // a matcher/route refactor could silently drop that coverage, so re-check here too.
  if (!(await isStaffAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let rows: Record<string, string>[];
  try {
    rows = await readSheetAsRows("Products");
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to read the sheet" }, { status: 502 });
  }

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
      if (!VALID_BOOLEANS.has(normalised)) {
        results.push({
          kind: "product",
          productId,
          title,
          status: "error",
          message: `"Excluded from Christmas?" column must be true/false, got: ${excludedFromChristmasRaw}`,
        });
        continue;
      }
      excludedFromChristmas = TRUTHY.has(normalised);
    }

    // Manual per-product Christmas price override (same idea as previous years' separate
    // Christmas price spreadsheet) — see computeUnitPriceForOrder for how this is applied at
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

    const metaData: { key: string; value: string }[] = [];
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

    try {
      await updateWooProduct(productId, {
        name: row.title || undefined,
        regular_price: regularPrice,
        status: wooStatus,
        description: row.description || undefined,
        meta_data: metaData.length > 0 ? metaData : undefined,
      });
      results.push({ kind: "product", productId, title, status: "updated" });
    } catch (err) {
      results.push({ kind: "product", productId, title, status: "error", message: err instanceof Error ? err.message : "Update failed" });
    }
  }

  // Weight/size-tiered products (variable products, e.g. Salmon Whole, Turbot) have no single
  // price of their own — each size is a separate WooCommerce variation, priced independently.
  // The "Variations" tab lets staff edit those prices the same way as the main Products tab.
  let variationRows: Record<string, string>[] = [];
  try {
    variationRows = await readSheetAsRows("Variations");
  } catch (err) {
    results.push({
      kind: "variation",
      productId: NaN,
      title: "Variations tab",
      status: "error",
      message: err instanceof Error ? err.message : "Failed to read the Variations tab",
    });
  }

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

    try {
      await updateWooProductVariation(parentProductId, variationId, { regular_price: regularPrice });
      results.push({ kind: "variation", productId: variationId, title, status: "updated" });
    } catch (err) {
      results.push({ kind: "variation", productId: variationId, title, status: "error", message: err instanceof Error ? err.message : "Update failed" });
    }
  }

  // Product pages are ISR-cached under this tag (see woocommerce/products.ts) — without this,
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
