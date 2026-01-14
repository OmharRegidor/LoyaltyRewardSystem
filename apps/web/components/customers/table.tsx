// apps/web/components/customers/table.tsx

'use client';

import { memo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Star, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Customer, TierLevel } from '@/hooks/useCustomers';

// ============================================
// TIER CONFIGURATION
// ============================================

const TIER_CONFIG: Record<
  TierLevel,
  { label: string; color: string; bgColor: string }
> = {
  bronze: { label: 'Bronze', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  silver: { label: 'Silver', color: 'text-gray-600', bgColor: 'bg-gray-200' },
  gold: { label: 'Gold', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  platinum: {
    label: 'Platinum',
    color: 'text-slate-700',
    bgColor: 'bg-slate-200',
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatLastVisit(lastVisit: string | null): string {
  if (!lastVisit) return 'Never';

  const date = new Date(lastVisit);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30)
    return `${Math.floor(diffDays / 7)} week${diffDays >= 14 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 30)} month${diffDays >= 60 ? 's' : ''} ago`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function generateAvatarUrl(name: string): string {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    name
  )}`;
}

// ============================================
// TYPES
// ============================================

interface CustomersTableProps {
  customers: Customer[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  statusFilter: string;
  pointsRange: [number, number];
  sortBy: string;
  onSelectCustomer: (customer: Customer) => void;
}

// ============================================
// CONSTANTS
// ============================================

const ITEMS_PER_PAGE = 10;

// ============================================
// COMPONENT
// ============================================

export const CustomersTable = memo(function CustomersTable({
  customers,
  isLoading,
  error,
  searchTerm,
  statusFilter,
  pointsRange,
  sortBy,
  onSelectCustomer,
}: CustomersTableProps) {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, pointsRange, sortBy]);

  // Filter customers
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm);

    const isActive = customer.lastVisit
      ? new Date(customer.lastVisit) >
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      : false;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && isActive) ||
      (statusFilter === 'inactive' && !isActive);

    const matchesPoints =
      customer.totalPoints >= pointsRange[0] &&
      customer.totalPoints <= pointsRange[1];

    return matchesSearch && matchesStatus && matchesPoints;
  });

  // Sort customers
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    switch (sortBy) {
      case 'points':
        return b.totalPoints - a.totalPoints;
      case 'name':
        return a.fullName.localeCompare(b.fullName);
      case 'recent':
      default:
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedCustomers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCustomers = sortedCustomers.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading customers...</span>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="flex items-center justify-center py-20">
        <p className="text-destructive">{error}</p>
      </Card>
    );
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
                <th className="px-6 py-4">Tier</th>
                <th className="px-6 py-4">Total Points</th>
                <th className="px-6 py-4">Last Visit</th>
                <th className="px-6 py-4 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.map((customer, idx) => (
                <motion.tr
                  key={customer.id}
                  className={`border-b border-border last:border-0 hover:bg-muted/30 transition-all cursor-pointer ${
                    customer.isNew
                      ? 'bg-green-500/10 ring-1 ring-green-500/30 ring-inset'
                      : ''
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    backgroundColor: customer.isNew
                      ? ['rgba(34, 197, 94, 0.2)', 'rgba(34, 197, 94, 0.05)']
                      : 'transparent',
                  }}
                  transition={{
                    delay: idx * 0.03,
                    backgroundColor: { duration: 3, ease: 'easeOut' },
                  }}
                  onClick={() => onSelectCustomer(customer)}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selectedRows.includes(customer.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRows([...selectedRows, customer.id]);
                        } else {
                          setSelectedRows(
                            selectedRows.filter((id) => id !== customer.id)
                          );
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {getInitials(customer.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">
                            {customer.fullName}
                          </p>
                          {customer.isNew && (
                            <Badge
                              variant="secondary"
                              className="bg-green-500/20 text-green-600 text-xs"
                            >
                              NEW
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {customer.email ||
                            customer.phone ||
                            'No contact info'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant="secondary"
                      className={`${TIER_CONFIG[customer.tier].bgColor} ${
                        TIER_CONFIG[customer.tier].color
                      } font-medium`}
                    >
                      {TIER_CONFIG[customer.tier].label}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-semibold">
                        {customer.totalPoints.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {formatLastVisit(customer.lastVisit)}
                  </td>
                  <td className="px-6 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button className="p-2 hover:bg-muted rounded-lg transition">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedCustomers.length === 0 && !isLoading && (
          <div className="px-6 py-12 text-center">
            <p className="text-muted-foreground">
              {customers.length === 0
                ? 'No customers yet. Add your first customer!'
                : 'No customers match your filters'}
            </p>
          </div>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {paginatedCustomers.length > 0 ? startIndex + 1 : 0}-
            {Math.min(startIndex + ITEMS_PER_PAGE, sortedCustomers.length)} of{' '}
            {sortedCustomers.length} customers
          </p>
          {totalPages > 1 && (
            <div className="flex gap-2">
              <button
                className="px-3 py-1 border border-border rounded-lg hover:bg-muted transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      currentPage === pageNum
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border hover:bg-muted transition'
                    }`}
                    onClick={() => handlePageClick(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                className="px-3 py-1 border border-border rounded-lg hover:bg-muted transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
});
