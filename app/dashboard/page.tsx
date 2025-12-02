"use client"

import { DashboardLayout } from "@/components/dashboard/layout"
import { StatsCard } from "@/components/dashboard/stats-card"
import { ChartSection } from "@/components/dashboard/chart-section"
import { TransactionTable } from "@/components/dashboard/transaction-table"
import { TrendingUp, Users, Gift, DollarSign } from "lucide-react"
import { motion } from "framer-motion"

export default function DashboardPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  }

  return (
    <DashboardLayout>
      <motion.div className="space-y-8" initial="hidden" animate="visible" variants={containerVariants}>
        {/* Header */}
        <motion.div className="flex justify-between items-center" variants={itemVariants}>
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back to LoyaltyHub</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Today's Date</p>
            <p className="font-semibold">December 2, 2025</p>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" variants={containerVariants}>
          <motion.div variants={itemVariants}>
            <StatsCard title="Total Customers" value="2,847" change={12} icon={Users} color="primary" />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatsCard title="Points Issued Today" value="18,540" change={8} icon={TrendingUp} color="secondary" />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatsCard title="Active Rewards" value="24" change={3} icon={Gift} color="success" />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatsCard title="Revenue This Month" value="₱485,200" change={-2} icon={DollarSign} color="warning" />
          </motion.div>
        </motion.div>

        {/* Charts */}
        <motion.div variants={itemVariants}>
          <ChartSection />
        </motion.div>

        {/* Transactions */}
        <motion.div variants={itemVariants}>
          <TransactionTable />
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}
