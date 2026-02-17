// apps/web/app/api/dashboard/pos/seed/route.ts

import { NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createServiceClient,
} from "@/lib/supabase-server";
import { requireModule } from "@/lib/feature-gate";
import { createProduct, createSale } from "@/lib/services/pos.service";
import {
  receiveStock,
  adjustStock,
  restoreStockForVoid,
} from "@/lib/services/inventory.service";

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
// POST: Seed POS Demo Data
// ============================================

export async function POST() {
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

    // Safety check: only seed if business has 0 products
    const supabase = createServiceClient();
    const { count, error: countError } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId);

    if (countError) {
      console.error("Seed: count query failed:", countError);
      return NextResponse.json(
        { error: `Failed to check existing products: ${countError.message}` },
        { status: 500 },
      );
    }

    if (count && count > 0) {
      return NextResponse.json(
        {
          error:
            "Products already exist. Seed data can only be created for a business with no products.",
        },
        { status: 409 },
      );
    }

    // ============================================
    // Step 1: Create 6 products
    // ============================================

    const productDefinitions = [
      {
        name: "Rice Sack 25kg (Sinandomeng)",
        price: 1250,
        stock_quantity: 45,
        low_stock_threshold: 10,
        category: "Rice",
        is_active: true,
      },
      {
        name: "Rice Sack 25kg (Jasmine)",
        price: 1450,
        stock_quantity: 30,
        low_stock_threshold: 10,
        category: "Rice",
        is_active: true,
      },
      {
        name: "Rice Sack 50kg (Sinandomeng)",
        price: 2400,
        stock_quantity: 20,
        low_stock_threshold: 5,
        category: "Rice",
        is_active: true,
      },
      {
        name: "Rice Sack 5kg (Sinandomeng)",
        price: 280,
        stock_quantity: 80,
        low_stock_threshold: 20,
        category: "Rice - Retail",
        is_active: true,
      },
      {
        name: "Rice Sack 5kg (Jasmine)",
        price: 320,
        stock_quantity: 50, // Start with 50, will be adjusted to 0
        low_stock_threshold: 20,
        category: "Rice - Retail",
        is_active: true,
      },
      {
        name: "Empty Sack",
        price: 15,
        stock_quantity: 200,
        low_stock_threshold: 50,
        category: "Supplies",
        is_active: true,
      },
    ];

    const products = [];
    for (const def of productDefinitions) {
      const product = await createProduct(businessId, def);
      products.push(product);
    }

    // Product references by index
    const [rice25kgSin, rice25kgJas, rice50kgSin, rice5kgSin, rice5kgJas, emptySack] = products;

    // ============================================
    // Step 2: Receive stock for 2 products
    // ============================================

    await receiveStock(
      businessId,
      rice25kgSin.id,
      100,
      user.id,
      "Seed Script",
      "Supplier delivery - ABC Rice Mill",
    );

    await receiveStock(
      businessId,
      rice25kgJas.id,
      50,
      user.id,
      "Seed Script",
      "Supplier delivery - ABC Rice Mill",
    );

    // ============================================
    // Step 3: Adjust Rice 5kg Jasmine to 0
    // ============================================

    await adjustStock(
      businessId,
      rice5kgJas.id,
      0,
      "Physical count: all stock damaged by flood",
      user.id,
      "Seed Script",
    );

    // ============================================
    // Step 4: Create 3 completed sales
    // ============================================

    // Sale 1: 2x Rice 25kg Sinandomeng + 1x Rice 25kg Jasmine = ₱3,950 cash
    await createSale({
      business_id: businessId,
      items: [
        {
          product_id: rice25kgSin.id,
          name: rice25kgSin.name,
          quantity: 2,
          unit_price_centavos: rice25kgSin.price_centavos,
        },
        {
          product_id: rice25kgJas.id,
          name: rice25kgJas.name,
          quantity: 1,
          unit_price_centavos: rice25kgJas.price_centavos,
        },
      ],
      payment_method: "cash",
      amount_tendered_centavos: 400000, // ₱4,000
    });

    // Sale 2: 3x Rice 5kg Sinandomeng = ₱840 cash
    await createSale({
      business_id: businessId,
      items: [
        {
          product_id: rice5kgSin.id,
          name: rice5kgSin.name,
          quantity: 3,
          unit_price_centavos: rice5kgSin.price_centavos,
        },
      ],
      payment_method: "cash",
      amount_tendered_centavos: 100000, // ₱1,000
    });

    // Sale 3: 1x Rice 50kg Sinandomeng + 5x Empty Sack = ₱2,475 gcash
    await createSale({
      business_id: businessId,
      items: [
        {
          product_id: rice50kgSin.id,
          name: rice50kgSin.name,
          quantity: 1,
          unit_price_centavos: rice50kgSin.price_centavos,
        },
        {
          product_id: emptySack.id,
          name: emptySack.name,
          quantity: 5,
          unit_price_centavos: emptySack.price_centavos,
        },
      ],
      payment_method: "gcash",
    });

    // ============================================
    // Step 5: Create + void 1 sale
    // ============================================

    // Sale 4 (voided): 1x Rice 25kg Jasmine = ₱1,450 cash
    const voidedSale = await createSale({
      business_id: businessId,
      items: [
        {
          product_id: rice25kgJas.id,
          name: rice25kgJas.name,
          quantity: 1,
          unit_price_centavos: rice25kgJas.price_centavos,
        },
      ],
      payment_method: "cash",
      amount_tendered_centavos: 150000, // ₱1,500
    });

    // Void manually — voided_by references staff(id), and business owners
    // don't have a staff record, so we set it to null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("sales")
      .update({
        status: "voided",
        voided_at: new Date().toISOString(),
        voided_by: null,
        void_reason: "Wrong product entered",
      })
      .eq("id", voidedSale.id);

    // Restore stock for the voided sale
    await restoreStockForVoid(voidedSale.id, user.id, "Seed Script");

    // ============================================
    // Return summary
    // ============================================

    return NextResponse.json({
      success: true,
      summary: {
        products_created: products.length,
        sales_created: 4,
        sales_voided: 1,
        stock_receivings: 2,
        stock_adjustments: 1,
      },
    });
  } catch (error: unknown) {
    console.error("POST /api/dashboard/pos/seed error:", error);

    // Handle MODULE_NOT_AVAILABLE from requireModule
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "MODULE_NOT_AVAILABLE"
    ) {
      return NextResponse.json(
        { error: "POS module not available. Upgrade to Enterprise plan." },
        { status: 403 },
      );
    }

    // Extract error message from Error instances or Supabase PostgrestError objects
    let message = "Internal server error";
    if (error instanceof Error) {
      message = error.message;
    } else if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof (error as { message: unknown }).message === "string"
    ) {
      message = (error as { message: string }).message;
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
