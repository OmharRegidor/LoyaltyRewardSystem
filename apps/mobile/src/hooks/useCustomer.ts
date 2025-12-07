// src/hooks/useCustomer.ts

import { useCallback, useState } from 'react';
import { useAuth } from './useAuth';
import { customerService } from '../services/customer.service';
import type { Customer } from '../types/database.types';

export function useCustomer() {
  const { customer, refreshCustomer } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateCustomer = useCallback(
    async (updates: Partial<Customer>) => {
      if (!customer) return;

      setIsUpdating(true);
      setError(null);

      try {
        // Implement update logic here if needed
        await refreshCustomer();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Update failed'));
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [customer, refreshCustomer]
  );

  return {
    customer,
    qrCodeUrl: customer?.qr_code_url ?? null,
    points: customer?.total_points ?? 0,
    lastVisit: customer?.last_visit ?? null,
    refreshCustomer,
  };
}
