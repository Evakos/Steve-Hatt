import { NextResponse } from "next/server";
import { z } from "zod";
import { isStaffAuthenticated } from "@/lib/staff-auth";
import { getWooOrder, updateWooOrder } from "@/lib/woocommerce/orders";
import { sendOrderCompleteEmail } from "@/lib/email/send-order-confirmation";

const completeRequestSchema = z.object({
  orderId: z.number().int().positive(),
});

export async function POST(request: Request) {
  // Defense-in-depth: proxy.ts already gates /api/admin/*, but per the framework's own guidance
  // a matcher/route refactor could silently drop that coverage, so re-check here too.
  if (!(await isStaffAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = completeRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }
  const { orderId } = parsed.data;

  const order = await getWooOrder(orderId);
  if (order.status !== "processing") {
    return NextResponse.json({ error: `Order is not awaiting completion (status: ${order.status})` }, { status: 409 });
  }

  const updated = await updateWooOrder(orderId, { status: "completed" });

  const fulfilmentType = order.meta_data.find((m) => m.key === "_checkout_fulfilment_type")?.value as
    | "delivery"
    | "collection"
    | undefined;

  // A failed email shouldn't fail marking the order complete.
  await sendOrderCompleteEmail({
    to: order.billing.email,
    customerName: order.billing.first_name,
    orderNumber: updated.number,
    fulfilmentType: fulfilmentType ?? "collection",
  });

  return NextResponse.json({ status: "completed", orderId: updated.id, orderNumber: updated.number });
}
