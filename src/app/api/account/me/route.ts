import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-auth";
import { getCustomer } from "@/lib/woocommerce/customers";

/** Used by checkout to prefill contact/address fields for a signed-in customer. Returns 401 with
 * no body detail for guests - this is a convenience lookup, not something guest checkout depends on. */
export async function GET() {
  const customerId = await getCustomerSession();
  if (!customerId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const customer = await getCustomer(customerId);
  return NextResponse.json({
    email: customer.email,
    firstName: customer.first_name,
    lastName: customer.last_name,
    phone: customer.billing.phone ?? "",
    address: {
      line1: customer.billing.address_1 ?? "",
      line2: customer.billing.address_2 ?? "",
      city: customer.billing.city ?? "",
      postcode: customer.billing.postcode ?? "",
    },
  });
}
