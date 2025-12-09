// src/hooks/useCustomer.ts

import { useAuth } from './useAuth';

export function useCustomer() {
  const { customer, refreshCustomer } = useAuth();

  return {
    customer,
    qrCodeUrl: customer?.qr_code_url ?? null,
    points: customer?.total_points ?? 0,
    lastVisit: customer?.last_visit ?? null,
    refreshCustomer,
  };
}
