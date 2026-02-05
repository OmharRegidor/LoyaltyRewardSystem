"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

interface StatsCardProps {
  title: string
  value: string
  change: number
  icon: React.ComponentType<{ className?: string }>
  color?: "primary" | "secondary" | "success" | "warning"
}

export function StatsCard({ title, value, change, icon: Icon, color = "primary" }: StatsCardProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
  }

  const isPositive = change >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={mounted ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      whileHover={{ translateY: -4 }}
    >
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className={cn("p-3 rounded-lg", colorClasses[color])}>
            <Icon className="w-6 h-6" />
          </div>
          <div
            className={cn(
              "flex items-center gap-1 text-sm font-semibold",
              isPositive ? "text-success" : "text-destructive",
            )}
          >
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {Math.abs(change)}%
          </div>
        </div>

        <h3 className="text-sm text-gray-500 mb-1">{title}</h3>
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-xs text-gray-500 mt-2">{isPositive ? "Increase" : "Decrease"} from last month</p>
      </Card>
    </motion.div>
  )
}
