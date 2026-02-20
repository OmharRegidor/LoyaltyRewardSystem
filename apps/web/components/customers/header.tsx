// apps/web/components/customers/header.tsx

'use client';

import { Search, Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

interface CustomersHeaderProps {
  onSearchChange: (value: string) => void;
  onAddCustomer: () => void;
}

export function CustomersHeader({
  onSearchChange,
  onAddCustomer,
}: CustomersHeaderProps) {
  return (
    <motion.div
      className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-500 mt-1">Manage and view all your customers</p>
      </div>

      <div className="flex gap-3 w-full sm:w-auto">
        <div className="relative flex-1 sm:flex-none sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
          <Input
            placeholder="Search customers..."
            className="pl-10"
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Button
          className="bg-primary text-primary-foreground gap-2"
          onClick={onAddCustomer}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Customer</span>
        </Button>
      </div>
    </motion.div>
  );
}
