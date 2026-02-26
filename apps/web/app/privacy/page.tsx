// apps/web/app/privacy/page.tsx

import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | NoxaLoyalty',
  description: 'Privacy Policy for NoxaLoyalty loyalty rewards platform',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'January 29, 2026';
  const effectiveDate = 'January 29, 2026';

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0 py-3 sm:py-0 sm:h-16">
          <Link href="/" className="text-xl font-bold text-primary">
            NoxaLoyalty
          </Link>
          <div className="flex items-center gap-4 sm:gap-8">
            <Link
              href="/"
              className="text-xs sm:text-sm uppercase tracking-[0.15em] text-foreground hover:text-primary transition-colors"
            >
              Home
            </Link>
            <Link
              href="/privacy"
              className="text-xs sm:text-sm uppercase tracking-[0.15em] text-foreground hover:text-primary transition-colors font-bold"
            >
              Policy
            </Link>
            <Link
              href="/terms"
              className="text-xs sm:text-sm uppercase tracking-[0.15em] text-foreground hover:text-primary transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Banner */}
      <header className="bg-primary relative">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white uppercase tracking-[0.1em] sm:tracking-[0.15em]">
            Privacy Policy
          </h1>
        </div>
      </header>

      {/* Gold accent divider */}
      <div className="h-1 bg-secondary" />

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <p className="text-muted-foreground text-sm mb-10">
          Last updated: {lastUpdated}
        </p>

        {/* Introduction */}
        <section className="mb-10">
          <h2 className="text-2xl font-light text-muted-foreground mb-4">
            1. Introduction
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            NoxaLoyalty (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or
            &ldquo;us&rdquo;) is committed to protecting your privacy. This
            Privacy Policy explains how we collect, use, disclose, and safeguard
            your information when you use our website at noxaloyalty.com, our
            mobile applications, and related services (collectively, the
            &ldquo;Service&rdquo;).
          </p>
          <p className="text-foreground/80 leading-relaxed mt-4">
            Please read this Privacy Policy carefully. By using the Service, you
            agree to the collection and use of information in accordance with
            this policy.
          </p>
        </section>

        {/* Information We Collect */}
        <section className="mb-10">
          <h2 className="text-2xl font-light text-muted-foreground mb-4">
            2. Information We Collect
          </h2>

          <h3 className="text-lg font-medium text-foreground/70 mt-6 mb-3">
            2.1 Information You Provide
          </h3>
          <p className="text-foreground/80 leading-relaxed">
            We collect information you provide directly to us, including:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-foreground/80 mt-4">
            <li>
              <strong>Account Information:</strong> Name, email address,
              password, phone number
            </li>
            <li>
              <strong>Business Information (for Business Owners):</strong>{' '}
              Business name, address, logo, business type, contact details
            </li>
            <li>
              <strong>Payment Information:</strong> Billing address, payment
              method details (processed securely by our payment provider)
            </li>
            <li>
              <strong>Profile Information:</strong> Profile photo, preferences,
              settings
            </li>
            <li>
              <strong>Communications:</strong> Messages, feedback, and support
              requests
            </li>
          </ul>

          <h3 className="text-lg font-medium text-foreground/70 mt-6 mb-3">
            2.2 Information Collected Automatically
          </h3>
          <p className="text-foreground/80 leading-relaxed">
            When you use our Service, we automatically collect certain
            information:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-foreground/80 mt-4">
            <li>
              <strong>Device Information:</strong> Device type, operating
              system, unique device identifiers, browser type
            </li>
            <li>
              <strong>Usage Data:</strong> Pages visited, features used, time
              spent, click patterns
            </li>
            <li>
              <strong>Transaction Data:</strong> Points earned, points redeemed,
              purchase amounts, transaction timestamps
            </li>
            <li>
              <strong>Location Data:</strong> General location based on IP
              address (we do not collect precise GPS location)
            </li>
            <li>
              <strong>Log Data:</strong> IP address, access times, error logs
            </li>
          </ul>

          <h3 className="text-lg font-medium text-foreground/70 mt-6 mb-3">
            2.3 Information from Third Parties
          </h3>
          <p className="text-foreground/80 leading-relaxed">
            We may receive information from third parties, including:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-foreground/80 mt-4">
            <li>
              <strong>Social Login Providers:</strong> If you sign in with
              Google, we receive your name, email, and profile picture from
              Google
            </li>
            <li>
              <strong>Analytics Providers:</strong> Aggregated usage statistics
              and trends
            </li>
          </ul>
        </section>

        {/* How We Use Your Information */}
        <section className="mb-10">
          <h2 className="text-2xl font-light text-muted-foreground mb-4">
            3. How We Use Your Information
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-foreground/80 mt-4">
            <li>Provide, maintain, and improve our Service</li>
            <li>Process transactions and send related information</li>
            <li>Create and manage your account</li>
            <li>Track loyalty points and rewards</li>
            <li>
              Send you technical notices, updates, and administrative messages
            </li>
            <li>Respond to your comments, questions, and support requests</li>
            <li>
              Communicate with you about products, services, offers, and
              promotions
            </li>
            <li>Monitor and analyze trends, usage, and activities</li>
            <li>
              Detect, investigate, and prevent fraudulent transactions and abuse
            </li>
            <li>Personalize and improve your experience</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        {/* Information Sharing */}
        <section className="mb-10">
          <h2 className="text-2xl font-light text-muted-foreground mb-4">
            4. Information Sharing and Disclosure
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            We may share your information in the following circumstances:
          </p>

          <h3 className="text-lg font-medium text-foreground/70 mt-6 mb-3">
            4.1 With Business Owners
          </h3>
          <p className="text-foreground/80 leading-relaxed">
            When you participate in a business&apos;s loyalty program, we share
            your transaction history, points balance, and basic profile
            information with that Business Owner to enable the loyalty program
            functionality.
          </p>

          <h3 className="text-lg font-medium text-foreground/70 mt-6 mb-3">
            4.2 With Service Providers
          </h3>
          <p className="text-foreground/80 leading-relaxed">
            We share information with third-party vendors who provide services
            on our behalf, including:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-foreground/80 mt-2">
            <li>Cloud hosting (Supabase, Vercel)</li>
            <li>Payment processing (Xendit)</li>
            <li>Email delivery (Resend)</li>
            <li>Analytics services</li>
          </ul>

          <h3 className="text-lg font-medium text-foreground/70 mt-6 mb-3">
            4.3 For Legal Reasons
          </h3>
          <p className="text-foreground/80 leading-relaxed">
            We may disclose information if required by law, legal process, or
            government request, or to protect the rights, property, or safety of
            NoxaLoyalty, our users, or others.
          </p>

          <h3 className="text-lg font-medium text-foreground/70 mt-6 mb-3">
            4.4 Business Transfers
          </h3>
          <p className="text-foreground/80 leading-relaxed">
            If NoxaLoyalty is involved in a merger, acquisition, or sale of
            assets, your information may be transferred as part of that
            transaction.
          </p>

          <h3 className="text-lg font-medium text-foreground/70 mt-6 mb-3">
            4.5 With Your Consent
          </h3>
          <p className="text-foreground/80 leading-relaxed">
            We may share information with your consent or at your direction.
          </p>
        </section>

        {/* Data Retention */}
        <section className="mb-10">
          <h2 className="text-2xl font-light text-muted-foreground mb-4">
            5. Data Retention
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            We retain your information for as long as your account is active or
            as needed to provide you with the Service. We may also retain
            certain information as required by law or for legitimate business
            purposes, including:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-foreground/80 mt-4">
            <li>Transaction records: 7 years (for tax and legal compliance)</li>
            <li>Account information: Until account deletion requested</li>
            <li>Communication records: 3 years</li>
            <li>Analytics data: 2 years (aggregated and anonymized)</li>
          </ul>
        </section>

        {/* Data Security */}
        <section className="mb-10">
          <h2 className="text-2xl font-light text-muted-foreground mb-4">
            6. Data Security
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            We implement appropriate technical and organizational measures to
            protect your information, including:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-foreground/80 mt-4">
            <li>Encryption of data in transit (TLS/SSL) and at rest</li>
            <li>Secure authentication with hashed passwords</li>
            <li>Regular security audits and vulnerability assessments</li>
            <li>Access controls and employee training</li>
            <li>Secure data centers with physical security measures</li>
          </ul>
          <p className="text-foreground/80 leading-relaxed mt-4">
            However, no method of transmission over the Internet or electronic
            storage is 100% secure. We cannot guarantee absolute security of
            your information.
          </p>
        </section>

        {/* Your Rights */}
        <section className="mb-10">
          <h2 className="text-2xl font-light text-muted-foreground mb-4">
            7. Your Rights and Choices
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            Depending on your location, you may have the following rights:
          </p>

          <h3 className="text-lg font-medium text-foreground/70 mt-6 mb-3">
            7.1 Access and Portability
          </h3>
          <p className="text-foreground/80 leading-relaxed">
            You may request access to the personal information we hold about you
            and receive a copy in a portable format.
          </p>

          <h3 className="text-lg font-medium text-foreground/70 mt-6 mb-3">
            7.2 Correction
          </h3>
          <p className="text-foreground/80 leading-relaxed">
            You may update or correct your information through your account
            settings or by contacting us.
          </p>

          <h3 className="text-lg font-medium text-foreground/70 mt-6 mb-3">
            7.3 Deletion
          </h3>
          <p className="text-foreground/80 leading-relaxed">
            You may request deletion of your account and associated data. Some
            information may be retained as required by law or for legitimate
            business purposes.
          </p>

          <h3 className="text-lg font-medium text-foreground/70 mt-6 mb-3">
            7.4 Marketing Communications
          </h3>
          <p className="text-foreground/80 leading-relaxed">
            You may opt out of promotional emails by clicking the
            &ldquo;unsubscribe&rdquo; link in any email. You may still receive
            transactional emails related to your account.
          </p>

          <h3 className="text-lg font-medium text-foreground/70 mt-6 mb-3">
            7.5 How to Exercise Your Rights
          </h3>
          <p className="text-foreground/80 leading-relaxed">
            To exercise any of these rights, please contact us at
            privacy@noxaloyalty.com. We will respond to your request within 30
            days.
          </p>
        </section>

        {/* Cookies and Tracking */}
        <section className="mb-10">
          <h2 className="text-2xl font-light text-muted-foreground mb-4">
            8. Cookies and Tracking Technologies
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            We use cookies and similar tracking technologies to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-foreground/80 mt-4">
            <li>
              <strong>Essential Cookies:</strong> Required for the Service to
              function (authentication, security)
            </li>
            <li>
              <strong>Analytics Cookies:</strong> Help us understand how you use
              our Service
            </li>
            <li>
              <strong>Preference Cookies:</strong> Remember your settings and
              preferences
            </li>
          </ul>
          <p className="text-foreground/80 leading-relaxed mt-4">
            You can control cookies through your browser settings. Disabling
            certain cookies may limit your use of some features.
          </p>
        </section>

        {/* Children's Privacy */}
        <section className="mb-10">
          <h2 className="text-2xl font-light text-muted-foreground mb-4">
            9. Children&apos;s Privacy
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            Our Service is not directed to children under 13 years of age. We do
            not knowingly collect personal information from children under 13.
            If we learn that we have collected personal information from a child
            under 13, we will take steps to delete such information promptly.
          </p>
          <p className="text-foreground/80 leading-relaxed mt-4">
            If you are a parent or guardian and believe your child has provided
            us with personal information, please contact us at
            privacy@noxaloyalty.com.
          </p>
        </section>

        {/* International Data Transfers */}
        <section className="mb-10">
          <h2 className="text-2xl font-light text-muted-foreground mb-4">
            10. International Data Transfers
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            Your information may be transferred to and processed in countries
            other than the Philippines, including the United States and
            Singapore, where our service providers are located. These countries
            may have different data protection laws than your country.
          </p>
          <p className="text-foreground/80 leading-relaxed mt-4">
            We ensure appropriate safeguards are in place to protect your
            information in accordance with this Privacy Policy, including
            standard contractual clauses where applicable.
          </p>
        </section>

        {/* Philippine Data Privacy Act */}
        <section className="mb-10">
          <h2 className="text-2xl font-light text-muted-foreground mb-4">
            11. Philippine Data Privacy Act Compliance
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            We comply with the Philippine Data Privacy Act of 2012 (Republic Act
            No. 10173) and its Implementing Rules and Regulations. As a data
            subject under Philippine law, you have the right to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-foreground/80 mt-4">
            <li>
              Be informed of the collection and processing of your personal data
            </li>
            <li>Object to the processing of your personal data</li>
            <li>Access your personal data</li>
            <li>Rectify inaccurate personal data</li>
            <li>
              Suspend, withdraw, or order the blocking, removal, or destruction
              of your personal data
            </li>
            <li>
              Be indemnified for any damages sustained due to inaccurate,
              incomplete, outdated, false, unlawfully obtained, or unauthorized
              use of personal data
            </li>
            <li>File a complaint with the National Privacy Commission</li>
          </ul>
        </section>

        {/* Third-Party Links */}
        <section className="mb-10">
          <h2 className="text-2xl font-light text-muted-foreground mb-4">
            12. Third-Party Links
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            Our Service may contain links to third-party websites or services.
            We are not responsible for the privacy practices of these third
            parties. We encourage you to review their privacy policies before
            providing any personal information.
          </p>
        </section>

        {/* Changes to Privacy Policy */}
        <section className="mb-10">
          <h2 className="text-2xl font-light text-muted-foreground mb-4">
            13. Changes to This Privacy Policy
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify
            you of any material changes by posting the new Privacy Policy on
            this page and updating the &ldquo;Last updated&rdquo; date.
          </p>
          <p className="text-foreground/80 leading-relaxed mt-4">
            For significant changes, we will provide a more prominent notice,
            such as an email notification. We encourage you to review this
            Privacy Policy periodically.
          </p>
        </section>

        {/* Contact Information */}
        <section className="mb-10">
          <h2 className="text-2xl font-light text-muted-foreground mb-4">
            14. Contact Us
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            If you have any questions about this Privacy Policy or our privacy
            practices, please contact us at:
          </p>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-foreground">
              <strong>NoxaLoyalty - Data Protection</strong>
              <br />
              Email: noxa.company@gmail.com
              <br />
              Website: https://noxaloyalty.com
            </p>
          </div>
          <p className="text-foreground/80 leading-relaxed mt-4">
            You may also file a complaint with the National Privacy Commission
            of the Philippines:
          </p>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-foreground">
              <strong>National Privacy Commission</strong>
              <br />
              Website: https://privacy.gov.ph
              <br />
              Email: complaints@privacy.gov.ph
            </p>
          </div>
        </section>

        {/* Data We Collect Summary Table */}
        <section className="mb-10">
          <h2 className="text-2xl font-light text-muted-foreground mb-4">
            15. Summary of Data Collection
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left border border-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-foreground font-semibold">
                    Data Type
                  </th>
                  <th className="px-4 py-3 text-foreground font-semibold">
                    Purpose
                  </th>
                  <th className="px-4 py-3 text-foreground font-semibold">
                    Retention
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-3 text-foreground/80">Name, Email</td>
                  <td className="px-4 py-3 text-foreground/80">
                    Account creation, communication
                  </td>
                  <td className="px-4 py-3 text-foreground/80">
                    Until account deletion
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-foreground/80">
                    Transaction Data
                  </td>
                  <td className="px-4 py-3 text-foreground/80">
                    Points tracking, analytics
                  </td>
                  <td className="px-4 py-3 text-foreground/80">7 years</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-foreground/80">Device Info</td>
                  <td className="px-4 py-3 text-foreground/80">
                    Security, optimization
                  </td>
                  <td className="px-4 py-3 text-foreground/80">2 years</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-foreground/80">Usage Data</td>
                  <td className="px-4 py-3 text-foreground/80">
                    Service improvement
                  </td>
                  <td className="px-4 py-3 text-foreground/80">
                    2 years (anonymized)
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-foreground/80">Payment Info</td>
                  <td className="px-4 py-3 text-foreground/80">
                    Billing (via payment processor)
                  </td>
                  <td className="px-4 py-3 text-foreground/80">7 years</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Effective Date */}
        <section className="pt-8 border-t border-border">
          <p className="text-muted-foreground text-sm">
            This Privacy Policy is effective as of {effectiveDate}.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-border py-6 sm:py-8 mt-8 sm:mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-sm">
              &copy; 2026 NoxaLoyalty. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link
                href="/privacy"
                className="text-muted-foreground hover:text-foreground text-sm font-medium"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
