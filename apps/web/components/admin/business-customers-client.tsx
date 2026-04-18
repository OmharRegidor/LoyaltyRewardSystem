'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, ChevronLeft, ChevronRight, X, Eye } from 'lucide-react';
import type { AdminBusinessCustomersResponse } from '@/app/api/admin/businesses/[id]/customers/route';

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function BusinessCustomersClient({ businessId }: { businessId: string }) {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminBusinessCustomersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (page > 1) params.set('page', String(page));
      const res = await fetch(`/api/admin/businesses/${businessId}/customers?${params.toString()}`);
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, [businessId, search, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <Link href={`/admin/businesses/${businessId}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Business
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-500 mt-1">
          {data ? `${data.totalCount} customer${data.totalCount === 1 ? '' : 's'}` : 'Loading…'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by email or phone…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
        </div>
        {search && (
          <button
            onClick={() => setSearchInput('')}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Email</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Phone</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Points</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium hidden sm:table-cell">Txns</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">Last Visit</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium hidden xl:table-cell">Joined</th>
                <th className="px-4 py-3 text-gray-500 font-medium w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && !data ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-5 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : data && data.customers.length > 0 ? (
                data.customers.map((c) => (
                  <tr key={c.customerId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-900 truncate max-w-[240px]">{c.email ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{c.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-gray-700 font-medium">{c.points.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-700 hidden sm:table-cell">{c.transactionCount}</td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{formatRelativeTime(c.lastTransactionAt)}</td>
                    <td className="px-4 py-3 text-gray-500 hidden xl:table-cell">{c.followedAt ? new Date(c.followedAt).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/customers/${c.customerId}`}
                        className="inline-flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" /> View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">{search ? 'No customers match your search' : 'No customers yet'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {data && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">Page {data.page} of {totalPages} · {data.totalCount} total</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={data.page <= 1} className="p-2 text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={data.page >= totalPages} className="p-2 text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
