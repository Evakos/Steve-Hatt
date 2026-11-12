/**
 * House style: no long dashes in anything customers read. Product text comes from WooCommerce and
 * Airtable, where long dashes turn up in pasted or written copy, so they are tidied as the text is
 * read in. A dash in a range ("200g – 300g") becomes "to"; a dash between clauses becomes a comma.
 */
export function removeLongDashes(text: string): string {
  return text
    .replace(/(\d[a-zA-Z%]*)\s*[–—]\s*(?=\d)/g, "$1 to ")
    .replace(/\s*,\s*[–—]\s*/g, ", ")
    .replace(/\s*[–—]\s*/g, ", ")
    .replace(/^,\s*|,\s*$/g, "");
}
