// apps/web/lib/services/pos.service.ts

import { createServiceClient } from "@/lib/supabase-server";
import type {
  Product,
  ProductFormData,
  Sale,
  SaleWithItems,
  SaleItem,
  CreateSaleInput,
  VoidSaleInput,
  DailySummary,
  SalesFilter,
  PaymentMethod,
  SalesAnalytics,
  DailyRevenueDataPoint,
  TopProductItem,
} from "@/types/pos.types";

// ============================================
// PRODUCT FUNCTIONS
// ============================================

export async function getProducts(businessId: string): Promise<Product[]> {
  const supabase = createServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("products")
    .select("*")
    .eq("business_id", businessId)
    .order("sort_order")
    .order("name");

  if (error) {
    // Handle case where table doesn't exist yet (migration not run)
    if (error.code === "42P01" || error.message?.includes("does not exist")) {
      console.warn("Products table does not exist. Run migration first.");
      return [];
    }
    console.error("Error fetching products:", error);
    throw error;
  }

  return (data || []) as Product[];
}

export async function getActiveProducts(
  businessId: string,
): Promise<Product[]> {
  const supabase = createServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("products")
    .select("*")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("sort_order")
    .order("name");

  if (error) {
    if (error.code === "42P01" || error.message?.includes("does not exist")) {
      return [];
    }
    console.error("Error fetching active products:", error);
    throw error;
  }

  return (data || []) as Product[];
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = createServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "42P01" || error.message?.includes("does not exist")) {
      return null;
    }
    console.error("Error fetching product:", error);
    return null;
  }

  return data as Product;
}

export async function createProduct(
  businessId: string,
  input: ProductFormData,
): Promise<Product> {
  const supabase = createServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("products")
    .insert({
      business_id: businessId,
      name: input.name,
      description: input.description || null,
      price_centavos: Math.round(input.price * 100),
      category: input.category || null,
      sku: input.sku || null,
      image_url: input.image_url || null,
      is_active: input.is_active,
      sort_order: input.sort_order || 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating product:", error);
    throw error;
  }

  return data as Product;
}

export async function updateProduct(
  id: string,
  input: Partial<ProductFormData>,
): Promise<Product> {
  const supabase = createServiceClient();

  const updateData: Record<string, unknown> = {};

  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined)
    updateData.description = input.description || null;
  if (input.price !== undefined)
    updateData.price_centavos = Math.round(input.price * 100);
  if (input.category !== undefined)
    updateData.category = input.category || null;
  if (input.sku !== undefined) updateData.sku = input.sku || null;
  if (input.image_url !== undefined)
    updateData.image_url = input.image_url || null;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;
  if (input.sort_order !== undefined) updateData.sort_order = input.sort_order;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("products")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating product:", error);
    throw error;
  }

  return data as Product;
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = createServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
}

// ============================================
// SALE FUNCTIONS
// ============================================

interface Business {
  pesos_per_point: number | null;
  min_purchase_for_points: number | null;
  max_points_per_transaction: number | null;
}

function calculatePointsEarned(
  totalCentavos: number,
  business: Business,
): number {
  const totalPesos = totalCentavos / 100;
  const minPurchase = business.min_purchase_for_points || 0;
  const pesosPerPoint = business.pesos_per_point || 100;
  const maxPoints = business.max_points_per_transaction;

  if (totalPesos < minPurchase) return 0;

  const points = Math.floor(totalPesos / pesosPerPoint);

  if (maxPoints !== null && maxPoints !== undefined) {
    return Math.min(points, maxPoints);
  }

  return points;
}

export async function createSale(
  input: CreateSaleInput,
): Promise<SaleWithItems> {
  const supabase = createServiceClient();

  // Calculate totals
  const subtotal_centavos = input.items.reduce(
    (sum, item) => sum + item.unit_price_centavos * item.quantity,
    0,
  );
  const discount_centavos = input.discount_centavos || 0;
  const total_centavos = subtotal_centavos - discount_centavos;

  // Calculate change for cash payments
  let change_centavos: number | null = null;
  if (input.payment_method === "cash" && input.amount_tendered_centavos) {
    change_centavos = input.amount_tendered_centavos - total_centavos;
  }

  // Get business settings for points calculation
  let points_earned = 0;
  if (input.customer_id) {
    const { data: business } = await supabase
      .from("businesses")
      .select(
        "pesos_per_point, min_purchase_for_points, max_points_per_transaction",
      )
      .eq("id", input.business_id)
      .single();

    if (business) {
      points_earned = calculatePointsEarned(total_centavos, business);
    }
  }

  // Generate sale number using the database function (may not exist yet)
  let sale_number = `SALE-${Date.now()}`;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: saleNumberData } = await (supabase as any).rpc(
      "generate_sale_number",
      {
        p_business_id: input.business_id,
      },
    );
    if (saleNumberData) {
      sale_number = saleNumberData;
    }
  } catch {
    // Function may not exist yet, use fallback
  }

  // Create the sale
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sale, error: saleError } = await (supabase as any)
    .from("sales")
    .insert({
      business_id: input.business_id,
      branch_id: input.branch_id || null,
      customer_id: input.customer_id || null,
      staff_id: input.staff_id || null,
      sale_number,
      subtotal_centavos,
      discount_centavos,
      discount_type: input.discount_type || null,
      discount_reason: input.discount_reason || null,
      total_centavos,
      payment_method: input.payment_method,
      payment_reference: input.payment_reference || null,
      amount_tendered_centavos: input.amount_tendered_centavos || null,
      change_centavos,
      points_earned,
      notes: input.notes || null,
      status: "completed",
    })
    .select()
    .single();

  if (saleError || !sale) {
    console.error("Error creating sale:", saleError);
    throw saleError || new Error("Failed to create sale");
  }

  // Create sale items
  const itemsToInsert = input.items.map((item) => ({
    sale_id: sale.id,
    product_id: item.product_id || null,
    name: item.name,
    description: item.description || null,
    quantity: item.quantity,
    unit_price_centavos: item.unit_price_centavos,
    total_centavos: item.unit_price_centavos * item.quantity,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: items, error: itemsError } = await (supabase as any)
    .from("sale_items")
    .insert(itemsToInsert)
    .select();

  if (itemsError) {
    console.error("Error creating sale items:", itemsError);
    // Sale was created but items failed - log but don't throw
  }

  // Award points to customer if applicable
  if (input.customer_id && points_earned > 0) {
    // Use RPC to add points
    await supabase.rpc("add_customer_points", {
      p_customer_id: input.customer_id,
      p_points: points_earned,
    });

    // Create transaction record
    await supabase.from("transactions").insert({
      customer_id: input.customer_id,
      business_id: input.business_id,
      type: "earn",
      points: points_earned,
      description: `POS Sale #${sale_number}`,
      amount_spent: total_centavos / 100,
    });
  }

  return {
    ...sale,
    items: (items || []) as SaleItem[],
  } as SaleWithItems;
}

export async function getSales(
  businessId: string,
  filter?: SalesFilter,
): Promise<Sale[]> {
  const supabase = createServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("sales")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (filter?.start_date) {
    query = query.gte("created_at", filter.start_date);
  }
  if (filter?.end_date) {
    query = query.lte("created_at", filter.end_date);
  }
  if (filter?.payment_method) {
    query = query.eq("payment_method", filter.payment_method);
  }
  if (filter?.status) {
    query = query.eq("status", filter.status);
  }
  if (filter?.customer_id) {
    query = query.eq("customer_id", filter.customer_id);
  }
  if (filter?.staff_id) {
    query = query.eq("staff_id", filter.staff_id);
  }
  if (filter?.limit) {
    query = query.limit(filter.limit);
  }
  if (filter?.offset) {
    query = query.range(
      filter.offset,
      filter.offset + (filter.limit || 50) - 1,
    );
  }

  const { data, error } = await query;

  if (error) {
    if (error.code === "42P01" || error.message?.includes("does not exist")) {
      return [];
    }
    console.error("Error fetching sales:", error);
    throw error;
  }

  return (data || []) as Sale[];
}

export async function getSaleById(id: string): Promise<SaleWithItems | null> {
  const supabase = createServiceClient();

  // Get sale
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sale, error: saleError } = await (supabase as any)
    .from("sales")
    .select("*")
    .eq("id", id)
    .single();

  if (saleError || !sale) {
    if (
      saleError?.code === "42P01" ||
      saleError?.message?.includes("does not exist")
    ) {
      return null;
    }
    console.error("Error fetching sale:", saleError);
    return null;
  }

  // Get sale items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: items } = await (supabase as any)
    .from("sale_items")
    .select("*")
    .eq("sale_id", id)
    .order("created_at");

  // Get customer if linked
  let customer = null;
  if (sale.customer_id) {
    const { data: customerData } = await supabase
      .from("customers")
      .select("id, full_name, phone, total_points, tier")
      .eq("id", sale.customer_id)
      .single();
    customer = customerData;
  }

  // Get staff if linked
  let staff = null;
  if (sale.staff_id) {
    const { data: staffData } = await supabase
      .from("staff")
      .select("id, name")
      .eq("id", sale.staff_id)
      .single();
    staff = staffData;
  }

  return {
    ...sale,
    items: (items || []) as SaleItem[],
    customer,
    staff,
  } as SaleWithItems;
}

export async function voidSale(input: VoidSaleInput): Promise<Sale> {
  const supabase = createServiceClient();

  // Get the sale first to check if it can be voided
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingSale, error: fetchError } = await (supabase as any)
    .from("sales")
    .select("*, customer_id, points_earned, business_id, sale_number")
    .eq("id", input.sale_id)
    .single();

  if (fetchError || !existingSale) {
    throw new Error("Sale not found");
  }

  if (existingSale.status === "voided") {
    throw new Error("Sale is already voided");
  }

  // Void the sale
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sale, error: voidError } = await (supabase as any)
    .from("sales")
    .update({
      status: "voided",
      voided_at: new Date().toISOString(),
      voided_by: input.voided_by,
      void_reason: input.void_reason,
    })
    .eq("id", input.sale_id)
    .select()
    .single();

  if (voidError || !sale) {
    console.error("Error voiding sale:", voidError);
    throw voidError || new Error("Failed to void sale");
  }

  // Reverse points if customer was linked and points were earned
  if (existingSale.customer_id && existingSale.points_earned > 0) {
    await supabase.rpc("deduct_customer_points", {
      p_customer_id: existingSale.customer_id,
      p_points: existingSale.points_earned,
    });

    // Create reversal transaction
    await supabase.from("transactions").insert({
      customer_id: existingSale.customer_id,
      business_id: existingSale.business_id,
      type: "redeem",
      points: existingSale.points_earned,
      description: `Voided Sale #${existingSale.sale_number}`,
    });
  }

  return sale as Sale;
}

export async function getDailySummary(
  businessId: string,
  date?: string,
): Promise<DailySummary> {
  const supabase = createServiceClient();

  const targetDate = date || new Date().toISOString().split("T")[0];
  const startOfDay = `${targetDate}T00:00:00.000Z`;
  const endOfDay = `${targetDate}T23:59:59.999Z`;

  // Get all sales for the day
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sales, error } = await (supabase as any)
    .from("sales")
    .select("*")
    .eq("business_id", businessId)
    .gte("created_at", startOfDay)
    .lte("created_at", endOfDay);

  if (error) {
    if (error.code === "42P01" || error.message?.includes("does not exist")) {
      return {
        date: targetDate,
        total_sales: 0,
        total_revenue_centavos: 0,
        total_items_sold: 0,
        total_discounts_centavos: 0,
        total_points_earned: 0,
        payment_breakdown: { cash: 0 },
        voided_count: 0,
      };
    }
    console.error("Error fetching daily summary:", error);
    throw error;
  }

  const salesData = (sales || []) as Sale[];

  // Calculate summary
  const completedSales = salesData.filter((s) => s.status === "completed");
  const voidedSales = salesData.filter((s) => s.status === "voided");

  const total_revenue_centavos = completedSales.reduce(
    (sum, s) => sum + s.total_centavos,
    0,
  );
  const total_discounts_centavos = completedSales.reduce(
    (sum, s) => sum + s.discount_centavos,
    0,
  );
  const total_points_earned = completedSales.reduce(
    (sum, s) => sum + s.points_earned,
    0,
  );

  // Payment breakdown (cash-only)
  const payment_breakdown = {
    cash: completedSales.reduce((sum, s) => sum + s.total_centavos, 0),
  };

  // Get total items sold
  const saleIds = completedSales.map((s) => s.id);
  let total_items_sold = 0;

  if (saleIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: items } = await (supabase as any)
      .from("sale_items")
      .select("quantity")
      .in("sale_id", saleIds);

    total_items_sold = (items || []).reduce(
      (sum: number, item: { quantity: number }) => sum + item.quantity,
      0,
    );
  }

  return {
    date: targetDate,
    total_sales: completedSales.length,
    total_revenue_centavos,
    total_items_sold,
    total_discounts_centavos,
    total_points_earned,
    payment_breakdown,
    voided_count: voidedSales.length,
  };
}

// ============================================
// CUSTOMER LOOKUP (uses existing service)
// ============================================

export async function lookupCustomerByPhone(
  businessId: string,
  phone: string,
): Promise<{
  id: string;
  fullName: string;
  phone: string;
  totalPoints: number;
  tier: string;
} | null> {
  const supabase = createServiceClient();
  const normalizedPhone = phone.replace(/\s+/g, "");

  const { data, error } = await supabase
    .from("customers")
    .select("id, full_name, phone, total_points, tier")
    .eq("phone", normalizedPhone)
    .eq("created_by_business_id", businessId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    fullName: data.full_name || "",
    phone: data.phone || "",
    totalPoints: data.total_points || 0,
    tier: data.tier || "bronze",
  };
}

// ============================================
// ANALYTICS FUNCTIONS
// ============================================

export async function getSalesAnalytics(
  businessId: string,
  startDate: string,
  endDate: string,
): Promise<SalesAnalytics> {
  const supabase = createServiceClient();

  // Get all completed sales in the date range
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sales, error } = await (supabase as any)
    .from("sales")
    .select("*")
    .eq("business_id", businessId)
    .eq("status", "completed")
    .gte("created_at", `${startDate}T00:00:00.000Z`)
    .lte("created_at", `${endDate}T23:59:59.999Z`);

  if (error) {
    if (error.code === "42P01" || error.message?.includes("does not exist")) {
      return {
        period: { start_date: startDate, end_date: endDate },
        totals: {
          revenue_centavos: 0,
          transactions: 0,
          items_sold: 0,
          avg_order_value_centavos: 0,
        },
        daily_revenue: [],
        top_products: [],
      };
    }
    console.error("Error fetching sales analytics:", error);
    throw error;
  }

  const salesData = (sales || []) as Sale[];

  // Calculate totals
  const totalRevenue = salesData.reduce((sum, s) => sum + s.total_centavos, 0);
  const totalTransactions = salesData.length;

  // Get all sale items for these sales
  const saleIds = salesData.map((s) => s.id);
  let totalItemsSold = 0;
  const productAggregation: Record<
    string,
    { name: string; quantity: number; revenue: number }
  > = {};

  if (saleIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: items } = await (supabase as any)
      .from("sale_items")
      .select("product_id, name, quantity, total_centavos")
      .in("sale_id", saleIds);

    if (items) {
      items.forEach(
        (item: {
          product_id: string | null;
          name: string;
          quantity: number;
          total_centavos: number;
        }) => {
          totalItemsSold += item.quantity;

          const key = item.product_id || item.name;
          if (!productAggregation[key]) {
            productAggregation[key] = {
              name: item.name,
              quantity: 0,
              revenue: 0,
            };
          }
          productAggregation[key].quantity += item.quantity;
          productAggregation[key].revenue += item.total_centavos;
        },
      );
    }
  }

  // Calculate average order value
  const avgOrderValue =
    totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;

  // Group sales by date for daily revenue
  const dailyRevenue: Record<
    string,
    { revenue: number; transactions: number }
  > = {};
  salesData.forEach((sale) => {
    const date = sale.created_at.split("T")[0];
    if (!dailyRevenue[date]) {
      dailyRevenue[date] = { revenue: 0, transactions: 0 };
    }
    dailyRevenue[date].revenue += sale.total_centavos;
    dailyRevenue[date].transactions += 1;
  });

  const dailyRevenueData: DailyRevenueDataPoint[] = Object.entries(dailyRevenue)
    .map(([date, data]) => ({
      date,
      revenue_centavos: data.revenue,
      transactions: data.transactions,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Get top products by quantity
  const topProducts: TopProductItem[] = Object.entries(productAggregation)
    .map(([key, data]) => ({
      product_id: key.startsWith("temp-") ? null : key,
      name: data.name,
      quantity: data.quantity,
      revenue_centavos: data.revenue,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  return {
    period: { start_date: startDate, end_date: endDate },
    totals: {
      revenue_centavos: totalRevenue,
      transactions: totalTransactions,
      items_sold: totalItemsSold,
      avg_order_value_centavos: avgOrderValue,
    },
    daily_revenue: dailyRevenueData,
    top_products: topProducts,
  };
}
