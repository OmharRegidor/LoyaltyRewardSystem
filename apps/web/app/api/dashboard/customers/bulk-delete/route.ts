// apps/web/app/api/dashboard/customers/bulk-delete/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createServiceClient,
} from "@/lib/supabase-server";
import { unlinkCustomersFromBusiness } from "@/lib/services/customer.service";
import { z } from "zod";

// ============================================
// VALIDATION SCHEMA
// ============================================

const BulkDeleteSchema = z.object({
  customerIds: z.array(z.string().uuid()).min(1).max(100),
});

// ============================================
// HELPER: Get Business ID
// ============================================

async function getBusinessId(userId: string): Promise<string | null> {
  const supabase = createServiceClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();

  if (business) return business.id;

  const { data: staff } = await supabase
    .from("staff")
    .select("business_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  return staff?.business_id || null;
}

// ============================================
// POST: Bulk Remove Customers
// ============================================

export async function POST(request: NextRequest) {
  try {
    const serverSupabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await serverSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessId = await getBusinessId(user.id);
    if (!businessId) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    // Parse and validate input
    const body = await request.json();
    const validation = BulkDeleteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { removedCount } = await unlinkCustomersFromBusiness(
      validation.data.customerIds,
      businessId,
    );

    return NextResponse.json({ success: true, count: removedCount });
  } catch (error) {
    console.error("POST /api/dashboard/customers/bulk-delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
