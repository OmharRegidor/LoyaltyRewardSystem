// apps/web/app/api/dashboard/pos/inventory/movements/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createServiceClient,
} from "@/lib/supabase-server";
import { requireModule } from "@/lib/feature-gate";
import { getStockMovements } from "@/lib/services/inventory.service";
import type { StockMovementType } from "@/types/pos.types";

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

const VALID_MOVEMENT_TYPES = ["sale", "void_restore", "receiving", "adjustment"];

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const product_id = searchParams.get("product_id") || undefined;
    const movement_type_raw = searchParams.get("movement_type") || undefined;
    const start_date = searchParams.get("start_date") || undefined;
    const end_date = searchParams.get("end_date") || undefined;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!, 10)
      : undefined;
    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset")!, 10)
      : undefined;

    const movement_type =
      movement_type_raw && VALID_MOVEMENT_TYPES.includes(movement_type_raw)
        ? (movement_type_raw as StockMovementType)
        : undefined;

    const movements = await getStockMovements(businessId, {
      product_id,
      movement_type,
      start_date,
      end_date,
      limit,
      offset,
    });

    return NextResponse.json({ movements });
  } catch (error) {
    console.error(
      "GET /api/dashboard/pos/inventory/movements error:",
      error,
    );

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
