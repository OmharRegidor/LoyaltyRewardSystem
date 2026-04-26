import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Mail, Phone, Coins, Building2, ArrowRightLeft } from 'lucide-react';
import { requireAdmin } from '@/lib/server-auth';
import { createAdminServiceClient } from '@/lib/supabase-server';
import { AdminLayout } from '@/components/admin/admin-layout';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface Membership {
  business_id: string;
  business_name: string;
  points: number;
  followed_at: string | null;
}

interface RecentTransaction {
  id: string;
  business_id: string;
  business_name: string;
  type: string;
  points: number;
  created_at: string;
}

interface CustomerDetail {
  customer_id: string;
  email: string | null;
  phone: string | null;
  memberships: Membership[];
  recent_transactions: RecentTransaction[];
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function AdminCustomerDetailPage({ params }: PageProps) {
  const { email: adminEmail } = await requireAdmin();
  const { id } = await params;

  const service = createAdminServiceClient();
  const { data, error } = await service.rpc('admin_get_customer_detail', {
    p_customer_id: id,
  });

  if (error || !data || data.length === 0) {
    notFound();
  }

  const detail = data[0] as unknown as CustomerDetail;
  const memberships = (detail.memberships ?? []) as Membership[];
  const transactions = (detail.recent_transactions ?? []) as RecentTransaction[];

  const totalPoints = memberships.reduce((sum, m) => sum + (m.points ?? 0), 0);

  return (
    <AdminLayout adminEmail={adminEmail}>
      <div className="space-y-6">
        <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Users
        </Link>

        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 truncate">
                {detail.email ?? detail.phone ?? 'Customer'}
              </h1>
              <p className="text-gray-400 text-sm">Customer profile · read-only</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {detail.email && (
              <span className="flex items-center gap-1.5 text-gray-700">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                {detail.email}
              </span>
            )}
            {detail.phone && (
              <span className="flex items-center gap-1.5 text-gray-700">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                {detail.phone}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <p className="text-sm text-gray-500">Businesses</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{memberships.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
              <p className="text-sm text-gray-500">Total Points</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalPoints.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
              <p className="text-sm text-gray-500">Recent Txns</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <h2 className="px-6 py-4 border-b border-gray-200 text-lg font-semibold text-gray-900">Memberships</h2>
          {memberships.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-400 text-center">Not joined to any businesses.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Business</th>
                    <th className="text-right px-6 py-3 text-gray-500 font-medium">Points</th>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium hidden md:table-cell">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {memberships.map((m) => (
                    <tr key={m.business_id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <Link href={`/admin/businesses/${m.business_id}`} className="text-gray-900 hover:text-orange-600 transition-colors">
                          {m.business_name}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-right text-gray-700 font-medium">{(m.points ?? 0).toLocaleString()}</td>
                      <td className="px-6 py-3 text-gray-500 hidden md:table-cell">{m.followed_at ? new Date(m.followed_at).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <h2 className="px-6 py-4 border-b border-gray-200 text-lg font-semibold text-gray-900">
            Recent Transactions
          </h2>
          {transactions.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-400 text-center">No transactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Business</th>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Type</th>
                    <th className="text-right px-6 py-3 text-gray-500 font-medium">Points</th>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium hidden md:table-cell">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <Link href={`/admin/businesses/${t.business_id}`} className="text-gray-900 hover:text-orange-600 transition-colors">
                          {t.business_name ?? 'Unknown'}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-gray-700">{t.type}</td>
                      <td className={`px-6 py-3 text-right font-medium ${t.type === 'earn' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'earn' ? '+' : '-'}{t.points ?? 0}
                      </td>
                      <td className="px-6 py-3 text-gray-500 hidden md:table-cell">{formatDate(t.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
