'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Loader2,
  TrendingUp,
  ShoppingCart,
  Package,
  Receipt,
  BarChart3,
} from 'lucide-react';
import { POSNavTabs } from '@/components/pos';
import type { SalesAnalytics } from '@/types/pos.types';

function formatPrice(centavos: number): string {
  return `₱${(centavos / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

type DateRange = '7d' | '30d';

export default function POSAnalyticsPage() {
  const router = useRouter();
  const { subscription, isLoading: isLoadingSubscription } = useSubscription();
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('7d');

  const hasPOS = subscription?.plan?.hasPOS ?? false;

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!hasPOS) return;

      setIsLoading(true);
      try {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (dateRange === '7d' ? 6 : 29));

        const response = await fetch(
          `/api/dashboard/pos/analytics?start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate}`
        );
        const data = await response.json();

        if (response.ok) {
          setAnalytics(data.analytics);
        }
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
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!hasPOS) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
          <Card className="max-w-md">
            <CardContent className="flex flex-col items-center text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">POS Not Available</h2>
              <p className="text-muted-foreground mb-6">
                Point of Sale is available on the Enterprise plan.
              </p>
              <Button onClick={() => router.push('/dashboard/settings')}>
                View Plans
              </Button>
            </CardContent>
          </Card>
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Analytics</h1>
            <p className="text-gray-500 mt-1">Track your POS performance</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={dateRange === '7d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('7d')}
            >
              Last 7 Days
            </Button>
            <Button
              variant={dateRange === '30d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('30d')}
            >
              Last 30 Days
            </Button>
          </div>
        </div>

        {/* Sub-Navigation */}
        <POSNavTabs />

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold">
                        {formatPrice(analytics?.totals.revenue_centavos ?? 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Transactions</p>
                      <p className="text-2xl font-bold">
                        {analytics?.totals.transactions ?? 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Order Value</p>
                      <p className="text-2xl font-bold">
                        {formatPrice(analytics?.totals.avg_order_value_centavos ?? 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <Package className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Items Sold</p>
                      <p className="text-2xl font-bold">
                        {analytics?.totals.items_sold ?? 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  {chartData.length === 0 ? (
                    <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mb-4" />
                      <p className="font-medium">No sales data yet</p>
                      <p className="text-sm">Complete sales to see trends</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                        <YAxis
                          stroke="#9ca3af"
                          fontSize={12}
                          tickFormatter={(value) => `₱${value}`}
                        />
                        <Tooltip
                          formatter={(value: number) => [`₱${value.toFixed(2)}`, 'Revenue']}
                          labelStyle={{ color: '#374151' }}
                        />
                        <Bar dataKey="revenue" fill="#D32F2F" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top Products</CardTitle>
                </CardHeader>
                <CardContent>
                  {(analytics?.top_products.length ?? 0) === 0 ? (
                    <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                      <Package className="h-12 w-12 mb-4" />
                      <p className="font-medium">No product data yet</p>
                      <p className="text-sm">Sell products to see rankings</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {analytics?.top_products.slice(0, 5).map((product, index) => (
                        <div
                          key={product.product_id || product.name}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {product.quantity} sold
                              </p>
                            </div>
                          </div>
                          <p className="font-bold">{formatPrice(product.revenue_centavos)}</p>
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
