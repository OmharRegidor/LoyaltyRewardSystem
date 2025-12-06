"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Calendar, Award, TrendingUp } from "lucide-react"

interface Customer {
  id: number
  name: string
  phone: string
  points: number
  visits: number
  lastVisit: string
  status: "active" | "inactive"
  avatar: string
}

interface CustomerDetailModalProps {
  customer: Customer
  onClose: () => void
}

export function CustomerDetailModal({ customer, onClose }: CustomerDetailModalProps) {
  const transactions = [
    { date: "Today", type: "earned", points: 250, description: "Purchase - Coffee" },
    { date: "Yesterday", type: "redeemed", points: 500, description: "Free Coffee Reward" },
    { date: "2 days ago", type: "earned", points: 175, description: "Purchase - Pastry" },
    { date: "5 days ago", type: "earned", points: 300, description: "Referral Bonus" },
  ]

  return (
    <Dialog open={!!customer} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Customer Details</DialogTitle>
        </DialogHeader>

        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Side - Customer Info */}
            <Card className="p-6 space-y-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-16 w-16 mb-4">
                  <AvatarImage src={customer.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{customer.name[0]}</AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-bold">{customer.name}</h3>
                <p className="text-sm text-muted-foreground">{customer.phone}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Award className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total Points</p>
                    <p className="text-lg font-bold">{customer.points}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-secondary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total Visits</p>
                    <p className="text-lg font-bold">{customer.visits}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="w-5 h-5 text-success shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Last Visit</p>
                    <p className="text-lg font-bold">{customer.lastVisit}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-border">
                <Button className="w-full gradient-primary text-primary-foreground">Award Bonus Points</Button>
                <Button variant="outline" className="w-full bg-transparent">
                  Send Push Notification
                </Button>
              </div>
            </Card>

            {/* Right Side - Points History */}
            <Card className="p-6">
              <h4 className="font-semibold mb-4">Points History</h4>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {transactions.map((tx, idx) => (
                  <motion.div
                    key={idx}
                    className="flex items-start gap-3 pb-3 border-b border-border last:border-0"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        tx.type === "earned" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {tx.type === "earned" ? "+" : "-"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{tx.date}</p>
                    </div>
                    <p
                      className={`text-sm font-semibold shrink-0 ${
                        tx.type === "earned" ? "text-success" : "text-foreground"
                      }`}
                    >
                      {tx.type === "earned" ? "+" : "-"}
                      {tx.points}
                    </p>
                  </motion.div>
                ))}
              </div>
            </Card>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
