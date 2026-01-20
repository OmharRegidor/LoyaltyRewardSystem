// apps/web/app/dashboard/customers/page.tsx

'use client';

import { DashboardLayout } from '@/components/dashboard/layout';
import { CustomersHeader } from '@/components/customers/header';
import { CustomersFilters } from '@/components/customers/filters';
import { CustomersTable } from '@/components/customers/table';
import { CustomerDetailModal } from '@/components/customers/detail-modal';
import { AddCustomerModal } from '@/components/customers/add-customer-modal';
import { UpgradeModal } from '@/components/upgrade-modal';
import { useSubscriptionGate } from '@/hooks/useSubscriptionGate';
import { motion } from 'framer-motion';
import { useState, useCallback } from 'react';
import { useCustomers, type Customer } from '@/hooks/useCustomers';
import { useBusinessContext } from '@/hooks/useBusinessContext';
import { Loader2 } from 'lucide-react';

export default function CustomersPage() {
  // Subscription gate
  const { checkAndGate, showUpgradeModal, setShowUpgradeModal } =
    useSubscriptionGate();

  // Business context
  const { business, isLoading: isLoadingBusiness } = useBusinessContext();

  // Customers data with realtime
  const { customers, isLoading, error, totalCount } = useCustomers({
    businessId: business?.id ?? null,
    onNewCustomer: useCallback((customer: Customer) => {}, []),
  });

  // UI State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pointsRange, setPointsRange] = useState<[number, number]>([0, 5000]);
  const [sortBy, setSortBy] = useState('recent');

  // Gated add customer handler
  const handleAddCustomerClick = () => {
    if (checkAndGate('Add Customer')) {
      setIsAddModalOpen(true);
    }
    // If gated, checkAndGate will show the upgrade modal
  };

  // Loading business context
  if (isLoadingBusiness) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading...</span>
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
        className="space-y-6"
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
            onClose={() => setSelectedCustomer(null)}
          />
        )}

        {/* Add Customer Modal */}
        <AddCustomerModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          businessName={business.name}
        />

        {/* Upgrade Modal */}
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          feature="Add Customer"
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
