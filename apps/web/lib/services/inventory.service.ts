// apps/web/lib/services/inventory.service.ts

import { createServiceClient } from "@/lib/supabase-server";
import type {
  Product,
  StockMovement,
  StockMovementWithProduct,
  StockMovementFilter,
  InventorySummary,
  SaleItemInput,
} from "@/types/pos.types";

// ============================================
// PRODUCT STOCK QUERIES
// ============================================

export async function getProductsWithStock(
  businessId: string,
): Promise<Product[]> {
  const supabase = createServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("products")
    .select("*")
    .eq("business_id", businessId)
    .order("stock_quantity", { ascending: true })
    .order("name");

  if (error) {
    if (error.code === "42P01" || error.message?.includes("does not exist")) {
      return [];
    }
    console.error("Error fetching products with stock:", error);
    throw error;
  }

  return (data || []) as Product[];
}

// ============================================
// STOCK OPERATIONS
// ============================================

export async function receiveStock(
  businessId: string,
  productId: string,
  quantity: number,
  performedBy: string,
  performerName: string,
  notes?: string,
): Promise<StockMovement> {
  const supabase = createServiceClient();

  // Get current stock
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: product, error: productError } = await (supabase as any)
    .from("products")
    .select("stock_quantity")
    .eq("id", productId)
    .eq("business_id", businessId)
    .single();

  if (productError || !product) {
    throw new Error("Product not found");
  }

  const stockBefore = product.stock_quantity;
  const stockAfter = stockBefore + quantity;

  // Update product stock
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from("products")
    .update({ stock_quantity: stockAfter })
    .eq("id", productId);

  if (updateError) {
    console.error("Error updating product stock:", updateError);
    throw updateError;
  }

  // Create movement record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: movement, error: movementError } = await (supabase as any)
    .from("stock_movements")
    .insert({
      business_id: businessId,
      product_id: productId,
      movement_type: "receiving",
      quantity,
      stock_before: stockBefore,
      stock_after: stockAfter,
      performed_by: performedBy,
      performer_name: performerName,
      notes: notes || null,
    })
    .select()
    .single();

  if (movementError) {
    console.error("Error creating stock movement:", movementError);
    throw movementError;
  }

  return movement as StockMovement;
}

export async function adjustStock(
  businessId: string,
  productId: string,
  newQuantity: number,
  reason: string,
  performedBy: string,
  performerName: string,
): Promise<StockMovement> {
  const supabase = createServiceClient();

  // Get current stock
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: product, error: productError } = await (supabase as any)
    .from("products")
    .select("stock_quantity")
    .eq("id", productId)
    .eq("business_id", businessId)
    .single();

  if (productError || !product) {
    throw new Error("Product not found");
  }

  const stockBefore = product.stock_quantity;
  const quantityChange = newQuantity - stockBefore;

  // Update product stock
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from("products")
    .update({ stock_quantity: newQuantity })
    .eq("id", productId);

  if (updateError) {
    console.error("Error updating product stock:", updateError);
    throw updateError;
  }

  // Create movement record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: movement, error: movementError } = await (supabase as any)
    .from("stock_movements")
    .insert({
      business_id: businessId,
      product_id: productId,
      movement_type: "adjustment",
      quantity: quantityChange,
      stock_before: stockBefore,
      stock_after: newQuantity,
      performed_by: performedBy,
      performer_name: performerName,
      reason,
    })
    .select()
    .single();

  if (movementError) {
    console.error("Error creating stock movement:", movementError);
    throw movementError;
  }

  return movement as StockMovement;
}

export async function deductStockForSale(
  businessId: string,
  items: SaleItemInput[],
  saleId: string,
  performedBy: string,
  performerName: string,
): Promise<void> {
  const supabase = createServiceClient();

  for (const item of items) {
    if (!item.product_id) continue;

    // Get current stock
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: product } = await (supabase as any)
      .from("products")
      .select("stock_quantity")
      .eq("id", item.product_id)
      .eq("business_id", businessId)
      .single();

    if (!product) continue;

    const stockBefore = product.stock_quantity;
    const stockAfter = stockBefore - item.quantity;

    // Update product stock (allow negative)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("products")
      .update({ stock_quantity: stockAfter })
      .eq("id", item.product_id);

    // Create movement record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("stock_movements").insert({
      business_id: businessId,
      product_id: item.product_id,
      movement_type: "sale",
      quantity: -item.quantity,
      stock_before: stockBefore,
      stock_after: stockAfter,
      performed_by: performedBy,
      performer_name: performerName,
      reference_id: saleId,
    });
  }
}

export async function restoreStockForVoid(
  saleId: string,
  performedBy: string,
  performerName: string,
): Promise<void> {
  const supabase = createServiceClient();

  // Get sale items for this sale
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: saleItems } = await (supabase as any)
    .from("sale_items")
    .select("product_id, quantity")
    .eq("sale_id", saleId);

  if (!saleItems || saleItems.length === 0) return;

  // Get the business_id from the sale
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sale } = await (supabase as any)
    .from("sales")
    .select("business_id")
    .eq("id", saleId)
    .single();

  if (!sale) return;

  for (const item of saleItems as { product_id: string | null; quantity: number }[]) {
    if (!item.product_id) continue;

    // Get current stock
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: product } = await (supabase as any)
      .from("products")
      .select("stock_quantity")
      .eq("id", item.product_id)
      .single();

    if (!product) continue;

    const stockBefore = product.stock_quantity;
    const stockAfter = stockBefore + item.quantity;

    // Restore stock
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("products")
      .update({ stock_quantity: stockAfter })
      .eq("id", item.product_id);

    // Create movement record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("stock_movements").insert({
      business_id: sale.business_id,
      product_id: item.product_id,
      movement_type: "void_restore",
      quantity: item.quantity,
      stock_before: stockBefore,
      stock_after: stockAfter,
      performed_by: performedBy,
      performer_name: performerName,
      reference_id: saleId,
    });
  }
}

// ============================================
// STOCK MOVEMENT QUERIES
// ============================================

export async function getStockMovements(
  businessId: string,
  filter?: StockMovementFilter,
): Promise<StockMovementWithProduct[]> {
  const supabase = createServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("stock_movements")
    .select("*, products(name)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (filter?.product_id) {
    query = query.eq("product_id", filter.product_id);
  }
  if (filter?.movement_type) {
    query = query.eq("movement_type", filter.movement_type);
  }
  if (filter?.start_date) {
    query = query.gte("created_at", filter.start_date);
  }
  if (filter?.end_date) {
    query = query.lte("created_at", filter.end_date);
  }

  const limit = filter?.limit || 50;
  const offset = filter?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    if (error.code === "42P01" || error.message?.includes("does not exist")) {
      return [];
    }
    console.error("Error fetching stock movements:", error);
    throw error;
  }

  // Map the joined product name
  return ((data || []) as (StockMovement & { products: { name: string } | null })[]).map(
    (movement) => ({
      ...movement,
      product_name: movement.products?.name || "Unknown Product",
      products: undefined,
    }),
  ) as StockMovementWithProduct[];
}

// ============================================
// INVENTORY SUMMARY
// ============================================

export async function getInventorySummary(
  businessId: string,
): Promise<InventorySummary> {
  const supabase = createServiceClient();

  // Get all products
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: products, error: productsError } = await (supabase as any)
    .from("products")
    .select("stock_quantity, low_stock_threshold")
    .eq("business_id", businessId);

  if (productsError) {
    if (
      productsError.code === "42P01" ||
      productsError.message?.includes("does not exist")
    ) {
      return {
        total_products: 0,
        low_stock_count: 0,
        out_of_stock_count: 0,
        recent_movements: [],
      };
    }
    throw productsError;
  }

  const productsList = (products || []) as {
    stock_quantity: number;
    low_stock_threshold: number;
  }[];

  const total_products = productsList.length;
  const low_stock_count = productsList.filter(
    (p) => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold,
  ).length;
  const out_of_stock_count = productsList.filter(
    (p) => p.stock_quantity <= 0,
  ).length;

  // Get recent 10 movements
  const recent_movements = await getStockMovements(businessId, { limit: 10 });

  return {
    total_products,
    low_stock_count,
    out_of_stock_count,
    recent_movements,
  };
}
