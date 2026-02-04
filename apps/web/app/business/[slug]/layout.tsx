// apps/web/app/business/[slug]/layout.tsx

import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getBusinessBySlug } from '@/lib/services/public-business.service';
import { Building2 } from 'lucide-react';

interface BusinessLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function BusinessLayout({
  children,
  params,
}: BusinessLayoutProps) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);

  if (!business) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Business Logo & Name */}
            <Link
              href={`/business/${slug}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              {business.logo_url ? (
                <Image
                  src={business.logo_url}
                  alt={business.name}
                  width={40}
                  height={40}
                  className="rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
              )}
              <span className="font-semibold text-lg">{business.name}</span>
            </Link>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1">
              <Link
                href={`/business/${slug}`}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
              >
                About
              </Link>
              <Link
                href={`/business/${slug}/services`}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
              >
                Services
              </Link>
              <Link
                href={`/business/${slug}/rewards`}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
              >
                Rewards
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Powered by{' '}
            <Link
              href="/"
              className="font-medium text-primary hover:underline"
            >
              NoxaLoyalty
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
