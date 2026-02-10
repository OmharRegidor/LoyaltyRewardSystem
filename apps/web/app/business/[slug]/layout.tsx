// apps/web/app/business/[slug]/layout.tsx

import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getBusinessBySlug } from '@/lib/services/public-business.service';
import { Building2 } from 'lucide-react';
import { NavLink } from './components/nav-link';
import { MobileNav } from './components/mobile-nav';

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
    <div className="min-h-screen" style={{ backgroundColor: '#ffffff' }}>
      {/* Header - Primary color background like landing page */}
      <header className="sticky top-0 z-50 bg-primary shadow-lg">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex h-14 items-center justify-between">
            {/* Business Logo & Name */}
            <Link
              href={`/business/${slug}`}
              className="flex items-center gap-3 group"
            >
              {/* Glow effect on hover */}
              <div className="relative">
                <div className="absolute inset-0 bg-secondary/30 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-125" />
                {business.logo_url ? (
                  <Image
                    src={business.logo_url}
                    alt={business.name}
                    width={40}
                    height={40}
                    className="rounded-lg object-cover relative z-10 transition-transform duration-300 group-hover:scale-105 ring-2 ring-white/20"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 border border-white/20 relative z-10 transition-transform duration-300 group-hover:scale-105">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>
              <span className="font-semibold text-base sm:text-lg text-white group-hover:text-secondary transition-colors duration-300 truncate max-w-[120px] sm:max-w-none">
                {business.name}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink href={`/business/${slug}`}>About</NavLink>
              <NavLink href={`/business/${slug}/my-bookings`}>
                My Bookings
              </NavLink>
              <NavLink href={`/business/${slug}/rewards`}>Rewards</NavLink>
              <NavLink href={`/business/${slug}/card`}>Get Card</NavLink>
            </nav>

            {/* Mobile Navigation */}
            <MobileNav slug={slug} businessName={business.name} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-2 sm:px-4 lg:px-8">{children}</main>

      {/* Footer */}
      <footer
        className="border-t border-gray-200 py-6 mt-10"
        style={{ backgroundColor: '#f9fafb' }}
      >
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <p className="text-sm text-gray-500">
            Powered by{' '}
            <Link
              href="/"
              className="font-medium bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            >
              NoxaLoyalty
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
