import Image from "next/image";
import Header from "@/components/header";
import AnnouncementBanner from "@/components/announcement-banner";
import Footer from "@/components/footer";
import InnerPageHero from "@/components/inner-page-hero";

export const metadata = {
  title: "Recruitment | Steve Hatt Fishmongers",
  description: "Join the Steve Hatt Fishmongers team, always on the lookout for talented fishmongers and blockmen.",
};

export default function RecruitmentPage() {
  return (
    <main className="flex flex-1 flex-col">
      <AnnouncementBanner />
      <Header />

      <InnerPageHero
        image="/recruitment-hero.png"
        eyebrow="Recruitment"
        title="Join the Family"
        subtitle="Supporting a Sustainable Ecology"
      />

      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 pt-16 text-center">
          <p className="text-lg leading-relaxed text-text-light">
            We believe in treating others like we want to be treated, and we&apos;re always on the lookout for
            talented individuals to join our team.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <h2 className="font-serif text-2xl font-bold text-navy">Available Positions</h2>
              <p className="mt-4 text-lg leading-relaxed text-text-light">
                At Steve Hatt, we take care of our staff as we would our own family. Working as a fishmonger
                isn&apos;t for the faint-hearted, in fact, there&apos;s no job quite like it. We recognise it can
                be a tough job, especially through the winter months, which is why we&apos;ve kept staffing hours
                to 40 a week.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-text-light">
                It&apos;s important to us that our staff enjoy their work and feel supported, we also offer very
                competitive rates of pay, because living in London isn&apos;t cheap.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-text-light">
                We&apos;re always on the lookout for fishmongers and blockmen, talented and trained. Retail
                experience is an advantage, but not necessary. If you&apos;re interested in joining the Steve Hatt
                family, send us an email with your CV to{" "}
                <a href="mailto:contact@stevehattfishmongers.co.uk" className="text-navy underline hover:text-lobster">
                  contact@stevehattfishmongers.co.uk
                </a>
                .
              </p>
            </div>
            <div className="relative h-72 overflow-hidden" style={{ borderRadius: "5px" }}>
              <Image src="/heritage-team.jpg" alt="The Steve Hatt team at work" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-sand">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h3 className="mb-4 font-serif text-lg font-semibold text-navy">Opening Hours</h3>
          <div className="space-y-2 text-sm text-text-light">
            <p>Tuesday - Saturday: 7am - 5pm</p>
            <p>Sunday: Closed</p>
            <p>Monday: Closed</p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
