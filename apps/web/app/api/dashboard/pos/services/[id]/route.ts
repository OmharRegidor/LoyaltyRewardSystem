// apps/web/app/api/dashboard/pos/services/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createServiceClient,
} from "@/lib/supabase-server";
import { requireModule } from "@/lib/feature-gate";
import {
  getServiceById,
  updateService,
  deleteService,
} from "@/lib/services/service-catalog.service";
import { z } from "zod";

// ============================================
// VALIDATION SCHEMAS
// ============================================

const UpdateServiceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  price: z.number().nonnegative().optional(),
  pricing_type: z.enum(["fixed", "per_hour", "per_session", "per_person", "per_night", "per_day", "starting_at"]).optional(),
  duration_minutes: z.number().int().positive().optional(),
  duration_unit: z.enum(["minutes", "hours", "days", "nights"]).optional(),
  category: z.string().max(100).optional(),
  image_url: z
    .string()
    .url()
    .nullable()
    .optional()
    .transform((val) => val ?? undefined),
  is_active: z.boolean().optional(),
  max_guests: z.number().int().positive().nullable().optional().transform((val) => val ?? undefined),
  allow_staff_selection: z.boolean().optional(),
  staff_ids: z.array(z.string().uuid()).optional(),
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
// GET: Get Single Service
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
        { status: 404 }
      );
    }

    await requireModule(businessId, "pos");

    const service = await getServiceById(id);

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    if (service.business_id !== businessId) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error("GET /api/dashboard/pos/services/[id] error:", error);

    if (error instanceof Error && "code" in error) {
      const err = error as Error & { code: string };
      if (err.code === "MODULE_NOT_AVAILABLE") {
        return NextResponse.json(
          { error: "POS module not available. Upgrade to Enterprise plan." },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================
// PUT: Update Service
// ============================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
        { status: 404 }
      );
    }

    await requireModule(businessId, "pos");

    const existingService = await getServiceById(id);
    if (!existingService || existingService.business_id !== businessId) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const body = await request.json();
    const validation = UpdateServiceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const service = await updateService(id, validation.data);

    return NextResponse.json({ service });
  } catch (error) {
    console.error("PUT /api/dashboard/pos/services/[id] error:", error);

    if (error instanceof Error && "code" in error) {
      const err = error as Error & { code: string };
      if (err.code === "MODULE_NOT_AVAILABLE") {
        return NextResponse.json(
          { error: "POS module not available. Upgrade to Enterprise plan." },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE: Delete Service
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
        { status: 404 }
      );
    }

    await requireModule(businessId, "pos");

    const existingService = await getServiceById(id);
    if (!existingService || existingService.business_id !== businessId) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    await deleteService(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/dashboard/pos/services/[id] error:", error);

    if (error instanceof Error && "code" in error) {
      const err = error as Error & { code: string };
      if (err.code === "MODULE_NOT_AVAILABLE") {
        return NextResponse.json(
          { error: "POS module not available. Upgrade to Enterprise plan." },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
