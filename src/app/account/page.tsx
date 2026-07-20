import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/customer-auth";
import { getCustomer } from "@/lib/woocommerce/customers";
import { listCustomerOrders } from "@/lib/woocommerce/orders";
import Header from "@/components/header";
import AnnouncementBanner from "@/components/announcement-banner";
import LogoutButton from "./logout-button";

export default async function AccountPage() {
  const customerId = await getCustomerSession();
  if (!customerId) {
    redirect("/account/login");
  }

  const [customer, orders] = await Promise.all([getCustomer(customerId), listCustomerOrders(customerId)]);
  const address = customer.billing;
  const hasAddress = Boolean(address.address_1);

  return (
    <main className="flex flex-1 flex-col bg-cream">
      <AnnouncementBanner />
      <Header />

      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-xs tracking-widest text-text-light uppercase">Your account</p>
            <h1 className="mt-1 font-serif text-3xl font-bold text-navy">
              {customer.first_name ? `Hi, ${customer.first_name}` : customer.email}
            </h1>
          </div>
          <LogoutButton />
        </div>

        {/* Saved address */}
        <section className="mt-8 border border-border bg-white p-6" style={{ borderRadius: "5px" }}>
          <h2 className="font-serif text-lg font-semibold text-navy">Saved details</h2>
          <p className="mt-1 text-sm text-text-light">{customer.email}</p>
          {hasAddress ? (
            <p className="mt-2 text-sm text-navy">
              {address.address_1}
              {address.address_2 ? `, ${address.address_2}` : ""}
              <br />
              {address.city} {address.postcode}
            </p>
          ) : (
            <p className="mt-2 text-sm text-text-light">
              No saved address yet — this fills in automatically the next time you check out while signed in.
            </p>
          )}
        </section>

        {/* Order history */}
        <section className="mt-6">
          <h2 className="font-serif text-lg font-semibold text-navy">Order history</h2>
          {orders.length === 0 ? (
            <p className="mt-3 text-sm text-text-light">
              No orders placed while signed in yet. <Link href="/shop" className="underline hover:text-navy">Start shopping</Link>.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="border border-border bg-white p-4" style={{ borderRadius: "5px" }}>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium text-navy">Order #{order.number}</span>
                    <span className="text-xs text-text-light">{new Date(order.date_created).toLocaleDateString("en-GB")}</span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between text-sm">
                    <span className="text-text-light capitalize">{order.status.replace("-", " ")}</span>
                    <span className="text-navy">£{order.total}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
