import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkModuleAccess } from '@/lib/feature-gate';
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
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!business) return children;

  const { allowed } = await checkModuleAccess(business.id, 'pos');

  if (allowed) return children;

  return <POSLockedOverlay />;
}

function POSLockedOverlay() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] py-12 px-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 sm:p-10 max-w-lg w-full text-center">
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
  );
}
