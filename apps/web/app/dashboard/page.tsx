// apps/web/app/dashboard/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/layout';
import {
  Users,
  TrendingUp,
  Gift,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Star,
  ChevronRight,
  BarChart3,
  Settings,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';

// ============================================
// CONFIGURATION: Toggle for Mock Data
// Set USE_MOCK_DATA = false when going live
// ============================================
const USE_MOCK_DATA = true;

// Mock data for development
const MOCK_STATS = {
  totalCustomers: 2847,
  customersGrowth: 12,
  pointsIssuedToday: 18540,
  pointsGrowth: 8,
  activeRewards: 24,
  rewardsGrowth: 3,
  revenueThisMonth: 485200,
  revenueGrowth: -2,
};

const MOCK_RECENT_TRANSACTIONS = [
  {
    id: '1',
    customer: 'Maria Santos',
    action: 'Points Earned',
    points: 250,
    time: '2 hours ago',
    type: 'earn',
  },
  {
    id: '2',
    customer: 'Juan Dela Cruz',
    action: 'Reward Redeemed',
    points: -500,
    time: '4 hours ago',
    type: 'redeem',
  },
  {
    id: '3',
    customer: 'Ana Garcia',
    action: 'Bonus Points Awarded',
    points: 100,
    time: '6 hours ago',
    type: 'bonus',
  },
  {
    id: '4',
    customer: 'Carlos Rodriguez',
    action: 'Points Earned',
    points: 175,
    time: '1 day ago',
    type: 'earn',
  },
  {
    id: '5',
    customer: 'Rosa Mendes',
    action: 'Reward Redeemed',
    points: -250,
    time: '2 days ago',
    type: 'redeem',
  },
];

const MOCK_TOP_REWARDS = [
  { name: 'Free Coffee', redemptions: 245, percentage: 35 },
  { name: 'Free Pastry', redemptions: 189, percentage: 27 },
  { name: '20% Discount', redemptions: 156, percentage: 22 },
  { name: 'Free Lunch', redemptions: 87, percentage: 12 },
];

interface StatCardProps {
  title: string;
  value: string;
  growth: number;
  icon: React.ReactNode;
  iconBg: string;
  subtitle: string;
}

function StatCard({
  title,
  value,
  growth,
  icon,
  iconBg,
  subtitle,
}: StatCardProps) {
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
          className={`flex items-center gap-1 text-sm font-semibold ${
            isPositive ? 'text-green-600' : 'text-red-500'
          }`}
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

export default function DashboardPage() {
  const [stats, setStats] = useState(MOCK_STATS);
  const [transactions, setTransactions] = useState(MOCK_RECENT_TRANSACTIONS);
  const [topRewards, setTopRewards] = useState(MOCK_TOP_REWARDS);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const router = useRouter();

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
        })
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
          .select('name')
          .eq('owner_id', user.id)
          .maybeSingle();

        setUserName(
          business?.name || metadata.business_name || 'Your Business'
        );
      }

      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setStats(MOCK_STATS);
        setTransactions(MOCK_RECENT_TRANSACTIONS);
        setTopRewards(MOCK_TOP_REWARDS);
      } else {
        // TODO: Fetch real data from Supabase when going live
        // const { data: customerCount } = await supabase
        //   .from('customer_businesses')
        //   .select('*', { count: 'exact' })
        //   .eq('business_id', businessId);
      }

      setIsLoading(false);
    };

    loadData();
  }, []);

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

  if (isLoading) {
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
            subtitle="Increase from last month"
          />
          <StatCard
            title="Points Issued Today"
            value={stats.pointsIssuedToday.toLocaleString()}
            growth={stats.pointsGrowth}
            icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
            iconBg="bg-emerald-50 dark:bg-emerald-900/30"
            subtitle="Increase from last month"
          />
          <StatCard
            title="Active Rewards"
            value={stats.activeRewards.toString()}
            growth={stats.rewardsGrowth}
            icon={<Gift className="w-6 h-6 text-cyan-600" />}
            iconBg="bg-cyan-50 dark:bg-cyan-900/30"
            subtitle="Increase from last month"
          />
          <StatCard
            title="Revenue This Month"
            value={`₱${stats.revenueThisMonth.toLocaleString()}`}
            growth={stats.revenueGrowth}
            icon={<DollarSign className="w-6 h-6 text-amber-600" />}
            iconBg="bg-amber-50 dark:bg-amber-900/30"
            subtitle="Decrease from last month"
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Transactions - Takes 2 columns */}
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
              {transactions.map((tx) => (
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
              ))}
            </div>
          </div>

          {/* Top Rewards - Takes 1 column */}
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
              {topRewards.map((reward, index) => (
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
