// apps/web/lib/services/service-catalog.service.ts

import { createServiceClient } from "@/lib/supabase-server";
import type { Service, ServiceFormData } from "@/types/service.types";

// ============================================
// SERVICE FUNCTIONS
// ============================================

export async function getServices(businessId: string): Promise<Service[]> {
  const supabase = createServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- services table not in generated types
  const { data, error } = await (supabase as any)
    .from("services")
    .select("*")
    .eq("business_id", businessId)
    .order("category")
    .order("name");

  if (error) {
    if (error.code === "42P01" || error.message?.includes("does not exist")) {
      console.warn("Services table does not exist. Run migration first.");
      return [];
    }
    console.error("Error fetching services:", error);
    throw error;
  }

  return (data || []) as Service[];
}

export async function getActiveServices(
  businessId: string,
): Promise<Service[]> {
  const supabase = createServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- services table not in generated types
  const { data, error } = await (supabase as any)
    .from("services")
    .select("*")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("category")
    .order("name");

  if (error) {
    if (error.code === "42P01" || error.message?.includes("does not exist")) {
      return [];
    }
    console.error("Error fetching active services:", error);
    throw error;
  }

  return (data || []) as Service[];
}

export async function getServiceById(id: string): Promise<Service | null> {
  const supabase = createServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- services table not in generated types
  const { data, error } = await (supabase as any)
    .from("services")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "42P01" || error.message?.includes("does not exist")) {
      return null;
    }
    console.error("Error fetching service:", error);
    return null;
  }

  return data as Service;
}

export async function createService(
  businessId: string,
  input: ServiceFormData,
): Promise<Service> {
  const supabase = createServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- services table not in generated types
  const { data, error } = await (supabase as any)
    .from("services")
    .insert({
      business_id: businessId,
      name: input.name,
      description: input.description || null,
      price_centavos: Math.round(input.price * 100),
      pricing_type: input.pricing_type,
      duration_minutes: input.duration_minutes,
      duration_unit: input.duration_unit || 'minutes',
      category: input.category || null,
      image_url: input.image_url || null,
      is_active: input.is_active,
      max_guests: input.max_guests || null,
      allow_staff_selection: input.allow_staff_selection,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating service:", error);
    throw error;
  }

  const service = data as Service;

  // Assign staff if provided
  if (input.staff_ids && input.staff_ids.length > 0) {
    await setStaffForService(supabase, service.id, input.staff_ids);
  }

  return service;
}

export async function updateService(
  id: string,
  input: Partial<ServiceFormData>,
): Promise<Service> {
  const supabase = createServiceClient();

  const updateData: Record<string, unknown> = {};

  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined)
    updateData.description = input.description || null;
  if (input.price !== undefined)
    updateData.price_centavos = Math.round(input.price * 100);
  if (input.pricing_type !== undefined)
    updateData.pricing_type = input.pricing_type;
  if (input.duration_minutes !== undefined)
    updateData.duration_minutes = input.duration_minutes;
  if (input.duration_unit !== undefined)
    updateData.duration_unit = input.duration_unit;
  if (input.max_guests !== undefined)
    updateData.max_guests = input.max_guests || null;
  if (input.category !== undefined)
    updateData.category = input.category || null;
  if (input.image_url !== undefined)
    updateData.image_url = input.image_url || null;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;
  if (input.allow_staff_selection !== undefined)
    updateData.allow_staff_selection = input.allow_staff_selection;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- services table not in generated types
  const { data, error } = await (supabase as any)
    .from("services")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating service:", error);
    throw error;
  }

  // Update staff assignments if provided
  if (input.staff_ids !== undefined) {
    await setStaffForService(supabase, id, input.staff_ids);
  }

  return data as Service;
}

export async function deleteService(id: string): Promise<void> {
  const supabase = createServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- services table not in generated types
  const { error } = await (supabase as any)
    .from("services")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting service:", error);
    throw error;
  }
}

// ============================================
// STAFF ASSIGNMENT FUNCTIONS
// ============================================

interface StaffMember {
  id: string;
  name: string;
}

export async function getStaffForService(
  serviceId: string,
): Promise<StaffMember[]> {
  const supabase = createServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- services table not in generated types
  const { data, error } = await (supabase as any)
    .from("staff_services")
    .select("staff_id, staff:staff_id(id, name)")
    .eq("service_id", serviceId);

  if (error) {
    if (error.code === "42P01" || error.message?.includes("does not exist")) {
      return [];
    }
    console.error("Error fetching staff for service:", error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- staff_services table not in generated types
  return (data || []).map((row: any) => ({
    id: row.staff?.id || row.staff_id,
    name: row.staff?.name || "Unknown",
  })) as StaffMember[];
}

async function setStaffForService(
  supabase: ReturnType<typeof createServiceClient>,
  serviceId: string,
  staffIds: string[],
): Promise<void> {
  const client = supabase as ReturnType<typeof createServiceClient>;

  // Delete existing assignments
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- staff_services table not in generated types
  await (client as any)
    .from("staff_services")
    .delete()
    .eq("service_id", serviceId);

  // Insert new assignments
  if (staffIds.length > 0) {
    const rows = staffIds.map((staffId) => ({
      staff_id: staffId,
      service_id: serviceId,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- staff_services table not in generated types
    const { error } = await (client as any)
      .from("staff_services")
      .insert(rows);

    if (error) {
      console.error("Error assigning staff to service:", error);
    }
  }
}
