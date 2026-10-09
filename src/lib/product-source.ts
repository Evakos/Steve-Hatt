import "server-only";
import { getServerEnv } from "@/lib/env";
import { readSheetAsRows } from "@/lib/google-sheets";
import { readAirtableRows } from "@/lib/airtable";

const AIRTABLE_TABLES = { Products: "Website Products", Variations: "Website Variations" } as const;

/**
 * Where the /admin/products sync reads its rows from: Airtable if AIRTABLE_PRODUCTS_BASE_ID is
 * set, otherwise the Google Sheet. Both return identical row objects (header name -> string), so
 * switching is purely an env change and the sync route is unaware of the source.
 */
export async function readProductRows(tab: keyof typeof AIRTABLE_TABLES): Promise<Record<string, string>[]> {
  if (getServerEnv().AIRTABLE_PRODUCTS_BASE_ID) return readAirtableRows(AIRTABLE_TABLES[tab]);
  return readSheetAsRows(tab);
}

const SHEET_URL = "https://docs.google.com/spreadsheets/d/1u0g6qC-xsbrjuhRpha80i8MvZdM5frfKhX9fG0a_VUY/edit?usp=sharing";

/** What the admin pages tell staff to edit: names and link for whichever source readProductRows is using. */
export function getProductSourceInfo() {
  const baseId = getServerEnv().AIRTABLE_PRODUCTS_BASE_ID;
  if (baseId) {
    return {
      name: "Airtable",
      url: `https://airtable.com/${baseId}`,
      linkLabel: "Open Airtable",
      productsTable: "Website Products",
      variationsTable: "Website Variations",
      rowWord: "record",
    };
  }
  return {
    name: "Google Sheet",
    url: SHEET_URL,
    linkLabel: "Open the spreadsheet",
    productsTable: "Products",
    variationsTable: "Variations",
    rowWord: "row",
  };
}
