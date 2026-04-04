// apps/web/app/dashboard/analytics/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card } from '@/components/ui/card';
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
  Gift,
  Download,
  BarChart3,
  PieChartIcon,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// ============================================
// DEFAULT EMPTY STATE VALUES
// ============================================

const DEFAULT_KPI = {
  totalPoints: 0,
  avgPointsPerTx: 0,
  customerLTV: 0,
  repeatRate: 0,
};

interface MonthlyDataPoint {
  month: string;
  points: number;
}

interface CustomerSegment {
  name: string;
  value: number;
  color: string;
}

interface RewardPerformanceItem {
  reward: string;
  redemptions: number;
}

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyDataPoint[]>([]);
  const [customerSegments, setCustomerSegments] = useState<CustomerSegment[]>([]);
  const [rewardPerformance, setRewardPerformance] = useState<RewardPerformanceItem[]>([]);
  const [kpi, setKpi] = useState(DEFAULT_KPI);

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
          .select('id')
          .eq('owner_id', user.id)
          .single();

        if (!business) return;

        // Load real-time analytics for all users
        await loadRealTimeAnalytics(supabase, business.id);
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
    // Get transactions from last 12 months only
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const { data: transactions } = await supabase
      .from('transactions')
      .select('points, created_at')
      .eq('business_id', businessId)
      .gte('created_at', twelveMonthsAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10000);

    if (transactions && transactions.length > 0) {
      // Group by month-year to avoid cross-year collisions
      const monthlyStats: Record<string, number> = {};

      transactions.forEach((tx) => {
        if (!tx.created_at) return;
        const d = new Date(tx.created_at);
        const key = `${d.toLocaleString('en-US', { month: 'short' })} ${d.getFullYear()}`;
        monthlyStats[key] = (monthlyStats[key] || 0) + (tx.points || 0);
      });

      const data = Object.entries(monthlyStats).map(([month, points]) => ({
        month,
        points,
      }));
      setMonthlyData(data);

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
            color: '#D32F2F', // Primary red
          },
          {
            name: 'Regular',
            value: Math.round((regular / total) * 100) || 0,
            color: '#FFC107', // Secondary yellow
          },
          {
            name: 'Inactive',
            value: Math.round((inactive / total) * 100) || 0,
            color: '#9CA3AF', // Gray for inactive
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
      redemptions.forEach((r) => {
        const reward = r.rewards as { title: string } | null;
        const name = reward?.title || 'Unknown';
        if (!counts[r.reward_id]) counts[r.reward_id] = { name, count: 0 };
        counts[r.reward_id].count++;
      });

      const sorted = Object.values(counts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setRewardPerformance(
        sorted.map((r) => ({ reward: r.name, redemptions: r.count })),
      );
    }
  };

  const handleExportCsv = () => {
    const date = new Date().toISOString().split('T')[0];

    const sections: string[] = [
      'Analytics Report',
      `Generated,${date}`,
      '',
      'KPI Summary',
      'Metric,Value',
      `Total Points Issued,"${kpi.totalPoints.toLocaleString()}"`,
      `Avg Points/Transaction,${kpi.avgPointsPerTx.toLocaleString()}`,
      `Customer Lifetime Value,${kpi.customerLTV.toLocaleString()} pts`,
      `Repeat Customer Rate,${kpi.repeatRate}%`,
      '',
      'Monthly Points',
      'Month,Points',
      ...monthlyData.map((d) => `${d.month},${d.points}`),
      '',
      'Customer Segments',
      'Segment,Percentage',
      ...customerSegments.map((s) => `${s.name},${s.value}%`),
      '',
      'Top Rewards',
      'Reward,Redemptions',
      ...rewardPerformance.map((r) => `"${r.reward.replace(/"/g, '""')}",${r.redemptions}`),
    ];

    const blob = new Blob([sections.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-export-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-5 sm:space-y-6 overflow-hidden">
          {/* Header skeleton */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <Skeleton className="h-8 w-32 rounded-lg" />
              <Skeleton className="h-5 w-64 mt-1.5 rounded-lg" />
            </div>
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>

          {/* KPI cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-5 shadow-card border border-border/50">
                <Skeleton className="h-3 w-32 mb-3 rounded-lg" />
                <Skeleton className="h-7 w-20 rounded-lg" />
                <Skeleton className="h-3 w-24 mt-3 rounded-lg" />
              </Card>
            ))}
          </div>

          {/* Charts skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Monthly points chart skeleton */}
            <Card className="p-5 sm:p-6 shadow-card border border-border/50">
              <Skeleton className="h-6 w-36 mb-4 rounded-lg" />
              <div className="h-[200px] flex items-end gap-3 px-4">
                {[40, 65, 45, 80, 55, 70, 50, 85, 60, 75, 90, 65].map((h, i) => (
                  <Skeleton key={i} className="flex-1 rounded-t-lg" style={{ height: `${h}%` }} />
                ))}
              </div>
            </Card>

            {/* Customer segments chart skeleton */}
            <Card className="p-5 sm:p-6 shadow-card border border-border/50">
              <Skeleton className="h-6 w-44 mb-4 rounded-lg" />
              <div className="h-[200px] flex items-center justify-center">
                <Skeleton className="w-[180px] h-[180px] rounded-full" />
              </div>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        className="space-y-5 sm:space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
          variants={itemVariants}
        >
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Analytics
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Track your loyalty program performance
            </p>
          </div>
          <button onClick={handleExportCsv} className="flex items-center gap-2 px-4 py-2.5 sm:px-5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all text-sm font-medium self-start sm:self-auto">
            <Download className="w-4 h-4" />
            Export
          </button>
        </motion.div>

        {/* KPI Cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={containerVariants}
        >
          {[
            {
              label: 'Total Points Issued',
              value: kpi.totalPoints.toLocaleString(),
              color: 'red',
              icon: TrendingUp,
            },
            {
              label: 'Avg Points/Transaction',
              value: kpi.avgPointsPerTx.toLocaleString(),
              color: 'amber',
              icon: BarChart3,
            },
            {
              label: 'Customer Lifetime Value',
              value: `${kpi.customerLTV.toLocaleString()} pts`,
              color: 'blue',
              icon: Gift,
            },
            {
              label: 'Repeat Customer Rate',
              value: `${kpi.repeatRate}%`,
              color: 'emerald',
              icon: TrendingUp,
            },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
            <motion.div key={i} variants={itemVariants}>
              <Card className="p-5 shadow-card border border-border/50">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </p>
                  <div className={`p-2 bg-gradient-to-br from-${item.color}-100 to-${item.color}-50 rounded-xl`}>
                    <Icon className={`w-4 h-4 text-${item.color}-600`} />
                  </div>
                </div>
                <p className="font-display text-2xl font-bold tabular-nums tracking-tight text-foreground">
                  {item.value}
                </p>
                <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1 font-medium">
                  <TrendingUp className="w-3.5 h-3.5" /> vs last month
                </p>
              </Card>
            </motion.div>
            );
          })}
        </motion.div>

        {/* Charts */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
          variants={containerVariants}
        >
          {/* Monthly Points */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-card border border-border/50 overflow-hidden">
              <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-border/40">
                <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
                  Monthly Points
                </h2>
              </div>
              <div className="p-5 sm:p-6">
              {monthlyData.length === 0 ? (
                <div className="h-[300px] flex flex-col items-center justify-center">
                  <div className="p-4 bg-gradient-to-br from-muted/80 to-muted/40 rounded-2xl mb-4">
                    <BarChart3 className="w-8 h-8 text-muted-foreground/60" />
                  </div>
                  <p className="text-foreground font-medium text-sm">
                    No points data yet
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Issue points to customers to see trends.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                    <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid hsl(var(--border))',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        fontSize: '13px',
                      }}
                    />
                    <Bar dataKey="points" fill="#D32F2F" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
              </div>
            </Card>
          </motion.div>

          {/* Customer Segments */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-card border border-border/50 overflow-hidden">
              <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-border/40">
                <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
                  Customer Segments
                </h2>
              </div>
              <div className="p-5 sm:p-6">
              {customerSegments.length === 0 ? (
                <div className="h-[300px] flex flex-col items-center justify-center">
                  <div className="p-4 bg-gradient-to-br from-muted/80 to-muted/40 rounded-2xl mb-4">
                    <PieChartIcon className="w-8 h-8 text-muted-foreground/60" />
                  </div>
                  <p className="text-foreground font-medium text-sm">
                    No customer data yet
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add customers to see segment breakdown.
                  </p>
                </div>
              ) : (
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
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid hsl(var(--border))',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        fontSize: '13px',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
              </div>
            </Card>
          </motion.div>

          {/* Reward Performance */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <div className="max-w-2xl mx-auto">
              <Card className="shadow-card border border-border/50 overflow-hidden">
                <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-border/40">
                  <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
                    Top Rewards
                  </h2>
                </div>
                <div className="p-5 sm:p-6">
                {rewardPerformance.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center">
                    <div className="p-4 bg-gradient-to-br from-muted/80 to-muted/40 rounded-2xl mb-4">
                      <Gift className="w-8 h-8 text-muted-foreground/60" />
                    </div>
                    <p className="text-foreground font-medium text-sm">
                      No rewards redeemed yet
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create rewards and customers will start redeeming them.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {rewardPerformance.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3.5 bg-muted/50 hover:bg-muted/80 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl">
                            <Gift className="w-4 h-4 text-amber-600" />
                          </div>
                          <span className="font-medium text-sm text-foreground">
                            {item.reward}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground font-medium tabular-nums">
                          {item.redemptions} redemptions
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                </div>
              </Card>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
