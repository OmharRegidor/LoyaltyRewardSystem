import Link from 'next/link';

export const metadata = {
  title: 'Delete Account | NoxaLoyalty',
  description: 'Request deletion of your NoxaLoyalty account and associated data',
};

export default function DeleteAccountPage() {
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
              className="text-xs sm:text-sm uppercase tracking-[0.15em] text-foreground hover:text-primary transition-colors"
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
            Delete Account
          </h1>
        </div>
      </header>

      {/* Gold accent divider */}
      <div className="h-1 bg-secondary" />

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <section className="mb-10">
          <h2 className="text-2xl font-light text-muted-foreground mb-4">
            Request Account Deletion
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            If you would like to delete your NoxaLoyalty account and all
            associated data, please send an email to the address below with the
            subject line &ldquo;Account Deletion Request&rdquo;.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-light text-muted-foreground mb-4">
            How to Request Deletion
          </h2>
          <ol className="list-decimal pl-6 space-y-3 text-foreground/80">
            <li>
              Send an email to{' '}
              <a
                href="mailto:noxa.company@gmail.com?subject=Account%20Deletion%20Request"
                className="text-primary font-medium hover:underline"
              >
                noxa.company@gmail.com
              </a>
            </li>
            <li>
              Use the subject line: <strong>Account Deletion Request</strong>
            </li>
            <li>
              Include the <strong>email address</strong> associated with your
              NoxaLoyalty account in the body of the email
            </li>
            <li>
              We will process your request and confirm deletion within{' '}
              <strong>30 days</strong>
            </li>
          </ol>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-light text-muted-foreground mb-4">
            What Data Will Be Deleted
          </h2>
          <p className="text-foreground/80 leading-relaxed mb-4">
            Upon account deletion, the following data will be permanently
            removed:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-foreground/80">
            <li>Your profile information (name, email, profile photo)</li>
            <li>Loyalty points and rewards history</li>
            <li>QR scan history</li>
            <li>App preferences and settings</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-light text-muted-foreground mb-4">
            Data That May Be Retained
          </h2>
          <p className="text-foreground/80 leading-relaxed mb-4">
            Some data may be retained as required by law or for legitimate
            business purposes:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-foreground/80">
            <li>
              Transaction records (retained for 7 years for tax and legal
              compliance)
            </li>
            <li>
              Anonymized and aggregated analytics data that cannot identify you
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <div className="p-6 bg-muted rounded-lg">
            <h3 className="text-lg font-medium text-foreground mb-2">
              Contact Us
            </h3>
            <p className="text-foreground/80">
              If you have any questions about the account deletion process,
              please contact us at:
            </p>
            <p className="text-foreground mt-2">
              <strong>Email:</strong>{' '}
              <a
                href="mailto:noxa.company@gmail.com"
                className="text-primary hover:underline"
              >
                noxa.company@gmail.com
              </a>
            </p>
          </div>
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
                className="text-muted-foreground hover:text-foreground text-sm"
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
