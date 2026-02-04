// apps/web/app/dashboard/page.tsx

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/layout';
import { useSubscriptionGate } from '@/hooks/useSubscriptionGate';
import {
  Users,
  TrendingUp,
  Gift,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  ChevronRight,
  X,
  Calendar,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';

// ============================================
// TYPES
// ============================================

interface Stats {
  totalCustomers: number;
  customersGrowth: number;
  pointsIssuedToday: number;
  pointsGrowth: number;
  activeRewards: number;
  rewardsGrowth: number;
  revenueThisMonth: number;
  revenueGrowth: number;
}

interface Transaction {
  id: string;
  customer: string;
  action: string;
  points: number;
  time: string;
  type: string;
}

interface TopReward {
  name: string;
  redemptions: number;
  percentage: number;
}

interface StatCardProps {
  title: string;
  value: string;
  growth: number;
  icon: React.ReactNode;
  iconBg: string;
}

// ============================================
// STAT CARD COMPONENT
// ============================================

function StatCard({ title, value, growth, icon, iconBg }: StatCardProps) {
  const isPositive = growth >= 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}
        >
          {icon}
        </div>
        <div
          className={`flex items-center gap-1 text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-500'}`}
        >
          {isPositive ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownRight className="w-4 h-4" />
          )}
          {Math.abs(growth)}%
        </div>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
        {value}
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500">
        {isPositive ? 'Increase' : 'Decrease'} from last month
      </p>
    </div>
  );
}

// ============================================
// WELCOME MODAL COMPONENT
// ============================================

function WelcomeModalContent({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to NoxaLoyalty!
          </h2>
          <p className="text-green-600 dark:text-green-400 font-semibold mb-2">
            Your Free plan is now active.
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You have access to our full loyalty and rewards system.
          </p>

          {/* Upsell */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Want Booking System & POS?
              </p>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Upgrade to Enterprise anytime.
            </p>
            <Link
              href="/book-call"
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline inline-flex items-center gap-1"
            >
              Book a Call <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}

// Component that handles welcome param detection (uses useSearchParams)
function WelcomeModalHandler() {
  const searchParams = useSearchParams();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (searchParams.get('welcome') === 'true') {
      setShowWelcome(true);
      // Remove query param from URL without page reload
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams]);

  if (!showWelcome) return null;

  return <WelcomeModalContent onClose={() => setShowWelcome(false)} />;
}

// ============================================
// MAIN COMPONENT
// ============================================

// Default empty state values
const DEFAULT_STATS: Stats = {
  totalCustomers: 0,
  customersGrowth: 0,
  pointsIssuedToday: 0,
  pointsGrowth: 0,
  activeRewards: 0,
  rewardsGrowth: 0,
  revenueThisMonth: 0,
  revenueGrowth: 0,
};

export default function DashboardPage() {
  const { isLoading: isLoadingSubscription } = useSubscriptionGate();

  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [topRewards, setTopRewards] = useState<TopReward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      // Set current date
      const date = new Date();
      setCurrentDate(
        date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      );

      const supabase = createClient();

      // Get user info
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const metadata = user.user_metadata || {};
        const { data: business } = await supabase
          .from('businesses')
          .select('id, name, subscription_status, is_free_forever')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (business) {
          setBusinessId(business.id);
          setUserName(
            business.name || metadata.business_name || 'Your Business',
          );

          // Load real-time data for all users
          await loadRealTimeData(supabase, business.id);
        }
      }

      setIsLoading(false);
    };

    loadData();
  }, []);

  // Set up real-time subscription for all users
  useEffect(() => {
    if (!businessId) return;

    const supabase = createClient();

    // Subscribe to real-time transaction updates
    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          // Reload data when new transaction comes in
          loadRealTimeData(supabase, businessId);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId]);

  const loadRealTimeData = async (
    supabase: ReturnType<typeof createClient>,
    businessId: string,
  ) => {
    try {
      // Get total customers
      const { count: customerCount } = await supabase
        .from('customer_businesses')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId);

      // Get active rewards count
      const { count: rewardsCount } = await supabase
        .from('rewards')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('is_active', true)
        .eq('is_visible', true);

      // Get today's points issued
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: todayTransactions } = await supabase
        .from('transactions')
        .select('points')
        .eq('business_id', businessId)
        .gte('created_at', today.toISOString())
        .eq('type', 'earn');

      const pointsToday =
        todayTransactions?.reduce((sum, t) => sum + (t.points || 0), 0) || 0;

      // Get recent transactions
      const { data: recentTx } = await supabase
        .from('transactions')
        .select(
          `
          id,
          type,
          points,
          created_at,
          customer:customers(full_name)
        `,
        )
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(5);

      // Get top redeemed rewards
      const { data: topRewardsData } = await supabase
        .from('redemptions')
        .select(
          `
          reward_id,
          rewards(title)
        `,
        )
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(100);

      // Process top rewards
      const rewardCounts: Record<string, { name: string; count: number }> = {};
      topRewardsData?.forEach(
        (r: { reward_id: string; rewards: { title: string } | null }) => {
          const name = r.rewards?.title || 'Unknown';
          if (!rewardCounts[r.reward_id]) {
            rewardCounts[r.reward_id] = { name, count: 0 };
          }
          rewardCounts[r.reward_id].count++;
        },
      );

      const sortedRewards = Object.values(rewardCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

      const totalRedemptions = sortedRewards.reduce(
        (sum, r) => sum + r.count,
        0,
      );

      // Update state with real data
      setStats({
        totalCustomers: customerCount || 0,
        customersGrowth: 0, // TODO: Calculate actual growth
        pointsIssuedToday: pointsToday,
        pointsGrowth: 0,
        activeRewards: rewardsCount || 0,
        rewardsGrowth: 0,
        revenueThisMonth: 0, // TODO: Implement revenue tracking
        revenueGrowth: 0,
      });

      // Transform transactions
      if (recentTx) {
        const transformedTx: Transaction[] = recentTx
          .filter((tx) => tx.created_at)
          .map((tx) => ({
            id: tx.id,
            customer: tx.customer?.full_name || 'Unknown',
            action:
              tx.type === 'earn'
                ? 'Points Earned'
                : tx.type === 'redeem'
                  ? 'Reward Redeemed'
                  : 'Transaction',
            points: tx.type === 'earn' ? tx.points || 0 : -(tx.points || 0),
            time: formatRelativeTime(tx.created_at!),
            type: tx.type,
          }));
        setTransactions(transformedTx);
      }

      // Transform top rewards
      const transformedRewards: TopReward[] = sortedRewards.map((r) => ({
        name: r.name,
        redemptions: r.count,
        percentage:
          totalRedemptions > 0
            ? Math.round((r.count / totalRedemptions) * 100)
            : 0,
      }));
      setTopRewards(transformedRewards);
    } catch (error) {
      console.error('Error loading real-time data:', error);
    }
  };

  const getActionBadge = (type: string, action: string) => {
    switch (type) {
      case 'earn':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            {action}
          </span>
        );
      case 'redeem':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
            {action}
          </span>
        );
      case 'bonus':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
            {action}
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            {action}
          </span>
        );
    }
  };

  if (isLoading || isLoadingSubscription) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 h-40"
              />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Welcome Modal for new signups (wrapped in Suspense for useSearchParams) */}
      <Suspense fallback={null}>
        <WelcomeModalHandler />
      </Suspense>

      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Welcome back to {userName}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Today's Date
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentDate}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers.toLocaleString()}
            growth={stats.customersGrowth}
            icon={<Users className="w-6 h-6 text-blue-600" />}
            iconBg="bg-blue-50 dark:bg-blue-900/30"
          />
          <StatCard
            title="Points Issued Today"
            value={stats.pointsIssuedToday.toLocaleString()}
            growth={stats.pointsGrowth}
            icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
            iconBg="bg-emerald-50 dark:bg-emerald-900/30"
          />
          <StatCard
            title="Active Rewards"
            value={stats.activeRewards.toString()}
            growth={stats.rewardsGrowth}
            icon={<Gift className="w-6 h-6 text-cyan-600" />}
            iconBg="bg-cyan-50 dark:bg-cyan-900/30"
          />
          <StatCard
            title="Revenue This Month"
            value={`₱${stats.revenueThisMonth.toLocaleString()}`}
            growth={stats.revenueGrowth}
            icon={<DollarSign className="w-6 h-6 text-amber-600" />}
            iconBg="bg-amber-50 dark:bg-amber-900/30"
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Transactions */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Transactions
              </h2>
              <button className="text-sm text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <div className="col-span-4">Customer</div>
              <div className="col-span-3">Action</div>
              <div className="col-span-2 text-right">Points</div>
              <div className="col-span-3 text-right">Time</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {transactions.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <TrendingUp className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    No transactions yet
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Start by adding customers and issuing points.
                  </p>
                </div>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                        {tx.customer
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {tx.customer}
                      </span>
                    </div>
                    <div className="col-span-3">
                      {getActionBadge(tx.type, tx.action)}
                    </div>
                    <div
                      className={`col-span-2 text-right font-semibold ${
                        tx.points >= 0
                          ? 'text-green-600'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {tx.points >= 0 ? '+' : ''}
                      {tx.points.toLocaleString()}
                    </div>
                    <div className="col-span-3 text-right text-sm text-gray-500 dark:text-gray-400">
                      {tx.time}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Rewards */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Top Rewards Redeemed
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                This month
              </p>
            </div>
            <div className="p-6 space-y-5">
              {topRewards.length === 0 ? (
                <div className="py-8 text-center">
                  <Gift className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    No rewards redeemed yet
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Create rewards to get started.
                  </p>
                </div>
              ) : (
                topRewards.map((reward, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            index === 0
                              ? 'bg-amber-100 text-amber-600'
                              : index === 1
                                ? 'bg-gray-100 text-gray-600'
                                : index === 2
                                  ? 'bg-orange-100 text-orange-600'
                                  : 'bg-cyan-100 text-cyan-600'
                          }`}
                        >
                          <Star className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {reward.name}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {reward.redemptions}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          index === 0
                            ? 'bg-linear-to-r from-cyan-500 to-blue-500'
                            : index === 1
                              ? 'bg-linear-to-r from-cyan-400 to-cyan-500'
                              : index === 2
                                ? 'bg-linear-to-r from-cyan-300 to-cyan-400'
                                : 'bg-cyan-200'
                        }`}
                        style={{ width: `${reward.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Helper function
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}
