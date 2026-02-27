// apps/web/lib/services/customer.service.ts

import { createServiceClient } from "@/lib/supabase-server";

// ============================================
// TYPES
// ============================================

interface UnlinkResult {
  removedCount: number;
}

// ============================================
// UNLINK CUSTOMERS FROM BUSINESS
// ============================================

/**
 * Removes customers from a business by:
 * 1. Clearing `created_by_business_id` on the customers table (if it matches this business)
 * 2. Does NOT delete the customer account itself
 */
export async function unlinkCustomersFromBusiness(
  customerIds: string[],
  businessId: string,
): Promise<UnlinkResult> {
  const supabase = createServiceClient();

  // 1. Remove from customer_businesses junction table
  const { error: cbError } = await supabase
    .from("customer_businesses")
    .delete()
    .in("customer_id", customerIds)
    .eq("business_id", businessId);

  if (cbError) {
    console.error("Error removing customer_businesses links:", cbError);
    throw cbError;
  }

  // 2. Clear created_by_business_id on customers table (if it matches this business)
  const { error, count } = await supabase
    .from("customers")
    .update({ created_by_business_id: null })
    .in("id", customerIds)
    .eq("created_by_business_id", businessId);

  if (error) {
    console.error("Error unlinking customers:", error);
    throw error;
  }

  return { removedCount: count ?? customerIds.length };
}
