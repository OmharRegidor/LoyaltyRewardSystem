// apps/web/components/customers/filters.tsx
"use client"

import { motion } from "framer-motion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
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
      <Card className="p-4 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <Select value={status} onValueChange={onStatusChange}>
              <SelectTrigger>
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
          <div className="space-y-2 md:col-span-1">
            <label className="text-sm font-medium text-gray-700">Points Range</label>
            <div className="space-y-2">
              <Slider
                min={0}
                max={5000}
                step={100}
                value={pointsRange}
                onValueChange={(value) => onPointsRangeChange(value as [number, number])}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{pointsRange[0]}</span>
                <span>{pointsRange[1]}</span>
              </div>
            </div>
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Sort By</label>
            <Select value={sortBy} onValueChange={onSortByChange}>
              <SelectTrigger>
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
