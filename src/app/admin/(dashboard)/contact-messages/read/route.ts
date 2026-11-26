import { NextResponse } from "next/server";
import { markContactRead } from "@/lib/contact-store";

export async function POST(request: Request) {
  const formData = await request.formData();
  const id = formData.get("id") as string;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await markContactRead(id);
  return NextResponse.redirect(new URL("/admin/contact-messages", request.url));
}