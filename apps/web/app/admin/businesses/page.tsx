'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/admin-layout';
import { BusinessListTable } from '@/components/admin/business-list-table';
import { RefreshCw } from 'lucide-react';
import type { AdminBusinessListResponse } from '@/lib/admin';

interface BusinessFilters {
  search: string;
  plan: string;
  type: string;
  status: string;
  sort: string;
  order: string;
  page: number;
}

const DEFAULT_FILTERS: BusinessFilters = {
  search: '',
  plan: '',
  type: '',
  status: '',
  sort: 'created_at',
  order: 'desc',
  page: 1,
};

export default function AdminBusinessesPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AdminBusinessesContent />
    </Suspense>
  );
}

function AdminBusinessesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<BusinessFilters>(() => ({
    search: searchParams.get('search') || DEFAULT_FILTERS.search,
    plan: searchParams.get('plan') || DEFAULT_FILTERS.plan,
    type: searchParams.get('type') || DEFAULT_FILTERS.type,
    status: searchParams.get('status') || DEFAULT_FILTERS.status,
    sort: searchParams.get('sort') || DEFAULT_FILTERS.sort,
    order: searchParams.get('order') || DEFAULT_FILTERS.order,
    page: parseInt(searchParams.get('page') || '1', 10),
  }));

  const [searchInput, setSearchInput] = useState(filters.search);
  const [data, setData] = useState<AdminBusinessListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters((prev) => {
        if (prev.search === searchInput) return prev;
        return { ...prev, search: searchInput, page: 1 };
      });
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.plan) params.set('plan', filters.plan);
    if (filters.type) params.set('type', filters.type);
    if (filters.status) params.set('status', filters.status);
    if (filters.sort !== DEFAULT_FILTERS.sort) params.set('sort', filters.sort);
    if (filters.order !== DEFAULT_FILTERS.order) params.set('order', filters.order);
    if (filters.page > 1) params.set('page', String(filters.page));
    const qs = params.toString();
    router.replace(qs ? `/admin/businesses?${qs}` : '/admin/businesses', { scroll: false });
  }, [filters, router]);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.plan) params.set('plan', filters.plan);
      if (filters.type) params.set('type', filters.type);
      if (filters.status) params.set('status', filters.status);
      params.set('sort', filters.sort);
      params.set('order', filters.order);
      params.set('page', String(filters.page));
      const res = await fetch(`/api/admin/businesses?${params.toString()}`);
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); setRefreshing(false); }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFilterChange = useCallback((key: keyof BusinessFilters, value: string | number) => {
    setFilters((prev) => {
      if (key === 'search') { setSearchInput(value as string); return prev; }
      const updated = { ...prev, [key]: value };
      if (key !== 'page') updated.page = 1;
      return updated;
    });
  }, []);

  const handleToggleSelect = useCallback((id: string) => {
    setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    if (!data) return;
    const allIds = data.businesses.map((b) => b.id);
    const allSelected = allIds.every((id) => selected.has(id));
    if (allSelected) setSelected((prev) => { const next = new Set(prev); allIds.forEach((id) => next.delete(id)); return next; });
    else setSelected((prev) => { const next = new Set(prev); allIds.forEach((id) => next.add(id)); return next; });
  }, [data, selected]);

  const handleClearSelected = useCallback(() => { setSelected(new Set()); }, []);

  if (loading) return <LoadingSkeleton />;

  if (!data) {
    return (
      <AdminLayout adminEmail="">
        <div className="text-center py-20 text-gray-400">Failed to load businesses.</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout adminEmail={data.adminEmail}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Businesses</h1>
            <p className="text-gray-500 mt-1">{data.totalCount} registered businesses</p>
          </div>
          <button onClick={() => fetchData(true)} disabled={refreshing} className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl border border-gray-200 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
        <BusinessListTable data={data} filters={filters} searchInput={searchInput} selected={selected} onSearchInput={setSearchInput} onFilterChange={handleFilterChange} onToggleSelect={handleToggleSelect} onToggleSelectAll={handleToggleSelectAll} onClearSelected={handleClearSelected} />
      </div>
    </AdminLayout>
  );
}

function LoadingSkeleton() {
  return (
    <AdminLayout adminEmail="">
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mt-2" />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="h-10 flex-1 min-w-[200px] bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse" />
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="space-y-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 last:border-0">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-12 bg-gray-200 rounded animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
