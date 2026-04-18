// apps/web/app/admin/page.tsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/admin-layout';
import { PlanBadge, StatusBadge } from '@/components/admin/shared/badges';
import { formatCompactNumber as formatNumber, formatRelativeTime } from '@/lib/format';
import {
  Building2,
  Users,
  ArrowRightLeft,
  CreditCard,
  Coins,
  Crown,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import type { AdminPlatformStats, AdminBusinessStats } from '@/lib/admin';

// ============================================
// TYPES
// ============================================

interface StatsResponse {
  stats: AdminPlatformStats;
  topBusinesses: AdminBusinessStats[];
  recentBusinesses: AdminBusinessStats[];
  adminEmail: string;
}

// ============================================
// PAGE COMPONENT
// ============================================

export default function AdminOverviewPage() {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const json: StatsResponse = await res.json();
        setData(json);
        setUpdatedAt(new Date().toISOString());
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) return <LoadingSkeleton />;

  if (!data) {
    return (
      <AdminLayout adminEmail="">
        <div className="text-center py-20 text-gray-400">Failed to load dashboard data.</div>
      </AdminLayout>
    );
  }

  const { stats, topBusinesses, recentBusinesses, adminEmail } = data;

  const statCards = [
    { label: 'Total Businesses', value: formatNumber(stats.total_businesses), sub: `+${stats.businesses_7d} this week`, icon: Building2, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Customers', value: formatNumber(stats.total_customers), sub: `+${stats.customers_30d} (30d)`, icon: Users, color: 'bg-green-50 text-green-600' },
    { label: 'Transactions (30d)', value: formatNumber(stats.transactions_30d), sub: `${formatNumber(stats.total_transactions)} total`, icon: ArrowRightLeft, color: 'bg-purple-50 text-purple-600' },
    { label: 'Points Issued (30d)', value: formatNumber(stats.points_issued_30d), sub: `${formatNumber(stats.total_points_issued)} total`, icon: Coins, color: 'bg-yellow-50 text-yellow-600' },
    { label: 'Active Subscriptions', value: formatNumber(stats.active_subscriptions), sub: `${stats.enterprise_count} enterprise`, icon: CreditCard, color: 'bg-orange-50 text-orange-600' },
    { label: 'Enterprise Plans', value: formatNumber(stats.enterprise_count), sub: `${stats.free_count} free`, icon: Crown, color: 'bg-amber-50 text-amber-600' },
    { label: 'New Businesses (30d)', value: formatNumber(stats.businesses_30d), sub: `${stats.businesses_7d} this week`, icon: TrendingUp, color: 'bg-cyan-50 text-cyan-600' },
  ];

  return (
    <AdminLayout adminEmail={adminEmail}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
            <p className="text-gray-500 mt-1">NoxaLoyalty admin dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            {updatedAt && (
              <span className="text-xs text-gray-400 hidden sm:inline">
                Updated {formatRelativeTime(updatedAt).toLowerCase()}
              </span>
            )}
            <button onClick={() => fetchStats(true)} disabled={refreshing} className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl border border-gray-200 transition-colors disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <div key={stat.label} className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Top Businesses */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Top Businesses (30d)</h2>
              <Link href="/admin/businesses" className="text-sm text-orange-500 hover:text-orange-600">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-left bg-gray-50/50">
                    <th className="px-6 py-3 font-medium">#</th>
                    <th className="px-6 py-3 font-medium">Business</th>
                    <th className="px-6 py-3 font-medium text-right">Customers</th>
                    <th className="px-6 py-3 font-medium text-right">Txns (30d)</th>
                    <th className="px-6 py-3 font-medium">Plan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topBusinesses.map((biz, i) => (
                    <tr key={biz.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-6 py-3">
                        <Link href={`/admin/businesses/${biz.id}`} className="text-gray-900 hover:text-orange-600 transition-colors">{biz.name}</Link>
                      </td>
                      <td className="px-6 py-3 text-right text-gray-700">{biz.customer_count}</td>
                      <td className="px-6 py-3 text-right text-gray-700">{biz.transactions_30d}</td>
                      <td className="px-6 py-3"><PlanBadge plan={biz.plan_name} /></td>
                    </tr>
                  ))}
                  {topBusinesses.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No businesses yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Signups */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Signups</h2>
              <Link href="/admin/businesses" className="text-sm text-orange-500 hover:text-orange-600">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-left bg-gray-50/50">
                    <th className="px-6 py-3 font-medium">Business</th>
                    <th className="px-6 py-3 font-medium">Email</th>
                    <th className="px-6 py-3 font-medium">Signed Up</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentBusinesses.map((biz) => (
                    <tr key={biz.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3"><Link href={`/admin/businesses/${biz.id}`} className="text-gray-900 hover:text-orange-600 transition-colors">{biz.name}</Link></td>
                      <td className="px-6 py-3 text-gray-500 truncate max-w-[180px]">{biz.owner_email ?? 'N/A'}</td>
                      <td className="px-6 py-3 text-gray-500">{formatRelativeTime(biz.created_at)}</td>
                      <td className="px-6 py-3"><StatusBadge status={biz.subscription_status} /></td>
                    </tr>
                  ))}
                  {recentBusinesses.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">No businesses yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function LoadingSkeleton() {
  return (
    <AdminLayout adminEmail="">
      <div className="space-y-8">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mt-2" />
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mt-2" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl h-64 animate-pulse" />
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

