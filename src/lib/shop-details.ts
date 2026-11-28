import "server-only";
import { getWooShopSettings } from "@/lib/woocommerce/client";

export interface ShopDetails {
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  country: string;
  phone: string;
  email: string;
  fullAddress: string;
  shortAddress: string;
}

/** Fetch shop details from WooCommerce settings with sensible fallbacks. */
export async function getShopDetails(): Promise<ShopDetails> {
  const settings = await getWooShopSettings();
  
  const fallback: ShopDetails = {
    name: "Steve Hatt Fishmongers",
    addressLine1: "88-89 Essex Road",
    addressLine2: "",
    city: "Islington",
    postcode: "N1 8LU",
    country: "GB",
    phone: "020 7226 3963",
    email: "hello@stevehattfishmongers.co.uk",
    fullAddress: "88-89 Essex Road, Islington, London N1 8LU",
    shortAddress: "88-89 Essex Road, Islington, London N1 8LU",
  };

  if (!settings) return fallback;

  const addressParts = [
    settings.store_address,
    settings.store_address_2,
    settings.store_city,
    settings.store_postcode,
  ].filter(Boolean);

  const fullAddress = addressParts.join(", ");
  const shortAddress = [settings.store_address, settings.store_city].filter(Boolean).join(", ");

  return {
    name: "Steve Hatt Fishmongers",
    addressLine1: settings.store_address || fallback.addressLine1,
    addressLine2: settings.store_address_2 || fallback.addressLine2,
    city: settings.store_city || fallback.city,
    postcode: settings.store_postcode || fallback.postcode,
    country: settings.store_country || fallback.country,
    phone: settings.store_phone || fallback.phone,
    email: settings.store_email || fallback.email,
    fullAddress: fullAddress || fallback.fullAddress,
    shortAddress: shortAddress || fallback.shortAddress,
  };
}

/** Format phone for tel: links (strip spaces, ensure +44 prefix for UK numbers). */
export function formatPhoneForTel(phone: string): string {
  const cleaned = phone.replace(/\s+/g, "");
  if (cleaned.startsWith("0")) {
    return `+44${cleaned.slice(1)}`;
  }
  if (cleaned.startsWith("+44")) {
    return cleaned;
  }
  return `+44${cleaned}`;
}