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

  // Clear created_by_business_id for customers that belong to this business
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
