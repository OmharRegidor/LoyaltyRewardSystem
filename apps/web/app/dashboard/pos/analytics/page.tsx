'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubscription } from '@/hooks/useSubscription';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Receipt,
  BarChart3,
} from 'lucide-react';
import { POSNavTabs } from '@/components/pos';
import { cachedFetch } from '@/lib/client-cache';
import type { SalesAnalytics } from '@/types/pos.types';

function formatPrice(centavos: number): string {
  return `₱${(centavos / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

type DateRange = '7d' | '30d';

const kpiConfig = [
  {
    key: 'revenue',
    label: 'Total Revenue',
    icon: TrendingUp,
    gradientFrom: 'from-emerald-100',
    gradientTo: 'to-emerald-50',
    iconColor: 'text-emerald-600',
    getValue: (a: SalesAnalytics) => formatPrice(a.totals.revenue_centavos),
  },
  {
    key: 'transactions',
    label: 'Transactions',
    icon: Receipt,
    gradientFrom: 'from-primary/15',
    gradientTo: 'to-primary/5',
    iconColor: 'text-primary',
    getValue: (a: SalesAnalytics) => a.totals.transactions.toLocaleString(),
  },
  {
    key: 'aov',
    label: 'Avg Order Value',
    icon: ShoppingCart,
    gradientFrom: 'from-blue-100',
    gradientTo: 'to-blue-50',
    iconColor: 'text-blue-600',
    getValue: (a: SalesAnalytics) => formatPrice(a.totals.avg_order_value_centavos),
  },
  {
    key: 'items',
    label: 'Items Sold',
    icon: Package,
    gradientFrom: 'from-amber-100',
    gradientTo: 'to-amber-50',
    iconColor: 'text-amber-600',
    getValue: (a: SalesAnalytics) => a.totals.items_sold.toLocaleString(),
  },
] as const;

export default function POSAnalyticsPage() {
  const { subscription, isLoading: isLoadingSubscription } = useSubscription();
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('7d');

  const hasPOS = subscription?.plan?.hasPOS ?? false;

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!hasPOS) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (dateRange === '7d' ? 6 : 29));

        const url = `/api/dashboard/pos/analytics?start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate}`;
        const data = await cachedFetch<{ analytics: SalesAnalytics }>(url);
        setAnalytics(data.analytics);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [hasPOS, dateRange]);

  if (isLoadingSubscription) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-56" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24 rounded-full" />
              <Skeleton className="h-9 w-28 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[380px] w-full rounded-xl" />
            <Skeleton className="h-[380px] w-full rounded-xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Prepare chart data
  const chartData = analytics?.daily_revenue.map((d) => ({
    date: formatDate(d.date),
    revenue: d.revenue_centavos / 100,
    transactions: d.transactions,
  })) || [];

  return (
    <DashboardLayout>
      <div className="space-y-5 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Sales Analytics
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Track your POS performance and revenue trends
            </p>
          </div>

          {/* Date Range Pills */}
          <div className="flex items-center gap-1 rounded-full bg-muted/60 p-1 border border-border/40">
            <button
              onClick={() => setDateRange('7d')}
              className={`
                px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer
                ${dateRange === '7d'
                  ? 'bg-white text-foreground shadow-card'
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDateRange('30d')}
              className={`
                px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer
                ${dateRange === '30d'
                  ? 'bg-white text-foreground shadow-card'
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              Last 30 Days
            </button>
          </div>
        </div>

        {/* Sub-Navigation */}
        <POSNavTabs />

        {isLoading ? (
          <div className="space-y-6 sm:space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 sm:h-28 w-full rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Skeleton className="h-[300px] sm:h-[380px] w-full rounded-xl" />
              <Skeleton className="h-[300px] sm:h-[380px] w-full rounded-xl" />
            </div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {kpiConfig.map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <Card
                    key={kpi.key}
                    className="shadow-card border border-border/50 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <CardContent className="p-3 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                        <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${kpi.gradientFrom} ${kpi.gradientTo} flex items-center justify-center shrink-0`}>
                          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${kpi.iconColor}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm text-muted-foreground leading-none">
                            {kpi.label}
                          </p>
                          <p className="font-display text-lg sm:text-2xl font-bold mt-1 sm:mt-1.5 tabular-nums tracking-tight truncate">
                            {analytics ? kpi.getValue(analytics) : '--'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Revenue Trend */}
              <Card className="shadow-card border border-border/50">
                <CardHeader className="pb-4 border-b border-border/40">
                  <CardTitle className="text-sm sm:text-base font-semibold text-foreground">
                    Revenue Trend
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                  {chartData.length === 0 ? (
                    <div className="h-[300px] flex flex-col items-center justify-center rounded-xl bg-gradient-to-b from-muted/30 to-transparent">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-muted to-background flex items-center justify-center mb-4 shadow-xs">
                        <BarChart3 className="h-7 w-7 text-muted-foreground/60" />
                      </div>
                      <p className="font-medium text-foreground/70">No sales data yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Complete your first sale to see revenue trends
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.005 80)" vertical={false} />
                        <XAxis
                          dataKey="date"
                          stroke="oklch(0.45 0.015 30)"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="oklch(0.45 0.015 30)"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value: number) => `₱${value.toLocaleString()}`}
                        />
                        <Tooltip
                          formatter={(value) => [`₱${Number(value).toFixed(2)}`, 'Revenue']}
                          labelStyle={{ color: '#374151', fontWeight: 500 }}
                          contentStyle={{
                            borderRadius: '10px',
                            border: '1px solid oklch(0.91 0.005 80)',
                            boxShadow: '0 4px 12px oklch(0 0 0 / 0.06)',
                            padding: '8px 12px',
                          }}
                        />
                        <Bar
                          dataKey="revenue"
                          fill="oklch(0.35 0.16 25)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={48}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card className="shadow-card border border-border/50">
                <CardHeader className="pb-4 border-b border-border/40">
                  <CardTitle className="text-sm sm:text-base font-semibold text-foreground">
                    Top Products
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
                  {(analytics?.top_products.length ?? 0) === 0 ? (
                    <div className="h-[300px] flex flex-col items-center justify-center rounded-xl bg-gradient-to-b from-muted/30 to-transparent">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-muted to-background flex items-center justify-center mb-4 shadow-xs">
                        <Package className="h-7 w-7 text-muted-foreground/60" />
                      </div>
                      <p className="font-medium text-foreground/70">No product data yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Sell products to see your top performers
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {analytics?.top_products.slice(0, 5).map((product, index) => (
                        <div
                          key={product.product_id || product.name}
                          className={`
                            flex items-center justify-between py-3.5 px-1
                            ${index < (analytics?.top_products.length ?? 0) - 1 && index < 4
                              ? 'border-b border-border/30'
                              : ''
                            }
                          `}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <span
                              className={`
                                w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0
                                ${index === 0
                                  ? 'bg-gradient-to-br from-amber-100 to-amber-50 text-amber-700'
                                  : index === 1
                                    ? 'bg-gradient-to-br from-muted to-muted/50 text-muted-foreground'
                                    : index === 2
                                      ? 'bg-gradient-to-br from-orange-100 to-orange-50 text-orange-700'
                                      : 'bg-muted/60 text-muted-foreground'
                                }
                              `}
                            >
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-foreground truncate">
                                {product.name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {product.quantity} sold
                              </p>
                            </div>
                          </div>
                          <p className="font-semibold text-sm tabular-nums text-foreground shrink-0 ml-3">
                            {formatPrice(product.revenue_centavos)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
