'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Search,
  Building2,
  MapPin,
  ArrowRight,
  Store,
  Gift,
} from 'lucide-react';
import type { PublicBusiness } from '@/lib/services/public-business.service';

const BUSINESS_TYPES = [
  { value: 'retail', label: 'Retail Stores' },
  { value: 'restaurant', label: 'Restaurants & Cafés' },
  { value: 'salon', label: 'Salons & Spas' },
  { value: 'hotel', label: 'Hotels & Travel' },
  { value: 'healthcare', label: 'Health Care' },
  { value: 'barbershop', label: 'Barber Shop' },
  { value: 'rice_business', label: 'Rice Business' },
];

const BUSINESS_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  BUSINESS_TYPES.map((t) => [t.value, t.label]),
);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut' as const },
  },
};

interface BusinessDirectoryClientProps {
  businesses: PublicBusiness[];
  initialSearch: string;
  initialType: string;
}

export function BusinessDirectoryClient({
  businesses,
  initialSearch,
  initialType,
}: BusinessDirectoryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      router.push(`/business?${params.toString()}`);
    },
    [router, searchParams],
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams({ search: value });
    }, 400);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleTypeChange = (value: string) => {
    updateParams({ type: value });
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-primary overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14 sm:pt-14 sm:pb-20">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
              Discover Local{' '}
              <span className="text-secondary">Businesses</span>
            </h1>
            <p className="text-white/70 text-base sm:text-lg max-w-xl mx-auto mb-8">
              Find businesses with loyalty programs near you. Earn points and
              unlock rewards at your favorite stores.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search businesses by name..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 rounded-xl bg-white text-gray-900 placeholder-gray-400 border-0 shadow-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
              <select
                value={initialType || ''}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="h-12 px-4 rounded-xl bg-white text-gray-700 border-0 shadow-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary cursor-pointer sm:w-[180px]"
              >
                <option value="">All Types</option>
                {BUSINESS_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
            preserveAspectRatio="none"
          >
            <path
              d="M0 60V30C240 0 480 0 720 20C960 40 1200 40 1440 20V60H0Z"
              fill="#faf8f5"
            />
          </svg>
        </div>
      </section>

      {/* Results Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Results Count & Active Filters */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            {businesses.length === 0
              ? 'No businesses found'
              : `${businesses.length} business${businesses.length !== 1 ? 'es' : ''}`}
          </p>
          {initialType && (
            <button
              onClick={() => handleTypeChange('')}
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              Clear filter
            </button>
          )}
        </div>

        {/* Business Grid */}
        {businesses.length === 0 ? (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="w-20 h-20 rounded-full bg-gray-100 mx-auto mb-5 flex items-center justify-center">
              <Store className="w-9 h-9 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              No businesses found
            </h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              Try adjusting your search or filter. New businesses join
              NoxaLoyalty every day!
            </p>
          </motion.div>
        ) : (
          <>
            <motion.div
              key={`${initialSearch}-${initialType}`}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {businesses.map((biz) => (
                <motion.div key={biz.id} variants={cardVariants}>
                  <Link
                    href={`/business/${biz.slug}`}
                    className="block h-full"
                  >
                    <div className="h-full bg-white rounded-2xl border border-gray-200/80 p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.08)] hover:border-primary/20 transition-all duration-300 group">
                      {/* Top: Logo + Name + Badge */}
                      <div className="flex items-center gap-3.5 mb-3">
                        {biz.logo_url ? (
                          <div className="h-11 w-11 rounded-xl overflow-hidden ring-1 ring-gray-100 shrink-0">
                            <Image
                              src={biz.logo_url}
                              alt={biz.name}
                              width={44}
                              height={44}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8 shrink-0">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 text-[15px] truncate group-hover:text-primary transition-colors">
                            {biz.name}
                          </h3>
                          {biz.business_type && (
                            <span className="inline-block mt-0.5 text-[11px] font-medium text-primary/70 bg-primary/8 px-2 py-0.5 rounded-md">
                              {BUSINESS_TYPE_LABELS[biz.business_type!] || biz.business_type}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      {biz.description ? (
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">
                          {biz.description}
                        </p>
                      ) : (
                        <div className="mb-3" />
                      )}

                      {/* Bottom: Location + CTA */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        {biz.city || biz.address ? (
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate max-w-[140px]">
                              {biz.city || biz.address}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Gift className="w-3.5 h-3.5 shrink-0" />
                            <span>Loyalty rewards</span>
                          </div>
                        )}
                        <span className="text-xs font-semibold text-primary flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          Visit store
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </section>
    </>
  );
}
