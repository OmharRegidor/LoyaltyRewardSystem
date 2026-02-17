// apps/web/app/api/dashboard/pos/inventory/route.ts

import { NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createServiceClient,
} from "@/lib/supabase-server";
import { requireModule } from "@/lib/feature-gate";
import {
  getProductsWithStock,
  getInventorySummary,
} from "@/lib/services/inventory.service";

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

export async function GET() {
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

    const [products, summary] = await Promise.all([
      getProductsWithStock(businessId),
      getInventorySummary(businessId),
    ]);

    return NextResponse.json({ products, summary });
  } catch (error) {
    console.error("GET /api/dashboard/pos/inventory error:", error);

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
