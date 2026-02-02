// apps/web/lib/services/booking.service.ts

import { createClient } from '@/lib/supabase';
import type { Service, ServiceFormData, Branch } from '@/types/booking.types';

// ============================================
// GET SERVICES
// ============================================

export async function getServices(businessId: string): Promise<Service[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching services:', error);
    throw error;
  }

  return data || [];
}

// ============================================
// GET SERVICE BY ID
// ============================================

export async function getServiceById(id: string): Promise<Service | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching service:', error);
    return null;
  }

  return data;
}

// ============================================
// CREATE SERVICE
// ============================================

export async function createService(
  data: ServiceFormData & { business_id: string }
): Promise<Service> {
  const supabase = createClient();

  const { data: service, error } = await supabase
    .from('services')
    .insert({
      business_id: data.business_id,
      branch_id: data.branch_id,
      name: data.name,
      description: data.description || null,
      duration_minutes: data.duration_minutes,
      price_centavos: data.price ? Math.round(data.price * 100) : null,
      is_active: data.is_active,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating service:', error);
    throw error;
  }

  return service;
}

// ============================================
// UPDATE SERVICE
// ============================================

export async function updateService(
  id: string,
  data: Partial<ServiceFormData>
): Promise<Service> {
  const supabase = createClient();

  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined)
    updateData.description = data.description || null;
  if (data.duration_minutes !== undefined)
    updateData.duration_minutes = data.duration_minutes;
  if (data.price !== undefined)
    updateData.price_centavos = data.price ? Math.round(data.price * 100) : null;
  if (data.branch_id !== undefined) updateData.branch_id = data.branch_id;
  if (data.is_active !== undefined) updateData.is_active = data.is_active;

  const { data: service, error } = await supabase
    .from('services')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating service:', error);
    throw error;
  }

  return service;
}

// ============================================
// DELETE SERVICE
// ============================================

export async function deleteService(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from('services').delete().eq('id', id);

  if (error) {
    console.error('Error deleting service:', error);
    throw error;
  }
}

// ============================================
// GET BRANCHES
// ============================================

export async function getBranches(businessId: string): Promise<Branch[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('branches')
    .select('id, name, is_active')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching branches:', error);
    return [];
  }

  return data || [];
}
