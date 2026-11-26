import Header from "@/components/header";
import AnnouncementBanner from "@/components/announcement-banner";
import Footer from "@/components/footer";
import ContactForm from "@/components/contact-form";
import InnerPageHero from "@/components/inner-page-hero";

export const metadata = {
  title: "Contact | Steve Hatt Fishmongers",
  description: "Get in touch with Steve Hatt Fishmongers, 88 Essex Road, Islington, London.",
};

export default function ContactPage() {
  return (
    <main className="flex flex-1 flex-col">
      <AnnouncementBanner />
      <Header />

      <InnerPageHero
        minHeight={300}
        eyebrow="Contact"
        title="Get in Touch"
        subtitle="We're here to help"
      />

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-12 md:grid-cols-2">
            <div className="space-y-6">
              <p className="text-lg leading-relaxed text-text-light">
                The quickest way to get in touch with us is to give us a call.
              </p>
              <p className="text-lg leading-relaxed text-text-light">
                If you&apos;d rather send us a message, complete the form and we&apos;ll aim to respond within 48
                hours, in busier periods this may take a little longer.
              </p>
              <p className="text-lg leading-relaxed text-text-light">
                <strong className="text-navy">Please note:</strong> we don&apos;t take orders by email or message,
                order online or call the shop instead.
              </p>

              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 text-teal">📞</span>
                  <a href="tel:+442072263963" className="font-medium text-navy transition-colors hover:text-lobster">
                    020 7226 3963
                  </a>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 text-teal">📍</span>
                  <a href="https://maps.google.com/?q=88+Essex+Road,+Islington,+London+N1+8LU" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-navy">
                    88 Essex Road, Islington, London N1 8LU
                  </a>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 text-teal">✉️</span>
                  <a href="mailto:hello@stevehattfishmongers.co.uk" className="transition-colors hover:text-navy">
                    hello@stevehattfishmongers.co.uk
                  </a>
                </div>
              </div>
            </div>
            <div className="bg-sand p-6 md:p-8" style={{ borderRadius: "8px" }}>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
