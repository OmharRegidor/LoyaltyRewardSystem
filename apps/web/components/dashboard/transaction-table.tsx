"use client"

import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

const transactions = [
  {
    id: 1,
    customer: "Maria Santos",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=maria",
    action: "Points Earned",
    points: "+250",
    timestamp: "2 hours ago",
    type: "earn",
  },
  {
    id: 2,
    customer: "Juan Dela Cruz",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=juan",
    action: "Reward Redeemed",
    points: "-500",
    timestamp: "4 hours ago",
    type: "redeem",
  },
  {
    id: 3,
    customer: "Ana Garcia",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ana",
    action: "Bonus Points Awarded",
    points: "+100",
    timestamp: "6 hours ago",
    type: "earn",
  },
  {
    id: 4,
    customer: "Carlos Rodriguez",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=carlos",
    action: "Points Earned",
    points: "+175",
    timestamp: "1 day ago",
    type: "earn",
  },
  {
    id: 5,
    customer: "Rosa Mendes",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=rosa",
    action: "Reward Redeemed",
    points: "-250",
    timestamp: "2 days ago",
    type: "redeem",
  },
]

export function TransactionTable() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">Recent Transactions</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr className="text-left text-sm font-semibold text-muted-foreground">
                <th className="pb-4 pl-4">Customer</th>
                <th className="pb-4">Action</th>
                <th className="pb-4 text-right">Points</th>
                <th className="pb-4 text-right pr-4">Time</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, idx) => (
                <motion.tr
                  key={tx.id}
                  className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <td className="py-4 pl-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={tx.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{tx.customer[0]}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{tx.customer}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <Badge variant={tx.type === "earn" ? "secondary" : "outline"} className="text-xs">
                      {tx.action}
                    </Badge>
                  </td>
                  <td className="py-4 text-right font-semibold">
                    <span className={tx.type === "earn" ? "text-success" : "text-foreground"}>{tx.points}</span>
                  </td>
                  <td className="py-4 pr-4 text-right text-sm text-muted-foreground">{tx.timestamp}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  )
}
