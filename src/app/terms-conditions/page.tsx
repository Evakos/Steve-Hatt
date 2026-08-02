import Header from "@/components/header";
import AnnouncementBanner from "@/components/announcement-banner";
import Footer from "@/components/footer";

export const metadata = {
  title: "Terms & Conditions | Steve Hatt Fishmongers",
  description: "Terms and Conditions of sale for Steve Hatt Fishmongers.",
};

export default function TermsConditionsPage() {
  return (
    <main className="flex flex-1 flex-col">
      <AnnouncementBanner />
      <Header />

      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="font-serif text-3xl font-bold text-navy">Terms and Conditions</h1>

          <div className="mt-8 space-y-5 text-lg leading-relaxed text-text-light">
            <p>
              These are the standard terms and conditions of sale of Marsland Fish Supplies Limited, 102 Dartmouth
              Park Hill, London N19 5HU. By placing an order and purchasing goods from Steve Hatt Fishmongers
              website you are agreeing to these terms and conditions. To protect your own interests, please read
              them carefully. We advise that you print and retain these terms for your records.
            </p>
            <p>
              Under English law, we may not enter into a contract with any person under 18 years of age. By
              placing an order you declare that you are at least 18 years old and you have read and understand
              the terms and conditions.
            </p>

            <h2 className="pt-2 font-serif text-lg font-semibold text-navy">Your Statutory Rights</h2>
            <p>The contents of our terms and conditions detailed below do not affect your statutory rights in any way.</p>

            <h2 className="pt-2 font-serif text-lg font-semibold text-navy">Our Website</h2>
            <p>
              We reserve the right to change any of the contents of any part of this site, at any time and without
              notice. We will not be held responsible for any misuse of links from the website by other parties
              or any content of websites to which we have linked on stevehattfishmongers.co.uk.
            </p>

            <h2 className="pt-2 font-serif text-lg font-semibold text-navy">Pricing Policy</h2>
            <p>
              The price of goods shall be in accordance with those set out on the relevant webpage on
              stevehattfishmongers.co.uk. We make every effort to ensure that the prices within our website are
              correct.
            </p>
            <p>
              Due to the nature of our business, our prices will vary according to weather, seasonality, and
              supply. You are advised to check the prices of our fish on this website before placing an order. If
              you are ordering fish in advance please call us on{" "}
              <a href="tel:+442072263963" className="text-navy underline hover:text-lobster">020 7226 3963</a>{" "}
              for a specific quotation and you can decide whether the new price is acceptable; otherwise we will
              apply the day&apos;s price on the day of dispatch.
            </p>
            <p>
              The total price of any order you place through stevehattfishmongers.co.uk is inclusive of value
              added tax (VAT).
            </p>

            <h2 className="pt-2 font-serif text-lg font-semibold text-navy">Orders</h2>
            <p>
              Your order shall only include quantity, quality and description of goods as set out in your order,
              and which has been accepted by us. We reserve the right to reject any order, although they are
              normally accepted if the selected products are available and your payment method is authorised for
              the transaction. No order submitted by you shall be deemed to be accepted by us until it is
              confirmed via email or in writing by us.
            </p>
            <p>
              Any error or omission in any information or document issued by Steve Hatt Fishmongers shall be
              subject to correction, provided that it does not affect the contract herewith. Steve Hatt
              Fishmongers are entitled to withdraw from any contract in the case of obvious errors and/or
              inaccuracies regarding the descriptions on stevehattfishmongers.co.uk. The description, quality and
              quantity of the relevant purchased goods will be those set out on the relevant pages of
              stevehattfishmongers.co.uk.
            </p>

            <h2 className="pt-2 font-serif text-lg font-semibold text-navy">Payment</h2>
            <p>
              We process all the usual credit or debit cards online. When you place an order using a debit or
              credit card, you confirm that all the information contained within the order is true and that you
              authorise us to deduct the confirmed amount from your chosen payment card.
            </p>
            <p>
              Once your order has been packaged and is ready for delivery, we will debit your credit/debit card on
              the same day we dispatch the order. We will require the postal code of where the credit/debit card
              is registered to.
            </p>
            <p>
              Should we not be able to collect payment for reasons outside of our control, we will not dispatch
              your order. Should this happen we will make every effort to contact you and advise you, however we
              accept no liability for any loss incurred due to the delay in dispatching your order.
            </p>
            <p>
              Where goods have been returned by you and a fair settlement has been agreed, we will credit the same
              payment card with an appropriate amount. We will not pass on your personal information to any third
              party without your permission, and unless solely due to our negligence, will not be held responsible
              for any problems you may incur or losses you may suffer.
            </p>

            <h2 className="pt-2 font-serif text-lg font-semibold text-navy">Delivery Area</h2>
            <p>
              We currently only dispatch to the following London postcode areas: EC1, EC2, E2, E5, E8, N1, N4, N5,
              N6, N7, N10, N16, N19, NW5.
            </p>

            <h2 className="pt-2 font-serif text-lg font-semibold text-navy">Delivery</h2>
            <p>
              Delivery of your order shall be made to the delivery address provided. You are responsible for
              giving us the full name of the recipient and correct address for all deliveries, including but not
              limited to the postcode. These details are passed directly to the delivery driver once the order is
              placed, and if our drivers are unable to deliver any order due to any error in the address, you will
              be charged for the order in full. If there is no answer at the specified delivery address and no
              alternative delivery instructions, the driver will attempt to leave the delivery at a neighbouring
              address unless stated not to do so in the delivery instructions on your order; if the driver is
              unable to leave the delivery with a neighbouring address and there are no delivery instructions and
              no safe place to leave the order, the delivery will be returned to the depot and it will become your
              responsibility to collect it. Should you ask for your order to be left in a specific place and the
              driver cannot obtain a signature to confirm the delivery of your order, it will be left at your own
              risk; we accept no liability for its loss or damage.
            </p>
            <p>Our minimum order cost is £20, for which there is no delivery fee.</p>
            <p>
              Orders are packed per species, wrapped in greaseproof paper, chilled and iced before being dispatched
              for &ldquo;next day delivery&rdquo;. Normally your order will reach you before midday on the day
              following dispatch and up to 6pm, sometimes however it may be delayed.
            </p>
            <p>
              If, for reasons within our control, we fail to deliver part or whole of your order, we will
              reimburse no more than the price of the goods.
            </p>

            <h2 className="pt-2 font-serif text-lg font-semibold text-navy">Our Guarantee</h2>
            <p>
              We aim to supply fish and products of the highest standard; if you are not happy with the quality of
              our fish and products, we will refund your money by the same method as payment was received. We
              reserve the right to collect any product that is deemed unsatisfactory prior to issuing a refund.
            </p>
            <p>
              Whilst we make every effort to remove all bones from filleted fish, please check thoroughly that
              there are no bones or foreign bodies left within any fillets as no liability will be accepted by the
              company for any injury or loss as a result of these items. Not all fish that are filleted will be
              pin-boned as this can be detrimental to the look of the product and will mean a greater loss of
              edible meat, please contact us if you have any questions about what species this will affect.
            </p>

            <h2 className="pt-2 font-serif text-lg font-semibold text-navy">Refunds</h2>
            <p>
              If there is something wrong with your order you can contact us within 48 hours of delivery to
              discuss replacement or refund. Please call the shop on{" "}
              <a href="tel:+442072263963" className="text-navy underline hover:text-lobster">020 7226 3963</a> or
              email{" "}
              <a href="mailto:contact@stevehattfishmongers.co.uk" className="text-navy underline hover:text-lobster">
                contact@stevehattfishmongers.co.uk
              </a>
              .
            </p>

            <h2 className="pt-2 font-serif text-lg font-semibold text-navy">Cancellation of Orders</h2>
            <p>You may cancel your order at any time up to 9am on the day of dispatch.</p>
            <p>
              Any fish that has been sourced specially for you (by prior agreement) will be charged for in full.
              If we are subsequently able to sell all or part of those items sourced specially, we undertake to
              credit you in full for the value of those items. The right to return goods will not apply in respect
              of: personalised goods or goods made to your specification, or food, drink or other goods intended
              for everyday consumption.
            </p>

            <h2 className="pt-2 font-serif text-lg font-semibold text-navy">Personal Details</h2>
            <p>
              We will not pass on any details about you to any person not directly employed by us, unless required
              to do so by law. To find out more about our policy regarding personal details, read our{" "}
              <a href="/privacy-policy" className="text-navy underline hover:text-lobster">privacy policy</a>.
            </p>

            <h2 className="pt-2 font-serif text-lg font-semibold text-navy">Customer Support</h2>
            <p>
              You may call us on{" "}
              <a href="tel:+442072263963" className="text-navy underline hover:text-lobster">020 7226 3963</a>{" "}
              during operating hours; if the line is not attended, please leave a message and we will call you
              back upon our return. Alternatively, you may email us at{" "}
              <a href="mailto:contact@stevehattfishmongers.co.uk" className="text-navy underline hover:text-lobster">
                contact@stevehattfishmongers.co.uk
              </a>
              .
            </p>

            <h2 className="pt-2 font-serif text-lg font-semibold text-navy">Complaints</h2>
            <p>
              We sincerely hope that you never have cause to complain about our service or products. If you are
              not entirely satisfied with our products, please telephone us on{" "}
              <a href="tel:+442072263963" className="text-navy underline hover:text-lobster">020 7226 3963</a> as
              soon as possible and we will do our best to resolve any issues that you may have. We operate a
              refund policy where our goods or services are found to be at fault. All effort is made to ensure
              there is no shell or cartilage in the crab meat, but we do advise you to check before use as well.
              Any complaints must be made within 48 hours of delivery, or in a time frame we feel is appropriate.
            </p>

            <h2 className="pt-2 font-serif text-lg font-semibold text-navy">Claims</h2>
            <p>
              Except in respect of death or personal injury caused by our negligence, we are not liable for any
              loss or damage caused by us in circumstances where: we have not breached our legal duty of care owed
              to you; it is not reasonably foreseeable that any loss or damage incurred is a result of this
              breach; or you have breached any part of your contract that has incurred loss or damage.
            </p>

            <h2 className="pt-2 font-serif text-lg font-semibold text-navy">Christmas Orders</h2>
            <p>
              In addition to our normal terms and conditions, the following apply to all Christmas orders and
              govern any purchases you may make on our website. Whilst we have taken reasonable precautions to
              ensure that prices quoted on the website are correct and products described reasonably accurately,
              when ordering through the website you accept and note that:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>due to the nature of our business, prices will vary according to weather, seasonality, and supply;</li>
              <li>the weights, dimensions and capacities shown on the website are approximate only and may be subject to change;</li>
              <li>packaging may vary from that shown on the website;</li>
              <li>products shown are not the actual size;</li>
              <li>
                all products are subject to availability, meaning we may not always be able to supply your order,
                we will inform you as soon as possible if the product(s) you have ordered are not available and,
                if agreeable to you, may offer alternative products of equal or higher value;
              </li>
              <li>numbers of servings in the product descriptions are for guidance purposes only;</li>
              <li>
                orders will only be accepted if there are no material errors in the description of the products
                or their prices as advertised, and subject to successful authorisation and processing of your
                payment.
              </li>
            </ul>
            <p>
              If you do not agree to abide by these terms, please do not use or access the website or order any
              products made available on it.
            </p>
            <p>
              <strong className="text-navy">Ordering</strong>, when you have confirmed all the products you wish
              to order, you will be given an estimated total order price, which will also set out the deposit sum
              you are required to pay upon completion of placing your order. The deposit sum will be taken
              following authorisation of your payment details and is non-refundable. Our acceptance of your order
              takes place upon payment of the deposit sum. All card payments are subject to authorisation by your
              card issuer.
            </p>
            <p>
              Please note that any outstanding sums owed, as set out in your estimated order price, will need to
              be paid upon collection of your Christmas food order. You will also receive a confirmation email
              containing details of your order, please keep this safe and bring it with you (printed, or on a
              device) when collecting your order.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
