// apps/web/app/business/[slug]/layout.tsx

import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase-server';

interface BusinessLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

interface Business {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  description: string | null;
}

async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('businesses')
    .select('id, name, slug, logo_url, description')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);

  if (!business) {
    return {
      title: 'Business Not Found | NoxaLoyalty',
    };
  }

  return {
    title: `${business.name} | NoxaLoyalty`,
    description:
      business.description ||
      `Visit ${business.name} on NoxaLoyalty for rewards and booking.`,
  };
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
      {/* Business Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center gap-4 px-4 py-4">
          <Link href={`/business/${slug}`} className="flex items-center gap-3">
            {business.logo_url ? (
              <Image
                src={business.logo_url}
                alt={business.name}
                width={48}
                height={48}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                {business.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-lg font-semibold">{business.name}</h1>
              <p className="text-sm text-muted-foreground">Powered by NoxaLoyalty</p>
            </div>
          </Link>
        </div>
      </header>

      {/* Page Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t bg-card py-6 text-center text-sm text-muted-foreground">
        <p>
          Powered by{' '}
          <a
            href="https://noxaloyalty.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            NoxaLoyalty
          </a>
        </p>
      </footer>
    </div>
  );
}
