// apps/web/hooks/useBusinessType.ts

import { isServiceBusiness, isProductBusiness } from "@/types/business.types";
import { useCachedFetch } from "./useCachedFetch";

interface BusinessTypeResponse {
  business_type: string | null;
}

interface UseBusinessTypeReturn {
  businessType: string | null;
  isService: boolean;
  isProduct: boolean;
  isHybrid: boolean;
  isLoading: boolean;
}

export function useBusinessType(): UseBusinessTypeReturn {
  const { data, isLoading } = useCachedFetch<BusinessTypeResponse>(
    "/api/dashboard/pos/business-type",
    { maxAge: 60_000 } // Cache for 60s — business type rarely changes
  );

  const businessType = data?.business_type ?? null;
  const isService = isServiceBusiness(businessType);
  const isProduct = isProductBusiness(businessType);
  const isHybrid = !isService && !isProduct;

  return {
    businessType,
    isService,
    isProduct,
    isHybrid,
    isLoading,
  };
}
