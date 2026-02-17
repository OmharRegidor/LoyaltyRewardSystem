// apps/web/app/api/dashboard/pos/products/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createServiceClient,
} from "@/lib/supabase-server";
import { requireModule } from "@/lib/feature-gate";
import {
  getProductById,
  updateProduct,
  deleteProduct,
} from "@/lib/services/pos.service";
import { z } from "zod";

// ============================================
// VALIDATION SCHEMAS
// ============================================

const UpdateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  price: z.number().positive().optional(), // In pesos
  category: z.string().max(100).optional(),
  sku: z.string().max(50).optional(),
  image_url: z
    .string()
    .url()
    .nullable()
    .optional()
    .transform((val) => val ?? undefined),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().nonnegative().optional(),
  low_stock_threshold: z.number().int().nonnegative().optional(),
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
// GET: Get Single Product
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

    // Check POS module access
    await requireModule(businessId, "pos");

    const product = await getProductById(id);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Verify product belongs to this business
    if (product.business_id !== businessId) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("GET /api/dashboard/pos/products/[id] error:", error);

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
// PUT: Update Product
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

    // Check POS module access
    await requireModule(businessId, "pos");

    // Verify product exists and belongs to this business
    const existingProduct = await getProductById(id);
    if (!existingProduct || existingProduct.business_id !== businessId) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Parse and validate input
    const body = await request.json();
    const validation = UpdateProductSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const product = await updateProduct(id, validation.data);

    return NextResponse.json({ product });
  } catch (error) {
    console.error("PUT /api/dashboard/pos/products/[id] error:", error);

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
// DELETE: Delete Product
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

    // Check POS module access
    await requireModule(businessId, "pos");

    // Verify product exists and belongs to this business
    const existingProduct = await getProductById(id);
    if (!existingProduct || existingProduct.business_id !== businessId) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await deleteProduct(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/dashboard/pos/products/[id] error:", error);

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
