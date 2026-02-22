// apps/web/app/business/page.tsx

import Link from 'next/link';
import Image from 'next/image';
import { getPublicBusinesses } from '@/lib/services/public-business.service';
import { BusinessDirectoryClient } from './components/business-directory-client';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface BusinessDirectoryPageProps {
  searchParams: Promise<{
    search?: string;
    type?: string;
    page?: string;
  }>;
}

export default async function BusinessDirectoryPage({
  searchParams,
}: BusinessDirectoryPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const { businesses, total } = await getPublicBusinesses({
    search: params.search,
    businessType: params.type,
    page,
    limit: 12,
  });

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#7F0404] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <Image
                src="/logoloyalty.png"
                alt="NoxaLoyalty"
                width={36}
                height={36}
                className="h-9 w-auto object-contain brightness-0 invert transition-transform duration-300 group-hover:scale-105"
              />
              <span className="font-bold text-white text-base sm:text-lg">
                NoxaLoyalty
              </span>
            </Link>

            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <BusinessDirectoryClient
          businesses={businesses}
          total={total}
          initialSearch={params.search || ''}
          initialType={params.type || ''}
          initialPage={page}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-500">
            Powered by{' '}
            <Link
              href="/"
              className="font-semibold text-[#7F0404] hover:opacity-80 transition-opacity"
            >
              NoxaLoyalty
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
