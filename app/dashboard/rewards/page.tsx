"use client"

import { DashboardLayout } from "@/components/dashboard/layout"
import { RewardsHeader } from "@/components/rewards/header"
import { RewardsGrid } from "@/components/rewards/grid"
import { CreateRewardModal } from "@/components/rewards/create-modal"
import { motion } from "framer-motion"
import { useState } from "react"

export default function RewardsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [rewards, setRewards] = useState([
    {
      id: 1,
      title: "Free Coffee",
      description: "Get a free regular coffee",
      pointsCost: 250,
      stock: 45,
      category: "Food",
      status: "active",
      image: "/free-coffee-reward.jpg",
    },
    {
      id: 2,
      title: "20% Discount",
      description: "Enjoy 20% off on your next purchase",
      pointsCost: 500,
      stock: 0,
      category: "Discount",
      status: "active",
      image: "/discount-coupon.png",
    },
    {
      id: 3,
      title: "Free Pastry",
      description: "Choice of any pastry item",
      pointsCost: 200,
      stock: 32,
      category: "Food",
      status: "active",
      image: "/pastry-basket.jpg",
    },
    {
      id: 4,
      title: "Birthday Special",
      description: "₱500 worth of items free on your birthday",
      pointsCost: 1000,
      stock: 8,
      category: "Service",
      status: "active",
      image: "/birthday-celebration.jpg",
    },
    {
      id: 5,
      title: "Free Lunch",
      description: "Full meal combo on us",
      pointsCost: 750,
      stock: 0,
      category: "Food",
      status: "inactive",
      image: "/lunch-meal-combo.jpg",
    },
    {
      id: 6,
      title: "Double Points Day",
      description: "Earn 2x points on next visit",
      pointsCost: 300,
      stock: 100,
      category: "Product",
      status: "active",
      image: "/double-points-bonus.jpg",
    },
  ])

  const handleCreateReward = (newReward: any) => {
    const reward = {
      id: Math.max(...rewards.map((r) => r.id), 0) + 1,
      ...newReward,
      status: "active",
    }
    setRewards([...rewards, reward])
    setIsCreateOpen(false)
  }

  const handleDeleteReward = (id: number) => {
    setRewards(rewards.filter((r) => r.id !== id))
  }

  const handleToggleStatus = (id: number) => {
    setRewards(rewards.map((r) => (r.id === id ? { ...r, status: r.status === "active" ? "inactive" : "active" } : r)))
  }

  return (
    <DashboardLayout>
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <RewardsHeader viewMode={viewMode} onViewModeChange={setViewMode} onCreateClick={() => setIsCreateOpen(true)} />

        <RewardsGrid
          rewards={rewards}
          viewMode={viewMode}
          onDelete={handleDeleteReward}
          onToggleStatus={handleToggleStatus}
        />

        <CreateRewardModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreate={handleCreateReward} />
      </motion.div>
    </DashboardLayout>
  )
}
