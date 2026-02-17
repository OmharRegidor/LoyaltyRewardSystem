// apps/web/app/api/dashboard/pos/inventory/receive/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createServiceClient,
} from "@/lib/supabase-server";
import { requireModule } from "@/lib/feature-gate";
import { receiveStock } from "@/lib/services/inventory.service";
import { z } from "zod";

const ReceiveStockSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  notes: z.string().max(1000).optional(),
});

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

async function getStaffInfo(
  userId: string,
): Promise<{ id: string; name: string }> {
  const supabase = createServiceClient();

  const { data: staff } = await supabase
    .from("staff")
    .select("id, name")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (staff) return { id: staff.id, name: staff.name };

  // Fallback: check if owner
  const { data: business } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("owner_id", userId)
    .maybeSingle();

  if (business) return { id: userId, name: business.name || "Owner" };

  return { id: userId, name: "Unknown" };
}

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

    await requireModule(businessId, "pos");

    const body = await request.json();
    const validation = ReceiveStockSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const staffInfo = await getStaffInfo(user.id);

    const movement = await receiveStock(
      businessId,
      validation.data.product_id,
      validation.data.quantity,
      staffInfo.id,
      staffInfo.name,
      validation.data.notes,
    );

    return NextResponse.json({ movement }, { status: 201 });
  } catch (error) {
    console.error("POST /api/dashboard/pos/inventory/receive error:", error);

    if (error instanceof Error && "code" in error) {
      const err = error as Error & { code: string };
      if (err.code === "MODULE_NOT_AVAILABLE") {
        return NextResponse.json(
          { error: "POS module not available. Upgrade to Enterprise plan." },
          { status: 403 },
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
