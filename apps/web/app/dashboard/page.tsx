// apps/web/app/dashboard/page.tsx

'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  Gift,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { getCurrentUser, getCurrentBusiness } from '@/lib/auth';

// ============================================
// CONFIGURATION: Toggle for Mock Data
// Set USE_MOCK_DATA = false when going live
// ============================================
const USE_MOCK_DATA = true;

// Mock data for development/testing
const MOCK_STATS = {
  totalCustomers: 1247,
  customersGrowth: 12.5,
  activeRewards: 8,
  rewardsGrowth: 3,
  pointsIssued: 45230,
  pointsGrowth: 18.2,
  redemptions: 324,
  redemptionsGrowth: -5.4,
};

const MOCK_RECENT_ACTIVITY = [
  {
    id: '1',
    type: 'points',
    customer: 'Maria Santos',
    amount: 50,
    time: '2 minutes ago',
  },
  {
    id: '2',
    type: 'redemption',
    customer: 'Juan Dela Cruz',
    reward: 'Free Coffee',
    time: '15 minutes ago',
  },
  {
    id: '3',
    type: 'signup',
    customer: 'Anna Reyes',
    time: '1 hour ago',
  },
  {
    id: '4',
    type: 'points',
    customer: 'Pedro Garcia',
    amount: 120,
    time: '2 hours ago',
  },
  {
    id: '5',
    type: 'redemption',
    customer: 'Lisa Mendoza',
    reward: '20% Discount',
    time: '3 hours ago',
  },
];

const MOCK_TOP_CUSTOMERS = [
  { id: '1', name: 'Maria Santos', points: 2450, visits: 34 },
  { id: '2', name: 'Juan Dela Cruz', points: 1820, visits: 28 },
  { id: '3', name: 'Anna Reyes', points: 1560, visits: 22 },
  { id: '4', name: 'Pedro Garcia', points: 1340, visits: 19 },
  { id: '5', name: 'Lisa Mendoza', points: 1120, visits: 16 },
];

interface Stats {
  totalCustomers: number;
  customersGrowth: number;
  activeRewards: number;
  rewardsGrowth: number;
  pointsIssued: number;
  pointsGrowth: number;
  redemptions: number;
  redemptionsGrowth: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>(MOCK_STATS);
  const [recentActivity, setRecentActivity] = useState(MOCK_RECENT_ACTIVITY);
  const [topCustomers, setTopCustomers] = useState(MOCK_TOP_CUSTOMERS);
  const [isLoading, setIsLoading] = useState(true);
  const [businessName, setBusinessName] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (USE_MOCK_DATA) {
        // Using mock data - simulate loading delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        setStats(MOCK_STATS);
        setRecentActivity(MOCK_RECENT_ACTIVITY);
        setTopCustomers(MOCK_TOP_CUSTOMERS);
        setBusinessName('Coffee Corner'); // Mock business name
      } else {
        // TODO: Fetch real data from Supabase when going live
        // const { user } = await getCurrentUser();
        // const business = await getCurrentBusiness();
        // setBusinessName(business?.name || 'My Business');
        //
        // Fetch stats:
        // const customerCount = await supabase.from('customer_businesses')...
        // const rewardsCount = await supabase.from('rewards')...
        // etc.
      }

      setIsLoading(false);
    };

    loadData();
  }, []);

  const statCards = [
    {
      title: 'Total Customers',
      value: stats.totalCustomers.toLocaleString(),
      growth: stats.customersGrowth,
      icon: Users,
      color: 'blue',
    },
    {
      title: 'Active Rewards',
      value: stats.activeRewards.toString(),
      growth: stats.rewardsGrowth,
      icon: Gift,
      color: 'purple',
    },
    {
      title: 'Points Issued',
      value: stats.pointsIssued.toLocaleString(),
      growth: stats.pointsGrowth,
      icon: TrendingUp,
      color: 'green',
    },
    {
      title: 'Redemptions',
      value: stats.redemptions.toString(),
      growth: stats.redemptionsGrowth,
      icon: DollarSign,
      color: 'orange',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-4" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's what's happening with your loyalty program today.
          </p>
        </div>
        {USE_MOCK_DATA && (
          <div className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-xs font-medium">
            Demo Mode
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  stat.color === 'blue'
                    ? 'bg-blue-100 dark:bg-blue-900/30'
                    : stat.color === 'purple'
                    ? 'bg-purple-100 dark:bg-purple-900/30'
                    : stat.color === 'green'
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-orange-100 dark:bg-orange-900/30'
                }`}
              >
                <stat.icon
                  className={`w-6 h-6 ${
                    stat.color === 'blue'
                      ? 'text-blue-600'
                      : stat.color === 'purple'
                      ? 'text-purple-600'
                      : stat.color === 'green'
                      ? 'text-green-600'
                      : 'text-orange-600'
                  }`}
                />
              </div>
              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  stat.growth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {stat.growth >= 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {Math.abs(stat.growth)}%
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {stat.title}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === 'points'
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : activity.type === 'redemption'
                      ? 'bg-purple-100 dark:bg-purple-900/30'
                      : 'bg-blue-100 dark:bg-blue-900/30'
                  }`}
                >
                  {activity.type === 'points' && (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  )}
                  {activity.type === 'redemption' && (
                    <Gift className="w-5 h-5 text-purple-600" />
                  )}
                  {activity.type === 'signup' && (
                    <Users className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {activity.customer}
                  </p>
                  <p className="text-xs text-gray-500">
                    {activity.type === 'points' &&
                      `Earned ${activity.amount} points`}
                    {activity.type === 'redemption' &&
                      `Redeemed: ${activity.reward}`}
                    {activity.type === 'signup' && 'New customer signup'}
                  </p>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Customers
          </h2>
          <div className="space-y-4">
            {topCustomers.map((customer, index) => (
              <div
                key={customer.id}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-semibold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {customer.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {customer.visits} visits
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {customer.points.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">points</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
