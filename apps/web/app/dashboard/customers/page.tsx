// apps/web/app/dashboard/customers/page.tsx

'use client';

import { CustomersHeader } from '@/components/customers/header';
import { CustomersFilters } from '@/components/customers/filters';
import { CustomersTable } from '@/components/customers/table';
import { CustomerDetailModal } from '@/components/customers/detail-modal';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function CustomersPage() {
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pointsRange, setPointsRange] = useState<[number, number]>([0, 5000]);
  const [sortBy, setSortBy] = useState('recent');

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <CustomersHeader onSearchChange={setSearchTerm} />
      <CustomersFilters
        status={statusFilter}
        onStatusChange={setStatusFilter}
        pointsRange={pointsRange}
        onPointsRangeChange={setPointsRange}
        sortBy={sortBy}
        onSortByChange={setSortBy}
      />
      <CustomersTable
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        pointsRange={pointsRange}
        sortBy={sortBy}
        onSelectCustomer={setSelectedCustomer}
      />
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </motion.div>
  );
}
