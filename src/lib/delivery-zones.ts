export const DELIVERY_ZONES = [
  "EC1", "EC2", "E2", "E5", "E8", "N1", "N4", "N5", "N6", "N7", "N10", "N16", "N19", "NW5",
];

export function normalisePostcode(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

export function extractOutcode(postcode: string): string | null {
  const match = postcode.match(/^([A-Z]{1,2}\d{1,2}[A-Z]?)/);
  return match ? match[1] : null;
}

export function isInDeliveryZone(postcode: string): boolean {
  const normalised = normalisePostcode(postcode);
  const outcode = extractOutcode(normalised);
  if (!outcode) return false;
  return DELIVERY_ZONES.some((zone) => outcode.startsWith(zone));
}

const FULL_POSTCODE = /^[A-Z]{1,2}\d{1,2}[A-Z]?\d[A-Z]{2}$/;

/** Returns a tidy "N1 8LU" style postcode if the input is a complete UK postcode, otherwise null
 * (an outcode on its own, like "N1", is deliberately not enough to save). */
export function formatFullPostcode(raw: string): string | null {
  const normalised = normalisePostcode(raw);
  if (!FULL_POSTCODE.test(normalised)) return null;
  return `${normalised.slice(0, -3)} ${normalised.slice(-3)}`;
}
