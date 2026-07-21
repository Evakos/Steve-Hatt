import Image from "next/image";
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

      <section className="relative flex items-center bg-navy" style={{ minHeight: "320px" }}>
        <Image src="/heritage-shop-front.jpg" alt="" fill className="object-cover" priority />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to right, rgba(15, 23, 42, 0.75) 15%, rgba(15, 23, 42, 0.2) 60%)" }}
        />
        <div className="relative mx-auto w-full max-w-6xl px-6">
          <p className="mb-4 text-sm tracking-widest text-white/50 uppercase">Contact</p>
          <h1 className="font-serif text-4xl font-bold leading-[1.1] text-white md:text-5xl">Get in Touch</h1>
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
