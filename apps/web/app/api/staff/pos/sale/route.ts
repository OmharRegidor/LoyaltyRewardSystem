// apps/web/app/api/staff/pos/sale/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { createStaffSale } from "@/lib/services/pos.service";
import { z } from "zod";
import type { TierKey } from "@/types/staff-pos.types";

// ============================================
// VALIDATION SCHEMA
// ============================================

const SaleItemSchema = z.object({
  product_id: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  quantity: z.number().int().positive(),
  unit_price_centavos: z.number().int().nonnegative(),
});

const StaffSaleSchema = z.object({
  customer_id: z.string().uuid(),
  items: z.array(SaleItemSchema).min(1),
  discount_type: z.enum(["percentage", "fixed"]).optional(),
  discount_centavos: z.number().int().nonnegative().optional(),
  discount_reason: z.string().max(500).optional(),
  exchange_points: z.number().int().nonnegative().optional(),
  tier: z.enum(["bronze", "silver", "gold", "platinum"]),
});

// ============================================
// HELPER: Verify Staff and Get Business
// ============================================

async function verifyStaffAndGetBusiness(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
) {
  // Check if user is staff
  const { data: staffRecord } = await supabase
    .from("staff")
    .select("id, business_id, role, name, is_active")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (staffRecord) {
    return {
      staffId: staffRecord.id,
      staffName: staffRecord.name || "Staff",
      businessId: staffRecord.business_id,
    };
  }

  // Check if user is business owner
  const { data: business } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("owner_id", userId)
    .maybeSingle();

  if (business) {
    return {
      staffId: userId,
      staffName: "Owner",
      businessId: business.id,
    };
  }

  return null;
}

// ============================================
// POST: Create Staff POS Sale
// ============================================

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate via Authorization header (bypasses stale cookies)
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = createServiceClient();
    const {
      data: { user },
      error: authError,
    } = await serviceClient.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Verify staff/owner
    const staffInfo = await verifyStaffAndGetBusiness(serviceClient, user.id);

    if (!staffInfo) {
      return NextResponse.json(
        { error: "Not authorized as staff or business owner" },
        { status: 403 },
      );
    }

    // 3. Validate input
    const body = await request.json();
    const validation = StaffSaleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    // 4. Create the sale
    const result = await createStaffSale(
      staffInfo.businessId,
      staffInfo.staffId,
      staffInfo.staffName,
      {
        ...validation.data,
        tier: validation.data.tier as TierKey,
      },
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("POST /api/staff/pos/sale error:", error);

    if (error instanceof Error) {
      if (error.message === "Insufficient points for exchange") {
        return NextResponse.json(
          { error: "Insufficient points for exchange" },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
