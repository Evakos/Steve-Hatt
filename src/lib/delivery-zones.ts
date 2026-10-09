export const DELIVERY_ZONES = [
  "EC1", "EC2", "E2", "E5", "E8", "N1", "N4", "N5", "N6", "N7", "N10", "N16", "N19", "NW5",
];

export function normalisePostcode(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

const FULL_POSTCODE = /^[A-Z]{1,2}\d{1,2}[A-Z]?\d[A-Z]{2}$/;
const OUTCODE_ONLY = /^[A-Z]{1,2}\d{1,2}[A-Z]?$/;

/** The outward code ("N1" from N1 8LU, "EC1A" from EC1A 1BB). A complete postcode always ends in a
 * digit and two letters, so the outward code is everything before those last three characters -
 * reading it with a pattern alone is ambiguous ("N18LU" would look like "N18L"). An outward code on
 * its own ("N1") is also accepted. Anything else returns null. */
export function extractOutcode(postcode: string): string | null {
  const normalised = normalisePostcode(postcode);
  if (FULL_POSTCODE.test(normalised)) return normalised.slice(0, -3);
  return OUTCODE_ONLY.test(normalised) ? normalised : null;
}

/** True when the outward code is one of our zones. A zone matches itself and its lettered
 * sub-districts only (EC1 covers EC1A and EC1V), never other numbers that merely start with it
 * (N1 must not match N12, E2 must not match E20). */
export function isInDeliveryZone(postcode: string): boolean {
  const outcode = extractOutcode(postcode);
  if (!outcode) return false;
  return DELIVERY_ZONES.some(
    (zone) => outcode === zone || (outcode.startsWith(zone) && /^[A-Z]$/.test(outcode.slice(zone.length)))
  );
}

/** Returns a tidy "N1 8LU" style postcode if the input is a complete UK postcode, otherwise null
 * (an outcode on its own, like "N1", is deliberately not enough to save). */
export function formatFullPostcode(raw: string): string | null {
  const normalised = normalisePostcode(raw);
  if (!FULL_POSTCODE.test(normalised)) return null;
  return `${normalised.slice(0, -3)} ${normalised.slice(-3)}`;
}
