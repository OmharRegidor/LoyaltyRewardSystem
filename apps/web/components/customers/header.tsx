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
        <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">Customers</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage and view all your customers</p>
      </div>

      <div className="flex gap-3 w-full sm:w-auto">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            className="h-11 rounded-xl pl-10"
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Button
          size="sm"
          className="bg-primary text-primary-foreground gap-2 rounded-xl h-11 px-4"
          onClick={onAddCustomer}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Customer</span>
        </Button>
      </div>
    </motion.div>
  );
}
