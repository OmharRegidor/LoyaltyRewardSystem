"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Minus, Plus, Check, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"

interface ScannerBottomSheetProps {
  customer: {
    customerId: string
    customerName: string
    currentPoints: number
    status: "success" | "error"
  }
  onClose: () => void
  onConfirm: () => void
}

export function ScannerBottomSheet({ customer, onClose, onConfirm }: ScannerBottomSheetProps) {
  const [pointsToAward, setPointsToAward] = useState(100)
  const [transactionNote, setTransactionNote] = useState("")
  const [isConfirmed, setIsConfirmed] = useState(false)

  const presetPoints = [10, 25, 50, 100]

  const handleConfirm = () => {
    setIsConfirmed(true)
    setTimeout(() => {
      onConfirm()
      setIsConfirmed(false)
    }, 1500)
  }

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/40 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-card shadow-2xl max-w-2xl mx-auto"
        initial={{ y: 600 }}
        animate={{ y: 0 }}
        exit={{ y: 600 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
      >
        {/* Handle Bar */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 bg-gray-100 rounded-full" />
        </div>

        <div className="px-6 pb-8 space-y-6 max-h-[70vh] overflow-y-auto">
          {!isConfirmed ? (
            <>
              {/* Customer Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${customer.customerName}`} />
                  <AvatarFallback>{customer.customerName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{customer.customerName}</p>
                  <p className="text-sm text-gray-500">ID: {customer.customerId}</p>
                </div>
              </div>

              {/* Points Display */}
              <Card className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300">
                <p className="text-sm text-gray-500 mb-1">Current Points Balance</p>
                <p className="text-4xl font-bold text-gray-900">{customer.currentPoints}</p>
              </Card>

              {/* Points to Award */}
              <div className="space-y-3">
                <label className="text-sm font-semibold block">Points to Award</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setPointsToAward(Math.max(0, pointsToAward - 10))}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <Input
                    type="number"
                    value={pointsToAward}
                    onChange={(e) => setPointsToAward(Number(e.target.value))}
                    className="text-center text-2xl font-bold"
                  />
                  <button
                    onClick={() => setPointsToAward(pointsToAward + 10)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* Preset Buttons */}
                <div className="flex gap-2 flex-wrap">
                  {presetPoints.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setPointsToAward(preset)}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        pointsToAward === preset
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      +{preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transaction Note */}
              <div className="space-y-2">
                <label className="text-sm font-semibold block">Transaction Note (Optional)</label>
                <Input
                  placeholder="e.g., Large purchase discount"
                  value={transactionNote}
                  onChange={(e) => setTransactionNote(e.target.value)}
                  className="text-sm"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={onClose}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900" onClick={handleConfirm}>
                  <Check className="w-4 h-4 mr-2" />
                  Confirm Award
                </Button>
              </div>
            </>
          ) : (
            /* Success State */
            <motion.div
              className="py-12 text-center space-y-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center"
                animate={{ scale: [0.8, 1.2, 1] }}
                transition={{ duration: 0.6 }}
              >
                <Check className="w-8 h-8 text-green-600" />
              </motion.div>

              <div>
                <h3 className="text-2xl font-bold mb-2">Points Awarded!</h3>
                <p className="text-gray-500">
                  {pointsToAward} points added to {customer.customerName}
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <p className="text-sm text-gray-500 mb-1">New Points Balance</p>
                <p className="text-3xl font-bold text-green-600">{customer.currentPoints + pointsToAward}</p>
              </div>

              {/* Confetti Animation */}
              <div className="relative h-24 flex items-center justify-center overflow-hidden">
                {[...Array(10)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                    initial={{
                      x: 0,
                      y: 0,
                      opacity: 1,
                    }}
                    animate={{
                      x: Math.cos(i) * 100,
                      y: -150,
                      opacity: 0,
                      rotate: 360,
                    }}
                    transition={{
                      duration: 2,
                      delay: i * 0.05,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
