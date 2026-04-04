// apps/web/app/dashboard/customers/page.tsx

'use client';

import { DashboardLayout } from '@/components/dashboard/layout';
import { CustomersHeader } from '@/components/customers/header';
import { CustomersFilters } from '@/components/customers/filters';
import { CustomersTable } from '@/components/customers/table';
import { CustomerDetailModal } from '@/components/customers/detail-modal';
import { AddCustomerModal } from '@/components/customers/add-customer-modal';
import { motion } from 'framer-motion';
import { useState, useCallback } from 'react';
import { useCustomers, type Customer } from '@/hooks/useCustomers';
import { useBusinessContext } from '@/hooks/useBusinessContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function CustomersPage() {
  // Business context
  const { business, isLoading: isLoadingBusiness } = useBusinessContext();

  // Customers data with realtime
  const { customers, isLoading, error, totalCount, removeCustomers } =
    useCustomers({
      businessId: business?.id ?? null,
      onNewCustomer: useCallback((customer: Customer) => {}, []),
    });

  // Bulk delete handler
  const handleBulkDelete = useCallback(
    async (customerIds: string[]) => {
      const res = await fetch('/api/dashboard/customers/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerIds }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove customers');
      }

      removeCustomers(customerIds);
    },
    [removeCustomers],
  );

  // UI State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pointsRange, setPointsRange] = useState<[number, number]>([0, 100000]);
  const [sortBy, setSortBy] = useState('recent');

  const handleAddCustomerClick = () => {
    setIsAddModalOpen(true);
  };

  // Loading business context
  if (isLoadingBusiness) {
    return (
      <DashboardLayout>
        <div className="space-y-5 sm:space-y-6 overflow-hidden">
          {/* Header skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Skeleton className="h-7 w-36 rounded-lg" />
              <Skeleton className="h-5 w-64 mt-1.5 rounded-lg" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-64 rounded-xl" />
              <Skeleton className="h-11 w-36 rounded-xl" />
            </div>
          </div>

          {/* Filters skeleton */}
          <div className="bg-white rounded-2xl shadow-card border border-border/50 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-9 w-full rounded-xl" />
              <Skeleton className="h-9 w-full rounded-xl" />
              <Skeleton className="h-9 w-full rounded-xl" />
            </div>
          </div>

          {/* Table skeleton */}
          <div className="bg-white rounded-2xl shadow-card border border-border/50 overflow-hidden">
            {/* Table header */}
            <div className="px-6 py-3 bg-muted/30 flex gap-4">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24 ml-auto" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
            {/* Table rows */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4 border-t border-border/50">
                <Skeleton className="w-5 h-5 rounded" />
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-36 rounded-lg" />
                  <Skeleton className="h-3 w-24 rounded-lg" />
                </div>
                <Skeleton className="h-5 w-16 rounded-lg" />
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-4 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // No business found
  if (!business) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">
            No business found. Please set up your business first.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        className="space-y-5 sm:space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <CustomersHeader
          onSearchChange={setSearchTerm}
          onAddCustomer={handleAddCustomerClick}
        />

        <CustomersFilters
          status={statusFilter}
          onStatusChange={setStatusFilter}
          pointsRange={pointsRange}
          onPointsRangeChange={setPointsRange}
          sortBy={sortBy}
          onSortByChange={setSortBy}
        />

        <CustomersTable
          customers={customers}
          isLoading={isLoading}
          error={error}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          pointsRange={pointsRange}
          sortBy={sortBy}
          onSelectCustomer={setSelectedCustomer}
          onBulkDelete={handleBulkDelete}
        />

        {/* Customer Detail Modal */}
        {selectedCustomer && (
          <CustomerDetailModal
            customer={{
              id: parseInt(selectedCustomer.id.slice(-6), 16) || 0,
              name: selectedCustomer.fullName,
              phone: selectedCustomer.phone || '',
              points: selectedCustomer.totalPoints,
              visits: 0,
              lastVisit: selectedCustomer.lastVisit
                ? formatRelativeTime(selectedCustomer.lastVisit)
                : 'Never',
              status: selectedCustomer.lastVisit
                ? new Date(selectedCustomer.lastVisit) >
                  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                  ? 'active'
                  : 'inactive'
                : 'inactive',
              avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                selectedCustomer.fullName,
              )}`,
              customerId: selectedCustomer.id,
            }}
            businessId={business?.id}
            onClose={() => setSelectedCustomer(null)}
          />
        )}

        {/* Add Customer Modal */}
        <AddCustomerModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          businessName={business.name}
        />

      </motion.div>
    </DashboardLayout>
  );
}

// Helper function
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
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
