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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Business Logo & Name */}
            <Link
              href={`/business/${slug}`}
              className="flex items-center gap-3 group"
            >
              {/* Glow effect on hover */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-125" />
                {business.logo_url ? (
                  <Image
                    src={business.logo_url}
                    alt={business.name}
                    width={40}
                    height={40}
                    className="rounded-lg object-cover relative z-10 transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 relative z-10 transition-transform duration-300 group-hover:scale-105">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                )}
              </div>
              <span className="font-semibold text-base sm:text-lg group-hover:text-primary transition-colors duration-300 truncate max-w-[120px] sm:max-w-none">
                {business.name}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink href={`/business/${slug}`}>About</NavLink>
              <NavLink href={`/business/${slug}/services`}>Services</NavLink>
              <NavLink href={`/business/${slug}/rewards`}>Rewards</NavLink>
              <NavLink href={`/business/${slug}/card`}>Get Card</NavLink>
            </nav>

            {/* Mobile Navigation */}
            <MobileNav slug={slug} businessName={business.name} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/30 py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Powered by{' '}
            <Link
              href="/"
              className="font-medium bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            >
              NoxaLoyalty
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
