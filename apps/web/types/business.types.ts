// apps/web/types/business.types.ts

export const SERVICE_BUSINESS_TYPES = ['salon', 'barbershop', 'healthcare', 'hotel'] as const;
export const PRODUCT_BUSINESS_TYPES = ['retail', 'restaurant', 'rice_business'] as const;

export type ServiceBusinessType = (typeof SERVICE_BUSINESS_TYPES)[number];
export type ProductBusinessType = (typeof PRODUCT_BUSINESS_TYPES)[number];

export function isServiceBusiness(type: string | null): boolean {
  if (!type) return false;
  return (SERVICE_BUSINESS_TYPES as readonly string[]).includes(type);
}

export function isProductBusiness(type: string | null): boolean {
  if (!type) return false;
  return (PRODUCT_BUSINESS_TYPES as readonly string[]).includes(type);
}
