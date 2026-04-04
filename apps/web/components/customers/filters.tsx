// apps/web/components/customers/filters.tsx
"use client"

import { motion } from "framer-motion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

interface CustomersFiltersProps {
  status: string
  onStatusChange: (value: string) => void
  pointsRange: [number, number]
  onPointsRangeChange: (value: [number, number]) => void
  sortBy: string
  onSortByChange: (value: string) => void
}

export function CustomersFilters({
  status,
  onStatusChange,
  pointsRange,
  onPointsRangeChange,
  sortBy,
  onSortByChange,
}: CustomersFiltersProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="p-4 bg-white shadow-card border border-border/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Status Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</label>
            <Select value={status} onValueChange={onStatusChange}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Points Range */}
          <div className="space-y-1.5 md:col-span-1">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Points Range</label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                inputMode="numeric"
                placeholder="Min"
                className="rounded-xl tabular-nums"
                value={pointsRange[0]}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "")
                  onPointsRangeChange([value === "" ? 0 : Number(value), pointsRange[1]])
                }}
              />
              <span className="text-sm text-muted-foreground">to</span>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="Max"
                className="rounded-xl tabular-nums"
                value={pointsRange[1]}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "")
                  onPointsRangeChange([pointsRange[0], value === "" ? 0 : Number(value)])
                }}
              />
            </div>
          </div>

          {/* Sort By */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Sort By</label>
            <Select value={sortBy} onValueChange={onSortByChange}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="points">Most Points</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
