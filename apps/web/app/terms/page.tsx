// apps/web/app/terms/page.tsx

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | NoxaLoyalty',
  description: 'Terms of Service for NoxaLoyalty loyalty rewards platform',
};

export default function TermsOfServicePage() {
  const lastUpdated = 'January 29, 2026';
  const effectiveDate = 'January 29, 2026';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Terms of Service
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Last updated: {lastUpdated}
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 md:p-12">
          <div className="prose prose-gray dark:prose-invert max-w-none">
            {/* Introduction */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                1. Introduction
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Welcome to NoxaLoyalty ("we," "our," or "us"). These Terms of
                Service ("Terms") govern your access to and use of the
                NoxaLoyalty platform, including our website at noxaloyalty.com,
                mobile applications, and related services (collectively, the
                "Service").
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-4">
                By accessing or using our Service, you agree to be bound by
                these Terms. If you disagree with any part of these Terms, you
                may not access the Service.
              </p>
            </section>

            {/* Definitions */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                2. Definitions
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
                <li>
                  <strong>"Business Owner"</strong> refers to individuals or
                  entities who register to use NoxaLoyalty to create and manage
                  loyalty programs for their customers.
                </li>
                <li>
                  <strong>"Staff"</strong> refers to employees or
                  representatives of a Business Owner who are granted access to
                  use certain features of the Service.
                </li>
                <li>
                  <strong>"Customer"</strong> refers to end-users who
                  participate in loyalty programs through our mobile
                  application.
                </li>
                <li>
                  <strong>"Points"</strong> refers to the virtual currency
                  earned and redeemed within the loyalty program.
                </li>
                <li>
                  <strong>"Rewards"</strong> refers to the benefits, discounts,
                  or items that can be redeemed using Points.
                </li>
              </ul>
            </section>

            {/* Account Registration */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                3. Account Registration
              </h2>
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-6 mb-3">
                3.1 Eligibility
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                You must be at least 18 years old to create a Business Owner
                account. Customers must be at least 13 years old to use the
                mobile application. By using the Service, you represent that you
                meet these age requirements.
              </p>

              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-6 mb-3">
                3.2 Account Security
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                You are responsible for maintaining the confidentiality of your
                account credentials and for all activities that occur under your
                account. You agree to immediately notify us of any unauthorized
                use of your account.
              </p>

              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-6 mb-3">
                3.3 Account Information
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                You agree to provide accurate, current, and complete information
                during registration and to update such information to keep it
                accurate, current, and complete.
              </p>
            </section>

            {/* Service Description */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                4. Service Description
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                NoxaLoyalty provides a platform that enables:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300 mt-4">
                <li>
                  Business Owners to create and manage customer loyalty programs
                </li>
                <li>
                  Staff to process transactions and award points to customers
                </li>
                <li>
                  Customers to earn points, track rewards, and redeem benefits
                </li>
                <li>Analytics and reporting for Business Owners</li>
                <li>QR code-based customer identification</li>
              </ul>
            </section>

            {/* Subscription and Payments */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                5. Subscription and Payments
              </h2>
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-6 mb-3">
                5.1 Pricing Plans
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                NoxaLoyalty offers various subscription plans with different
                features and pricing. Current pricing is available on our
                website. We reserve the right to modify pricing with 30 days'
                notice to existing subscribers.
              </p>

              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-6 mb-3">
                5.2 Billing
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Subscriptions are billed in advance on a monthly or annual
                basis. All fees are non-refundable except as required by law or
                as explicitly stated in these Terms.
              </p>

              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-6 mb-3">
                5.3 Cancellation
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                You may cancel your subscription at any time. Cancellation will
                take effect at the end of the current billing period. You will
                retain access to the Service until the end of your paid period.
              </p>
            </section>

            {/* Points and Rewards */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                6. Points and Rewards
              </h2>
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-6 mb-3">
                6.1 Points Earning
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Points are earned based on the rules set by each Business Owner.
                The rate of earning and any bonuses (such as tier multipliers)
                are determined by the Business Owner's configuration.
              </p>

              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-6 mb-3">
                6.2 Points Value
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Points have no cash value and cannot be exchanged for cash.
                Points can only be redeemed for rewards offered by the issuing
                Business Owner.
              </p>

              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-6 mb-3">
                6.3 Points Expiration
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Business Owners may set expiration policies for points. Expired
                points cannot be recovered. It is the Customer's responsibility
                to track point expiration dates.
              </p>

              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-6 mb-3">
                6.4 Reward Redemption
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Rewards are subject to availability and the terms set by the
                Business Owner. NoxaLoyalty is not responsible for the quality,
                safety, or fulfillment of rewards provided by Business Owners.
              </p>
            </section>

            {/* User Conduct */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                7. User Conduct
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                You agree not to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300 mt-4">
                <li>
                  Use the Service for any illegal purpose or in violation of any
                  laws
                </li>
                <li>
                  Attempt to gain unauthorized access to any part of the Service
                </li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Create multiple accounts to abuse promotions or rewards</li>
                <li>
                  Manipulate or falsify transaction data or point balances
                </li>
                <li>
                  Share QR codes or account credentials with others to
                  fraudulently earn points
                </li>
                <li>
                  Reverse engineer or attempt to extract source code from the
                  Service
                </li>
                <li>
                  Use automated scripts or bots to interact with the Service
                </li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                8. Intellectual Property
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                The Service and its original content, features, and
                functionality are owned by NoxaLoyalty and are protected by
                international copyright, trademark, patent, trade secret, and
                other intellectual property laws.
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-4">
                Business Owners retain ownership of their business logos, reward
                images, and other content they upload. By uploading content, you
                grant NoxaLoyalty a non-exclusive, worldwide license to use,
                display, and distribute such content in connection with the
                Service.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                9. Limitation of Liability
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, NOXALOYALTY SHALL NOT BE
                LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
                PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS,
                DATA, USE, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH
                YOUR USE OF THE SERVICE.
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-4">
                OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID TO US
                IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
              </p>
            </section>

            {/* Disclaimer of Warranties */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                10. Disclaimer of Warranties
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
                WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT
                NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS
                FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-4">
                We do not warrant that the Service will be uninterrupted,
                secure, or error-free, or that defects will be corrected.
              </p>
            </section>

            {/* Indemnification */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                11. Indemnification
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                You agree to indemnify and hold harmless NoxaLoyalty, its
                officers, directors, employees, and agents from any claims,
                damages, losses, liabilities, costs, or expenses (including
                reasonable attorneys' fees) arising from your use of the Service
                or violation of these Terms.
              </p>
            </section>

            {/* Termination */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                12. Termination
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                We may terminate or suspend your account and access to the
                Service immediately, without prior notice or liability, for any
                reason, including breach of these Terms.
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-4">
                Upon termination:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300 mt-2">
                <li>Your right to use the Service will immediately cease</li>
                <li>Any accumulated points may be forfeited (for Customers)</li>
                <li>
                  Business data may be deleted after 30 days (for Business
                  Owners)
                </li>
                <li>You remain liable for any amounts owed to NoxaLoyalty</li>
              </ul>
            </section>

            {/* Governing Law */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                13. Governing Law
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                These Terms shall be governed by and construed in accordance
                with the laws of the Republic of the Philippines, without regard
                to its conflict of law provisions.
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-4">
                Any disputes arising from these Terms or the Service shall be
                resolved exclusively in the courts of the Philippines.
              </p>
            </section>

            {/* Changes to Terms */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                14. Changes to Terms
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                We reserve the right to modify these Terms at any time. We will
                notify users of material changes via email or through the
                Service. Your continued use of the Service after such
                modifications constitutes acceptance of the updated Terms.
              </p>
            </section>

            {/* Severability */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                15. Severability
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                If any provision of these Terms is found to be unenforceable or
                invalid, that provision shall be limited or eliminated to the
                minimum extent necessary, and the remaining provisions shall
                remain in full force and effect.
              </p>
            </section>

            {/* Contact Information */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                16. Contact Information
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                If you have any questions about these Terms, please contact us
                at:
              </p>
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-700 dark:text-gray-200">
                  <strong>NoxaLoyalty</strong>
                  <br />
                  Email: noxa.company@noxaloyalty.com
                  <br />
                  Website: https://noxaloyalty.com
                </p>
              </div>
            </section>

            {/* Effective Date */}
            <section className="pt-8 border-t border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                These Terms of Service are effective as of {effectiveDate}.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              © 2026 NoxaLoyalty. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link
                href="/privacy"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm font-medium"
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
