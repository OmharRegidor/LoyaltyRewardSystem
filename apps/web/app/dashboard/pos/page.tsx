'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Loader2, Receipt, Banknote, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubscription } from '@/hooks/useSubscription';
import { DashboardLayout } from '@/components/dashboard/layout';
import { POSInterface, POSNavTabs } from '@/components/pos';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase';
import type { DailySummary } from '@/types/pos.types';

interface BusinessSettings {
  pesos_per_point: number | null;
  min_purchase_for_points: number | null;
  max_points_per_transaction: number | null;
}

function formatPrice(centavos: number): string {
  return `₱${(centavos / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

export default function POSPage() {
  const router = useRouter();
  const { subscription, isLoading: isLoadingSubscription } = useSubscription();
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [todaySummary, setTodaySummary] = useState<DailySummary | null>(null);

  const hasPOS = subscription?.plan?.hasPOS ?? false;

  // Load today's summary
  const loadSummary = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/pos/summary');
      const data = await response.json();
      if (response.ok) {
        setTodaySummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to load summary:', err);
    }
  }, []);

  useEffect(() => {
    if (hasPOS) {
      loadSummary();
    }
  }, [hasPOS, loadSummary]);

  // Load business settings for points calculation
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        const { data: business } = await supabase
          .from('businesses')
          .select('pesos_per_point, min_purchase_for_points, max_points_per_transaction')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (business) {
          setBusinessSettings(business);
        }
      } catch (err) {
        console.error('Failed to load business settings:', err);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    loadSettings();
  }, []);

  if (isLoadingSubscription || isLoadingSettings) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-3 space-y-4">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
            <div className="md:col-span-2">
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
          </div>
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
                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">POS Not Available</h2>
              <p className="text-muted-foreground mb-6">
                Point of Sale is available on the Enterprise plan. Upgrade to access
                POS features and streamline your sales.
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

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-3 md:h-[calc(100dvh-6rem)] lg:h-[calc(100dvh-4rem)]">
        <div className="shrink-0 space-y-3">
          {/* Header */}
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
              Point of Sale
            </h1>
          </div>

        {/* Sub-Navigation */}
        <POSNavTabs />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="py-2">
            <CardContent className="pt-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Today&apos;s Transactions</p>
                  <p className="text-2xl font-bold">{todaySummary?.total_sales ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="py-2">
            <CardContent className="pt-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Banknote className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Today&apos;s Revenue</p>
                  <p className="text-2xl font-bold">
                    {formatPrice(todaySummary?.total_revenue_centavos ?? 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="py-2">
            <CardContent className="pt-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Items Sold</p>
                  <p className="text-2xl font-bold">{todaySummary?.total_items_sold ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>

        <div className="flex-1 min-h-0">
          <POSInterface
            businessSettings={businessSettings || undefined}
            onSaleComplete={loadSummary}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
