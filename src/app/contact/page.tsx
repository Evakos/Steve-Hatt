import Header from "@/components/header";
import AnnouncementBanner from "@/components/announcement-banner";
import Footer from "@/components/footer";
import ContactForm from "@/components/contact-form";

export const metadata = {
  title: "Contact | Steve Hatt Fishmongers",
  description: "Get in touch with Steve Hatt Fishmongers — 88 Essex Road, Islington, London.",
};

export default function ContactPage() {
  return (
    <main className="flex flex-1 flex-col">
      <AnnouncementBanner />
      <Header />

      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 pt-16 pb-4">
          <p className="text-xs tracking-widest text-text-light uppercase">Contact</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-navy md:text-4xl">Get in Touch</h1>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <p className="text-sm leading-relaxed text-text-light">
                The quickest way to get in touch with us is to give us a call.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-text-light">
                If you&apos;d rather send us a message, complete the form and we&apos;ll aim to respond within 48
                hours — in busier periods this may take a little longer.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-text-light">
                <strong className="text-navy">Please note:</strong> we don&apos;t take orders by email or message —
                order online or call the shop instead.
              </p>

              <div className="mt-8 space-y-1 text-sm text-text-light">
                <p>
                  <a href="tel:+442072263963" className="font-medium text-navy transition-colors hover:text-lobster">
                    020 7226 3963
                  </a>
                </p>
                <p>88 Essex Road, Islington, London N1 8LU</p>
                <p>
                  <a href="mailto:hello@stevehattfishmongers.co.uk" className="transition-colors hover:text-navy">
                    hello@stevehattfishmongers.co.uk
                  </a>
                </p>
              </div>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
