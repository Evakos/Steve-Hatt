/** Narrow types covering only the WooCommerce REST API (wc/v3) fields this app actually reads/writes. */

export interface WooImage {
  src: string;
}

export interface WooCategory {
  id: number;
  name: string;
  slug: string;
}

export interface WooAttribute {
  id: number;
  name: string;
  variation: boolean;
  options: string[];
}

export interface WooProductInput {
  name?: string;
  regular_price?: string;
  /** WooCommerce's publish state (draft/pending/private/publish) — not to be confused with
   * stock_status (in stock/out of stock/on backorder), which this app doesn't sync. */
  status?: "draft" | "pending" | "private" | "publish";
  description?: string;
  meta_data?: { key: string; value: string }[];
}

export interface WooProduct {
  id: number;
  name: string;
  slug: string;
  type: "simple" | "variable" | string;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  images: WooImage[];
  categories: WooCategory[];
  attributes: WooAttribute[];
  meta_data: { key: string; value: unknown }[];
  stock_status: "instock" | "outofstock" | "onbackorder" | string;
}

export interface WooProductVariation {
  id: number;
  price: string;
  regular_price: string;
  attributes: { name: string; option: string }[];
  meta_data: { key: string; value: unknown }[];
}

export interface WooProductVariationInput {
  regular_price?: string;
}

export interface WooOrderLineItemInput {
  /** Include when updating an existing line item (e.g. setting the final weighed price on
   * capture) — omit when adding a new line item to an order. */
  id?: number;
  product_id: number;
  variation_id?: number;
  quantity: number;
  /** Set together to override the line's price when capturing the final weighed amount —
   * WooCommerce recalculates the order total from these on save. */
  subtotal?: string;
  total?: string;
  meta_data?: { key: string; value: string }[];
}

export interface WooOrderBilling {
  first_name: string;
  last_name: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  postcode?: string;
  country?: string;
  email: string;
  phone?: string;
}

export interface WooOrderInput {
  status?: string;
  set_paid?: boolean;
  transaction_id?: string;
  payment_method?: string;
  payment_method_title?: string;
  /** Links the order to a WooCommerce customer account (see woocommerce/customers.ts) so it
   * shows up in that customer's /account order history. Omitted entirely for guest checkout. */
  customer_id?: number;
  /** Required when creating a new order; omit on partial updates (e.g. capture only needs to
   * touch status/line_items, resending billing risks clobbering anything staff edited in wp-admin). */
  billing?: WooOrderBilling;
  shipping?: WooOrderBilling;
  line_items?: WooOrderLineItemInput[];
  shipping_lines?: {
    method_id: string;
    method_title: string;
    total: string;
  }[];
  meta_data?: { key: string; value: string }[];
}

export interface WooOrderLineItem {
  id: number;
  product_id: number;
  name: string;
  quantity: number;
  total: string;
  meta_data: { key: string; display_key?: string; value: unknown; display_value?: unknown }[];
}

export interface WooOrder {
  id: number;
  number: string;
  status: string;
  total: string;
  date_created: string;
  billing: WooOrderBilling;
  line_items: WooOrderLineItem[];
  meta_data: { key: string; value: unknown }[];
}

export interface WooCustomerAddress {
  first_name?: string;
  last_name?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  postcode?: string;
  country?: string;
  phone?: string;
}

export interface WooCustomerInput {
  email: string;
  first_name?: string;
  last_name?: string;
  billing?: WooCustomerAddress;
  shipping?: WooCustomerAddress;
  /** WooCommerce requires *some* password on create even though this app never uses it for
   * login (see src/lib/customer-auth.ts — auth is a passwordless magic link, not a WP password).
   * Set once to a random value and never surfaced or checked again. */
  password?: string;
}

export interface WooCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  billing: WooCustomerAddress;
  shipping: WooCustomerAddress;
}
