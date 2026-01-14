// apps/web/components/customers/table.tsx

"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MoreVertical, Star } from "lucide-react"
import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 1,
    name: "Maria Santos",
    phone: "+63 915 123 4567",
    points: 3250,
    visits: 12,
    lastVisit: "2 days ago",
    status: "active",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=maria",
  },
  {
    id: 2,
    name: "Juan Dela Cruz",
    phone: "+63 917 456 7890",
    points: 1840,
    visits: 7,
    lastVisit: "1 week ago",
    status: "active",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=juan",
  },
  {
    id: 3,
    name: "Ana Garcia",
    phone: "+63 918 234 5678",
    points: 2100,
    visits: 9,
    lastVisit: "3 days ago",
    status: "active",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ana",
  },
  {
    id: 4,
    name: "Carlos Rodriguez",
    phone: "+63 919 345 6789",
    points: 850,
    visits: 3,
    lastVisit: "2 weeks ago",
    status: "inactive",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=carlos",
  },
  {
    id: 5,
    name: "Rosa Mendes",
    phone: "+63 916 678 9012",
    points: 4500,
    visits: 18,
    lastVisit: "1 day ago",
    status: "active",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=rosa",
  },
]

interface CustomersTableProps {
  searchTerm: string
  statusFilter: string
  pointsRange: [number, number]
  sortBy: string
  onSelectCustomer: (customer: Customer) => void
}

export function CustomersTable({
  searchTerm,
  statusFilter,
  pointsRange,
  sortBy,
  onSelectCustomer,
}: CustomersTableProps) {
  const [selectedRows, setSelectedRows] = useState<number[]>([])

  const filteredCustomers = MOCK_CUSTOMERS.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || customer.phone.includes(searchTerm)
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter
    const matchesPoints = customer.points >= pointsRange[0] && customer.points <= pointsRange[1]
    return matchesSearch && matchesStatus && matchesPoints
  })

  // Sort customers
  if (sortBy === "points") {
    filteredCustomers.sort((a, b) => b.points - a.points)
  } else if (sortBy === "name") {
    filteredCustomers.sort((a, b) => a.name.localeCompare(b.name))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/50">
              <tr className="text-left text-sm font-semibold text-muted-foreground">
                <th className="px-6 py-4 w-8">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Total Points</th>
                <th className="px-6 py-4">Visits</th>
                <th className="px-6 py-4">Last Visit</th>
                <th className="px-6 py-4 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer, idx) => (
                <motion.tr
                  key={customer.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => onSelectCustomer(customer)}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      className="rounded"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRows([...selectedRows, customer.id])
                        } else {
                          setSelectedRows(selectedRows.filter((id) => id !== customer.id))
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={customer.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{customer.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{customer.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-warning" />
                      <span className="font-semibold">{customer.points}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className="font-medium">
                      {customer.visits}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{customer.lastVisit}</td>
                  <td className="px-6 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="p-2 hover:bg-muted rounded-lg transition">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                        <DropdownMenuItem>Award Points</DropdownMenuItem>
                        <DropdownMenuItem>Send Message</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-muted-foreground">No customers found</p>
          </div>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredCustomers.length} of {MOCK_CUSTOMERS.length} customers
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-border rounded-lg hover:bg-muted transition text-sm">
              Previous
            </button>
            <button className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-sm">1</button>
            <button className="px-3 py-1 border border-border rounded-lg hover:bg-muted transition text-sm">2</button>
            <button className="px-3 py-1 border border-border rounded-lg hover:bg-muted transition text-sm">
              Next
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
