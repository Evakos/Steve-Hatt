import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";

const RECORD_ID = /^rec[A-Za-z0-9]{14}$/;
const ATTACHMENT_ID = /^att[A-Za-z0-9]{14}$/;
const IMAGE_NAME = /^[\w.\-]+\.(jpe?g|png|webp|gif)$/i;

/**
 * Hands a product photo from Airtable to WooCommerce. Airtable's own photo links have no file
 * extension, which WooCommerce refuses to download, so the sync gives WooCommerce a link to this
 * route instead. The path ends in the file's name (that is what makes WooCommerce accept it), and
 * the route looks the photo up in Airtable by record and attachment id, so it only ever serves
 * product photos from the products table.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ recordId: string; attachmentId: string; filename: string }> }
) {
  const { recordId, attachmentId, filename } = await params;
  if (!RECORD_ID.test(recordId) || !ATTACHMENT_ID.test(attachmentId) || !IMAGE_NAME.test(filename)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const env = getServerEnv();
  if (!env.AIRTABLE_TOKEN || !env.AIRTABLE_PRODUCTS_BASE_ID) {
    return new NextResponse("Not found", { status: 404 });
  }

  const recordRes = await fetch(
    `https://api.airtable.com/v0/${env.AIRTABLE_PRODUCTS_BASE_ID}/${encodeURIComponent("Website Products")}/${recordId}`,
    { headers: { Authorization: `Bearer ${env.AIRTABLE_TOKEN}` }, cache: "no-store" }
  );
  if (!recordRes.ok) return new NextResponse("Not found", { status: 404 });

  const record = (await recordRes.json()) as { fields?: { Photo?: { id?: string; url?: string; type?: string }[] } };
  const photo = record.fields?.Photo?.find((p) => p.id === attachmentId);
  if (!photo?.url || !photo.type?.startsWith("image/")) return new NextResponse("Not found", { status: 404 });

  const imageRes = await fetch(photo.url, { cache: "no-store" });
  if (!imageRes.ok || !imageRes.body) return new NextResponse("Photo unavailable", { status: 502 });

  return new NextResponse(imageRes.body, {
    headers: { "Content-Type": photo.type, "Cache-Control": "public, max-age=3600" },
  });
}
