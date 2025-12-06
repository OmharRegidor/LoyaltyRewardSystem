"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Eye, EyeOff, Coins } from "lucide-react"

interface Reward {
  id: number
  title: string
  description: string
  pointsCost: number
  stock: number
  category: string
  status: "active" | "inactive"
  image: string
}

interface RewardsGridProps {
  rewards: Reward[]
  viewMode: "grid" | "list"
  onDelete: (id: number) => void
  onToggleStatus: (id: number) => void
}

export function RewardsGrid({ rewards, viewMode, onDelete, onToggleStatus }: RewardsGridProps) {
  if (rewards.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-border mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl">+</span>
          </div>
          <h3 className="font-semibold mb-2">Create Your First Reward</h3>
          <p className="text-muted-foreground">Start building your rewards catalog</p>
        </div>
      </Card>
    )
  }

  return (
    <motion.div
      className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {rewards.map((reward, idx) => (
        <motion.div
          key={reward.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.05 }}
        >
          {viewMode === "grid" ? (
            <RewardCard reward={reward} onDelete={onDelete} onToggleStatus={onToggleStatus} />
          ) : (
            <RewardListItem reward={reward} onDelete={onDelete} onToggleStatus={onToggleStatus} />
          )}
        </motion.div>
      ))}
    </motion.div>
  )
}

function RewardCard({
  reward,
  onDelete,
  onToggleStatus,
}: {
  reward: Reward
  onDelete: (id: number) => void
  onToggleStatus: (id: number) => void
}) {
  return (
    <Card className="overflow-hidden hover:shadow-lg hover:border-secondary/50 transition-all group">
      {/* Image */}
      <div className="relative h-40 bg-muted overflow-hidden">
        <img
          src={reward.image || "/placeholder.svg"}
          alt={reward.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
        />
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <Badge
            className={
              reward.status === "active"
                ? "bg-success text-success-foreground"
                : "bg-destructive text-destructive-foreground"
            }
          >
            {reward.status === "active" ? "ACTIVE" : "OUT OF STOCK"}
          </Badge>
        </div>
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
          <button className="w-full bg-white text-black font-semibold py-2 rounded-lg hover:bg-muted transition">
            View Details
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold line-clamp-2">{reward.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{reward.description}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Coins className="w-4 h-4 text-primary" />
            <span className="font-bold text-lg">{reward.pointsCost}</span>
          </div>
          <span className="text-xs text-muted-foreground">{reward.stock} left</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-border">
          <button
            onClick={() => onToggleStatus(reward.id)}
            className="flex-1 flex items-center justify-center gap-1 p-2 hover:bg-muted rounded-lg transition text-sm"
          >
            {reward.status === "active" ? (
              <>
                <EyeOff className="w-4 h-4" />
                Hide
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Show
              </>
            )}
          </button>
          <button className="flex-1 flex items-center justify-center gap-1 p-2 hover:bg-muted rounded-lg transition text-sm">
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => onDelete(reward.id)}
            className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  )
}

function RewardListItem({
  reward,
  onDelete,
  onToggleStatus,
}: {
  reward: Reward
  onDelete: (id: number) => void
  onToggleStatus: (id: number) => void
}) {
  return (
    <Card className="p-4 hover:shadow-lg transition-all">
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="h-24 w-24 rounded-lg overflow-hidden shrink-0 bg-muted">
          <img src={reward.image || "/placeholder.svg"} alt={reward.title} className="w-full h-full object-cover" />
        </div>
s
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h3 className="font-bold">{reward.title}</h3>
              <p className="text-sm text-muted-foreground">{reward.description}</p>
            </div>
            <Badge
              className={
                reward.status === "active"
                  ? "bg-success text-success-foreground"
                  : "bg-destructive text-destructive-foreground"
              }
            >
              {reward.status === "active" ? "ACTIVE" : "OUT"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Coins className="w-4 h-4 text-primary" />
                <span className="font-bold">{reward.pointsCost}</span>
              </div>
              <span className="text-sm text-muted-foreground">Stock: {reward.stock}</span>
            </div>

            <div className="flex gap-2">
              <button onClick={() => onToggleStatus(reward.id)} className="p-2 hover:bg-muted rounded-lg transition">
                {reward.status === "active" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button className="p-2 hover:bg-muted rounded-lg transition">
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(reward.id)}
                className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
