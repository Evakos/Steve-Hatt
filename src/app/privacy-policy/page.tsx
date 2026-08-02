import Header from "@/components/header";
import AnnouncementBanner from "@/components/announcement-banner";
import Footer from "@/components/footer";

export const metadata = {
  title: "Privacy Policy | Steve Hatt Fishmongers",
  description: "Privacy Policy for Steve Hatt Fishmongers.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="flex flex-1 flex-col">
      <AnnouncementBanner />
      <Header />

      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="font-serif text-3xl font-bold text-navy">Privacy Policy</h1>

          <div className="mt-8 space-y-5 text-lg leading-relaxed text-text-light">
            <p>
              This Privacy Policy governs the manner in which Marsland Fish Supplies Limited collects, uses,
              maintains and discloses information collected from users (each, a &ldquo;User&rdquo;) of the
              www.stevehattfishmongers.co.uk website (&ldquo;Site&rdquo;). This privacy policy applies to the Site
              and all products and services offered by Marsland Fish Supplies Limited.
            </p>

            <h2 className="pt-2 font-serif text-lg font-semibold text-navy">Personal identification information</h2>
            <p>
              We may collect personal identification information from Users in a variety of ways, including, but
              not limited to, when Users visit our site, register on our site, subscribe to the newsletter,
              respond to a survey, fill out a form, and in connection with other activities, services, features or
              resources we make available on our Site. Users may be asked for, as appropriate, name, email
              address, mailing address, phone number. Users may, however, visit our Site anonymously. We will
              collect personal identification information from Users only if they voluntarily submit such
              information to us. Users can always refuse to supply personal identification information, which may
              prevent them from engaging in certain Site related activities.
            </p>

            <h2 className="pt-2 font-serif text-lg font-semibold text-navy">Web browser cookies</h2>
            <p>
              Our Site uses &ldquo;cookies&rdquo; to collect information about browsing and purchasing behaviour of
              Users who access our site. The cookies are small files added to your device which enables us to
              recognise the device and tailor the products and services offered to you. You may choose to set
              your web browser to refuse cookies, or to alert you when cookies are being sent. If you do so, some
              parts of the Site may not function properly.
            </p>

            <h2 className="pt-2 font-serif text-lg font-semibold text-navy">How we use collected information</h2>
            <p>We may collect and use your personal information for the following purposes:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-navy">To improve customer service</strong>, information you provide helps
                us respond to your customer service requests and support needs more efficiently.
              </li>
              <li>
                <strong className="text-navy">To personalise user experience</strong>, we may use information in
                the aggregate to understand how our Users as a group use the services and resources provided on
                our Site.
              </li>
              <li>
                <strong className="text-navy">To improve our Site</strong>, we may use feedback you provide to
                improve our products and services.
              </li>
              <li>
                <strong className="text-navy">To process payments</strong>, we may use the information you
                provide about yourself when placing an order only to provide service to that order. We do not
                share this information with outside parties except to the extent necessary to provide the service.
              </li>
              <li>
                <strong className="text-navy">To send periodic emails</strong>, we may use the email address to
                send User information and updates pertaining to their order. It may also be used to respond to
                their enquiries, questions, and/or other requests.
              </li>
            </ul>

            <h2 className="pt-2 font-serif text-lg font-semibold text-navy">How we protect your information</h2>
            <p>
              We adopt appropriate data collection, storage and processing practices and security measures to
              protect against unauthorised access, alteration, disclosure or destruction of your personal
              information, username, password, transaction information and data stored on our Site.
            </p>

            <h2 className="pt-2 font-serif text-lg font-semibold text-navy">Sharing your personal information</h2>
            <p>
              We do not sell, trade, or rent Users&apos; personal identification information to others. We may
              share generic aggregated demographic information not linked to any personal identification
              information regarding visitors and users with our business partners, trusted affiliates and
              advertisers for the purposes outlined above. We may use third party service providers to help us
              operate our business and the Site or administer activities on our behalf, such as sending out
              newsletters or surveys. We may share your information with these third parties for those limited
              purposes provided that you have given us your permission.
            </p>

            <h2 className="pt-2 font-serif text-lg font-semibold text-navy">Third party websites</h2>
            <p>
              Users may find advertising or other content on our Site that links to the sites and services of our
              partners, suppliers, advertisers, sponsors, licensors and other third parties. We do not control the
              content or links that appear on these sites and are not responsible for the practices employed by
              websites linked to or from our Site. In addition, these sites or services, including their content
              and links, may be constantly changing. These sites and services may have their own privacy policies
              and customer service policies. Browsing and interaction on any other website, including websites
              which have a link to our Site, is subject to that website&apos;s own terms and policies.
            </p>

            <h2 className="pt-2 font-serif text-lg font-semibold text-navy">Changes to this privacy policy</h2>
            <p>
              Marsland Fish Supplies Limited has the discretion to update this privacy policy at any time. When we
              do, we will revise the updated date at the bottom of this page. We encourage Users to frequently
              check this page for any changes to stay informed about how we are helping to protect the personal
              information we collect. You acknowledge and agree that it is your responsibility to review this
              privacy policy periodically and become aware of modifications.
            </p>
            <p className="text-xs text-text-light/70">Updated 27/03/2020</p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
