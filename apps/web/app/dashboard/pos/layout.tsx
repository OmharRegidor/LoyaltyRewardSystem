import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkModuleAccess } from '@/lib/feature-gate';
import { DashboardLayout } from '@/components/dashboard/layout';
import { POSOnboarding } from '@/components/pos/POSOnboarding';
import { Lock, ShoppingCart, Package, BarChart3, ClipboardList, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return children;

  const { data: business } = await supabase
    .from('businesses')
    .select('id, business_type, pos_onboarded')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!business) return children;

  const { allowed } = await checkModuleAccess(business.id, 'pos');

  if (!allowed) {
    return (
      <DashboardLayout>
        <POSLockedOverlay />
      </DashboardLayout>
    );
  }

  // POS is allowed but not yet onboarded — show setup screen
  if (!business.pos_onboarded) {
    return (
      <DashboardLayout>
        <POSOnboarding currentBusinessType={business.business_type} />
      </DashboardLayout>
    );
  }

  return children;
}

function POSLockedOverlay() {
  return (
    <div className="relative min-h-[calc(100vh-10rem)] overflow-hidden rounded-2xl">
      {/* Blurred mock POS background — contained within content area */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
        <div className="p-6 space-y-6 blur-[6px] opacity-50">
          {/* Mock header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 w-48 bg-gray-200 rounded-lg" />
              <div className="h-4 w-64 bg-gray-100 rounded mt-2" />
            </div>
            <div className="flex gap-3">
              <div className="h-10 w-32 bg-primary/20 rounded-lg" />
              <div className="h-10 w-10 bg-gray-100 rounded-lg" />
            </div>
          </div>

          {/* Mock search bar */}
          <div className="h-11 w-full bg-gray-100 rounded-xl" />

          {/* Mock product grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
                <div className="aspect-square bg-gray-100 rounded-xl" />
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                <div className="flex justify-between items-center">
                  <div className="h-5 w-16 bg-gray-200 rounded" />
                  <div className="h-5 w-12 bg-green-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Centered upgrade card */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-10rem)] p-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 sm:p-10 max-w-lg w-full text-center">
          {/* Lock icon */}
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-primary" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            POS & Inventory System
          </h2>
          <p className="text-gray-500 mb-8">
            Upgrade to Enterprise to unlock powerful tools for managing your business operations.
          </p>

          {/* Feature list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-left">
            {[
              { icon: ShoppingCart, label: 'Point of Sale' },
              { icon: Package, label: 'Inventory Management' },
              { icon: BarChart3, label: 'Sales Analytics' },
              { icon: ClipboardList, label: 'Transaction History' },
            ].map((feature) => (
              <div
                key={feature.label}
                className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3"
              >
                <feature.icon className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm font-medium text-gray-700">
                  {feature.label}
                </span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Link
            href="/dashboard/settings?section=billing"
            className="inline-flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3.5 px-6 rounded-xl transition-colors text-base"
          >
            View Upgrade Options
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
