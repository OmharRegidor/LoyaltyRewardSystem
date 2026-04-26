// apps/web/hooks/useBusinessType.ts

import { isServiceBusiness, isProductBusiness } from "@/types/business.types";
import { useCachedFetch } from "./useCachedFetch";

interface BusinessTypeResponse {
  business_type: string | null;
  pos_mode: string | null;
}

interface UseBusinessTypeReturn {
  businessType: string | null;
  posMode: string | null;
  isService: boolean;
  isProduct: boolean;
  isHybrid: boolean;
  isLoading: boolean;
}

export function useBusinessType(): UseBusinessTypeReturn {
  const { data, isLoading } = useCachedFetch<BusinessTypeResponse>(
    "/api/dashboard/pos/business-type",
    { maxAge: 60_000 }
  );

  const businessType = data?.business_type ?? null;
  const posMode = data?.pos_mode ?? null;

  // pos_mode takes priority; fall back to business_type derivation
  let isService: boolean;
  let isProduct: boolean;
  let isHybrid: boolean;

  if (posMode) {
    isService = posMode === 'services';
    isProduct = posMode === 'products';
    isHybrid = posMode === 'both';
  } else {
    // Backward compat: derive from business_type
    isService = isServiceBusiness(businessType);
    isProduct = isProductBusiness(businessType);
    isHybrid = !isService && !isProduct;
  }

  return {
    businessType,
    posMode,
    isService,
    isProduct,
    isHybrid,
    isLoading,
  };
}
