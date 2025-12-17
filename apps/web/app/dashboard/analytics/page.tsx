'use client';

import { DashboardLayout } from '@/components/dashboard/layout';
import { Card } from '@/components/ui/card';
import {
  LineChart,
  Line,
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
import { TrendingUp, Users, Gift, Target, Download } from 'lucide-react';

const monthlyRevenueData = [
  { month: 'Jan', revenue: 45000, points: 12000 },
  { month: 'Feb', revenue: 52000, points: 14500 },
  { month: 'Mar', revenue: 48000, points: 13000 },
  { month: 'Apr', revenue: 61000, points: 16200 },
  { month: 'May', revenue: 55000, points: 15100 },
  { month: 'Jun', revenue: 68000, points: 18500 },
];

const customerSegmentData = [
  { name: 'High Value', value: 35, color: '#6366f1' },
  { name: 'Regular', value: 45, color: '#06b6d4' },
  { name: 'At Risk', value: 15, color: '#f59e0b' },
  { name: 'Inactive', value: 5, color: '#ef4444' },
];

const rewardPerformanceData = [
  { reward: 'Free Coffee', redemptions: 234, revenue: 4680 },
  { reward: 'Discount 20%', redemptions: 189, revenue: 9450 },
  { reward: 'Free Pastry', redemptions: 156, revenue: 3120 },
  { reward: 'Double Points', redemptions: 142, revenue: 0 },
  { reward: 'Free Lunch', redemptions: 98, revenue: 2450 },
];

const retentionData = [
  { week: 'Week 1', retention: 92 },
  { week: 'Week 2', retention: 88 },
  { week: 'Week 3', retention: 85 },
  { week: 'Week 4', retention: 87 },
  { week: 'Week 5', retention: 89 },
  { week: 'Week 6', retention: 91 },
  { week: 'Week 7', retention: 93 },
];

export default function AnalyticsPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <motion.div
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div
        className="flex justify-between items-center"
        variants={itemVariants}
      >
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track your loyalty program performance
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold">₱429,000</p>
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> 12% vs last month
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Avg Order Value
                </p>
                <p className="text-2xl font-bold">₱1,245</p>
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> 8% increase
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Customer Lifetime Value
                </p>
                <p className="text-2xl font-bold">₱5,890</p>
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> 15% growth
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Repeat Purchase Rate
                </p>
                <p className="text-2xl font-bold">68%</p>
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> 5% improvement
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Charts Grid */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        variants={containerVariants}
      >
        {/* Monthly Revenue & Points */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">
              Monthly Revenue & Points Issued
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyRevenueData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar
                  dataKey="revenue"
                  fill="var(--color-primary)"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="points"
                  fill="var(--color-secondary)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Customer Segment */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Customer Segmentation</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={customerSegmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  dataKey="value"
                >
                  {customerSegmentData.map((entry, index) => (
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
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Reward Performance</h2>
            <div className="space-y-4">
              {rewardPerformanceData.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.reward}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.redemptions} redemptions
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ₱{item.revenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Retention Rate */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Weekly Retention Rate</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={retentionData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                />
                <XAxis dataKey="week" stroke="var(--color-muted-foreground)" />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="retention"
                  stroke="var(--color-secondary)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-secondary)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </motion.div>

      {/* Insights */}
      <motion.div variants={itemVariants}>
        <Card className="p-6 bg-linear-to-r from-primary/10 to-secondary/10 border-primary/20">
          <h2 className="text-xl font-bold mb-4">Key Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <Target className="w-5 h-5 text-primary shrink-0 mt-1" />
              <div>
                <p className="font-medium">Highest Engagement</p>
                <p className="text-sm text-muted-foreground">
                  Free Coffee rewards drive 45% of redemptions
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Users className="w-5 h-5 text-secondary shrink-0 mt-1" />
              <div>
                <p className="font-medium">Growing Segment</p>
                <p className="text-sm text-muted-foreground">
                  High-value customers increased 25% this quarter
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <TrendingUp className="w-5 h-5 text-green-600 shrink-0 mt-1" />
              <div>
                <p className="font-medium">Strong Retention</p>
                <p className="text-sm text-muted-foreground">
                  93% weekly retention rate, highest in 6 weeks
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Gift className="w-5 h-5 text-warning shrink-0 mt-1" />
              <div>
                <p className="font-medium">Opportunity</p>
                <p className="text-sm text-muted-foreground">
                  5% inactive customers could be re-engaged
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
