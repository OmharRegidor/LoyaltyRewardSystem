// apps/web/app/dashboard/analytics/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card } from '@/components/ui/card';
import { useSubscriptionGate } from '@/hooks/useSubscriptionGate';
import { createClient } from '@/lib/supabase';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  Gift,
  Target,
  Download,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

// ============================================
// MOCK DATA (for preview mode)
// ============================================

const MOCK_MONTHLY_DATA = [
  { month: 'Jan', points: 12000 },
  { month: 'Feb', points: 14500 },
  { month: 'Mar', points: 13000 },
  { month: 'Apr', points: 16200 },
  { month: 'May', points: 15100 },
  { month: 'Jun', points: 18500 },
];

const MOCK_CUSTOMER_SEGMENTS = [
  { name: 'High Value', value: 35, color: '#6366f1' },
  { name: 'Regular', value: 45, color: '#06b6d4' },
  { name: 'At Risk', value: 15, color: '#f59e0b' },
  { name: 'Inactive', value: 5, color: '#ef4444' },
];

const MOCK_REWARD_PERFORMANCE = [
  { reward: 'Free Coffee', redemptions: 234 },
  { reward: 'Discount 20%', redemptions: 189 },
  { reward: 'Free Pastry', redemptions: 156 },
  { reward: 'Double Points', redemptions: 142 },
  { reward: 'Free Lunch', redemptions: 98 },
];

const MOCK_KPI = {
  totalPoints: 89300,
  avgPointsPerTx: 125,
  customerLTV: 5890,
  repeatRate: 68,
};

export default function AnalyticsPage() {
  const { isPreview, isLoading: isLoadingSubscription } = useSubscriptionGate();

  const [isLoading, setIsLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState(MOCK_MONTHLY_DATA);
  const [customerSegments, setCustomerSegments] = useState(
    MOCK_CUSTOMER_SEGMENTS,
  );
  const [rewardPerformance, setRewardPerformance] = useState(
    MOCK_REWARD_PERFORMANCE,
  );
  const [kpi, setKpi] = useState(MOCK_KPI);

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: business } = await supabase
          .from('businesses')
          .select('id, subscription_status, is_free_forever')
          .eq('owner_id', user.id)
          .single();

        if (!business) return;

        const hasActiveSubscription =
          business.is_free_forever ||
          ['active', 'trialing', 'free_forever'].includes(
            business.subscription_status,
          );

        if (hasActiveSubscription) {
          await loadRealTimeAnalytics(supabase, business.id);
        }
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const loadRealTimeAnalytics = async (
    supabase: ReturnType<typeof createClient>,
    businessId: string,
  ) => {
    // Get transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('points, created_at')
      .eq('business_id', businessId);

    if (transactions && transactions.length > 0) {
      // Group by month
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      const monthlyStats: Record<string, number> = {};

      transactions.forEach((tx) => {
        if (!tx.created_at) return;
        const month = months[new Date(tx.created_at).getMonth()];
        monthlyStats[month] = (monthlyStats[month] || 0) + (tx.points || 0);
      });

      const data = Object.entries(monthlyStats).map(([month, points]) => ({
        month,
        points,
      }));
      if (data.length > 0) setMonthlyData(data);

      // KPIs
      const totalPoints = transactions.reduce(
        (sum, tx) => sum + (tx.points || 0),
        0,
      );
      setKpi((prev) => ({
        ...prev,
        totalPoints,
        avgPointsPerTx: Math.round(totalPoints / transactions.length),
      }));
    }

    // Get customer segments - join through customer_businesses to get customers for this business
    const { data: customerLinks } = await supabase
      .from('customer_businesses')
      .select('customer_id')
      .eq('business_id', businessId);

    if (customerLinks && customerLinks.length > 0) {
      const customerIds = customerLinks.map((c) => c.customer_id);

      const { data: customers } = await supabase
        .from('customers')
        .select('total_points, last_visit')
        .in('id', customerIds);

      if (customers && customers.length > 0) {
        const now = new Date();
        const thirtyDaysAgo = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000,
        );

        let highValue = 0,
          regular = 0,
          atRisk = 0,
          inactive = 0;
        customers.forEach((c) => {
          const lastVisit = c.last_visit ? new Date(c.last_visit) : null;
          if (!lastVisit || lastVisit < thirtyDaysAgo) inactive++;
          else if ((c.total_points || 0) >= 500) highValue++;
          else regular++;
        });

        const total = customers.length;
        setCustomerSegments([
          {
            name: 'High Value',
            value: Math.round((highValue / total) * 100) || 0,
            color: '#6366f1',
          },
          {
            name: 'Regular',
            value: Math.round((regular / total) * 100) || 0,
            color: '#06b6d4',
          },
          {
            name: 'Inactive',
            value: Math.round((inactive / total) * 100) || 0,
            color: '#ef4444',
          },
        ]);

        setKpi((prev) => ({
          ...prev,
          repeatRate: Math.round(
            (customers.filter((c) => (c.total_points || 0) > 100).length /
              total) *
              100,
          ),
        }));
      }
    }

    // Get reward performance
    const { data: redemptions } = await supabase
      .from('redemptions')
      .select('reward_id, rewards(title)')
      .eq('business_id', businessId);

    if (redemptions && redemptions.length > 0) {
      const counts: Record<string, { name: string; count: number }> = {};
      redemptions.forEach((r: any) => {
        const name = r.rewards?.title || 'Unknown';
        if (!counts[r.reward_id]) counts[r.reward_id] = { name, count: 0 };
        counts[r.reward_id].count++;
      });

      const sorted = Object.values(counts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      if (sorted.length > 0) {
        setRewardPerformance(
          sorted.map((r) => ({ reward: r.name, redemptions: r.count })),
        );
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  if (isLoading || isLoadingSubscription) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        className="space-y-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Preview Banner */}
        {isPreview && (
          <motion.div
            variants={itemVariants}
            className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Preview Mode
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Viewing sample data.{' '}
                <Link href="/checkout/core" className="underline font-semibold">
                  Upgrade
                </Link>{' '}
                to see real metrics.
              </p>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          className="flex justify-between items-center"
          variants={itemVariants}
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Analytics
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Track your loyalty program performance
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition">
            <Download className="w-4 h-4" />
            Export
          </button>
        </motion.div>

        {/* KPI Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
        >
          {[
            {
              label: 'Total Points Issued',
              value: kpi.totalPoints.toLocaleString(),
            },
            {
              label: 'Avg Points/Transaction',
              value: kpi.avgPointsPerTx.toLocaleString(),
            },
            {
              label: 'Customer Lifetime Value',
              value: `${kpi.customerLTV.toLocaleString()} pts`,
            },
            { label: 'Repeat Customer Rate', value: `${kpi.repeatRate}%` },
          ].map((item, i) => (
            <motion.div key={i} variants={itemVariants}>
              <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {item.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {item.value}
                </p>
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> vs last month
                </p>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          variants={containerVariants}
        >
          {/* Monthly Points */}
          <motion.div variants={itemVariants}>
            <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Monthly Points
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip />
                  <Bar dataKey="points" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* Customer Segments */}
          <motion.div variants={itemVariants}>
            <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Customer Segments
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={customerSegments}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    dataKey="value"
                  >
                    {customerSegments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* Reward Performance */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <div className="max-w-2xl mx-auto">
              <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Top Rewards
                </h2>
                <div className="space-y-4">
                  {rewardPerformance.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Gift className="w-5 h-5 text-cyan-500" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {item.reward}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {item.redemptions} redemptions
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
