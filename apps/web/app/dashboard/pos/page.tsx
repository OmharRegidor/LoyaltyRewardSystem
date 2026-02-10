'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Loader2, Receipt, Banknote, Package } from 'lucide-react';
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
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Point of Sale
          </h1>
          <p className="text-gray-500 mt-1">
            Process sales and manage transactions
          </p>
        </div>

        {/* Sub-Navigation */}
        <POSNavTabs />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
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
          <Card>
            <CardContent className="pt-6">
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
          <Card>
            <CardContent className="pt-6">
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

        <POSInterface
          businessSettings={businessSettings || undefined}
          onSaleComplete={loadSummary}
        />
      </div>
    </DashboardLayout>
  );
}
