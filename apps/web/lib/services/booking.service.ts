// apps/web/lib/services/booking.service.ts

import { createClient } from '@/lib/supabase';
import type {
  Service,
  ServiceFormData,
  ServiceWithConfig,
  ServiceConfig,
  PriceVariant,
  ServiceQuestion,
  PricingType,
  Branch,
  Availability,
  AvailabilityFormData,
  BookingWithDetails,
  BookingStatus,
  TimeSlot,
  CustomerSearchResult,
  BusinessType,
} from '@/types/booking.types';

// ============================================
// GET OR CREATE DEFAULT SERVICE
// ============================================

export async function getOrCreateDefaultService(
  businessId: string,
  businessType: BusinessType | null
): Promise<ServiceWithConfig> {
  const supabase = createClient();

  // Try to get the first active service
  const { data: existingServices, error: fetchError } = await supabase
    .from('services')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1);

  if (fetchError) {
    console.error('Error fetching services:', fetchError);
    throw fetchError;
  }

  // If service exists, return it with full config
  if (existingServices && existingServices.length > 0) {
    const service = await getServiceWithConfig(existingServices[0].id);
    if (service) return service;
  }

  // Create default service based on business type
  const defaultName = getDefaultServiceName(businessType);
  const defaultConfig = getDefaultConfigForType(businessType);
  const defaultDuration = getDefaultDuration(businessType);

  const newServiceData: ServiceFormData & { business_id: string } = {
    business_id: businessId,
    name: defaultName,
    description: '',
    duration_minutes: defaultDuration,
    price: null,
    branch_id: null,
    is_active: true,
    config: defaultConfig,
    category: null,
    buffer_minutes: 0,
    pricing_type: 'fixed',
    deposit_percentage: 0,
    allow_staff_selection: false,
    inventory_count: 1,
    price_variants: [],
    questions: [],
  };

  return await createServiceWithConfig(newServiceData);
}

function getDefaultServiceName(businessType: BusinessType | null): string {
  switch (businessType) {
    case 'hotel':
      return 'Standard Room';
    case 'restaurant':
      return 'Table Reservation';
    case 'salon':
      return 'Appointment';
    case 'retail':
      return 'Booking';
    default:
      return 'Service';
  }
}

function getDefaultDuration(businessType: BusinessType | null): number {
  switch (businessType) {
    case 'hotel':
      return 1440; // 1 night
    case 'restaurant':
      return 90; // 1.5 hours
    case 'salon':
      return 60; // 1 hour
    case 'retail':
      return 30; // 30 minutes
    default:
      return 60;
  }
}

function getDefaultConfigForType(businessType: BusinessType | null): ServiceConfig {
  switch (businessType) {
    case 'hotel':
      return {
        service_type: 'accommodation',
        extra_person_fee_centavos: 0,
        capacity_base: 2,
        capacity_max: 4,
        check_in_time: '14:00',
        check_out_time: '11:00',
        amenities: [],
        min_stay_nights: 1,
        max_stay_nights: 30,
        advance_booking_days: 90,
        cutoff_hours: 24,
      };
    case 'restaurant':
      return {
        service_type: 'table',
        party_size_min: 1,
        party_size_max: 4,
        slot_duration_minutes: 90,
        time_interval_minutes: 30,
      };
    case 'retail':
      return { service_type: 'appointment' };
    default:
      return {};
  }
}

// ============================================
// GET BUSINESS TYPE
// ============================================

export async function getBusinessType(businessId: string): Promise<BusinessType | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('businesses')
    .select('business_type')
    .eq('id', businessId)
    .single();

  if (error) {
    console.error('Error fetching business type:', error);
    return null;
  }

  return (data?.business_type as BusinessType) || null;
}

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
      image_url: data.image_url || null,
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
  if (data.image_url !== undefined) updateData.image_url = data.image_url || null;

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
// GET SERVICE WITH CONFIG
// ============================================

export async function getServiceWithConfig(id: string): Promise<ServiceWithConfig | null> {
  const supabase = createClient();

  // Fetch service with extended fields
  // Note: New columns (config, category, buffer_minutes, etc.) need migration to be run first
  const { data: service, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching service:', error);
    return null;
  }

  // Cast to record to access potentially new fields
  const serviceRecord = service as Record<string, unknown>;

  // Fetch price variants (table created by migration)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: variants } = await (supabase as any)
    .from('service_price_variants')
    .select('*')
    .eq('service_id', id)
    .order('sort_order');

  // Fetch questions (table created by migration)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: questions } = await (supabase as any)
    .from('service_questions')
    .select('*')
    .eq('service_id', id)
    .order('sort_order');

  const questionsList = (questions || []) as Array<{
    id: string;
    service_id: string;
    question: string;
    question_type: string;
    options: string[] | null;
    is_required: boolean;
    sort_order: number;
  }>;

  return {
    ...service,
    config: (serviceRecord.config as Record<string, unknown>) || {},
    category: (serviceRecord.category as string) || null,
    buffer_minutes: (serviceRecord.buffer_minutes as number) || 0,
    pricing_type: (serviceRecord.pricing_type as PricingType) || 'fixed',
    deposit_percentage: (serviceRecord.deposit_percentage as number) || 0,
    allow_staff_selection: (serviceRecord.allow_staff_selection as boolean) || false,
    inventory_count: (serviceRecord.inventory_count as number) || 1,
    price_variants: (variants || []) as PriceVariant[],
    questions: questionsList.map((q) => ({
      ...q,
      options: q.options || [],
    })),
  } as ServiceWithConfig;
}

// ============================================
// CREATE SERVICE WITH CONFIG
// ============================================

export async function createServiceWithConfig(
  data: ServiceFormData & { business_id: string }
): Promise<ServiceWithConfig> {
  const supabase = createClient();

  // Create the service - cast to any to allow new columns before types are regenerated
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: service, error } = await (supabase as any)
    .from('services')
    .insert({
      business_id: data.business_id,
      branch_id: data.branch_id,
      name: data.name,
      description: data.description || null,
      duration_minutes: data.duration_minutes,
      price_centavos: data.price ? Math.round(data.price * 100) : null,
      is_active: data.is_active,
      image_url: data.image_url || null,
      config: data.config || {},
      category: data.category || null,
      buffer_minutes: data.buffer_minutes || 0,
      pricing_type: data.pricing_type || 'fixed',
      deposit_percentage: data.deposit_percentage || 0,
      allow_staff_selection: data.allow_staff_selection || false,
      inventory_count: data.inventory_count || 1,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating service:', error);
    throw error;
  }

  // Create price variants if provided
  if (data.price_variants && data.price_variants.length > 0) {
    const variantsToInsert = data.price_variants.map((v, idx) => ({
      service_id: service.id,
      name: v.name,
      price_centavos: v.price_centavos,
      description: v.description || null,
      capacity: v.capacity || null,
      sort_order: idx,
      is_active: v.is_active,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: variantsError } = await (supabase as any)
      .from('service_price_variants')
      .insert(variantsToInsert);

    if (variantsError) {
      console.error('Error creating price variants:', variantsError);
    }
  }

  // Create questions if provided
  if (data.questions && data.questions.length > 0) {
    const questionsToInsert = data.questions.map((q, idx) => ({
      service_id: service.id,
      question: q.question,
      question_type: q.question_type,
      options: q.options || [],
      is_required: q.is_required,
      sort_order: idx,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: questionsError } = await (supabase as any)
      .from('service_questions')
      .insert(questionsToInsert);

    if (questionsError) {
      console.error('Error creating questions:', questionsError);
    }
  }

  // Return the full service with config
  return (await getServiceWithConfig(service.id)) as ServiceWithConfig;
}

// ============================================
// UPDATE SERVICE WITH CONFIG
// ============================================

export async function updateServiceWithConfig(
  id: string,
  data: Partial<ServiceFormData>
): Promise<ServiceWithConfig> {
  const supabase = createClient();

  // Get the service's business_id for diving addon management
  const { data: serviceData, error: fetchError } = await supabase
    .from('services')
    .select('business_id')
    .eq('id', id)
    .single();

  if (fetchError || !serviceData) {
    console.error('Error fetching service:', fetchError);
    throw fetchError || new Error('Service not found');
  }

  const businessId = serviceData.business_id;

  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.duration_minutes !== undefined) updateData.duration_minutes = data.duration_minutes;
  if (data.price !== undefined) updateData.price_centavos = data.price ? Math.round(data.price * 100) : null;
  if (data.branch_id !== undefined) updateData.branch_id = data.branch_id;
  if (data.is_active !== undefined) updateData.is_active = data.is_active;
  if (data.image_url !== undefined) updateData.image_url = data.image_url || null;
  if (data.config !== undefined) updateData.config = data.config || {};
  if (data.category !== undefined) updateData.category = data.category || null;
  if (data.buffer_minutes !== undefined) updateData.buffer_minutes = data.buffer_minutes;
  if (data.pricing_type !== undefined) updateData.pricing_type = data.pricing_type;
  if (data.deposit_percentage !== undefined) updateData.deposit_percentage = data.deposit_percentage;
  if (data.allow_staff_selection !== undefined) updateData.allow_staff_selection = data.allow_staff_selection;
  if (data.inventory_count !== undefined) updateData.inventory_count = data.inventory_count;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('services')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating service:', error);
    throw error;
  }

  // Handle diving addon toggle
  if (data.config !== undefined) {
    const config = data.config as Record<string, unknown>;
    if (config.enable_diving_addons === true) {
      await ensureDivingAddonExists(businessId);
    } else if (config.enable_diving_addons === false) {
      await removeDivingAddon(businessId);
    }
  }

  // Update price variants if provided
  if (data.price_variants !== undefined) {
    // Delete existing variants
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('service_price_variants')
      .delete()
      .eq('service_id', id);

    // Insert new variants
    if (data.price_variants.length > 0) {
      const variantsToInsert = data.price_variants.map((v, idx) => ({
        service_id: id,
        name: v.name,
        price_centavos: v.price_centavos,
        description: v.description || null,
        capacity: v.capacity || null,
        sort_order: idx,
        is_active: v.is_active,
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: variantsError } = await (supabase as any)
        .from('service_price_variants')
        .insert(variantsToInsert);

      if (variantsError) {
        console.error('Error updating price variants:', variantsError);
      }
    }
  }

  // Update questions if provided
  if (data.questions !== undefined) {
    // Delete existing questions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('service_questions')
      .delete()
      .eq('service_id', id);

    // Insert new questions
    if (data.questions.length > 0) {
      const questionsToInsert = data.questions.map((q, idx) => ({
        service_id: id,
        question: q.question,
        question_type: q.question_type,
        options: q.options || [],
        is_required: q.is_required,
        sort_order: idx,
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: questionsError } = await (supabase as any)
        .from('service_questions')
        .insert(questionsToInsert);

      if (questionsError) {
        console.error('Error updating questions:', questionsError);
      }
    }
  }

  // Return the full service with config
  return (await getServiceWithConfig(id)) as ServiceWithConfig;
}

// ============================================
// GET STAFF FOR SERVICE ASSIGNMENT
// ============================================

interface StaffMember {
  id: string;
  name: string;
  role: string;
  is_assigned?: boolean;
}

export async function getStaffForServiceAssignment(
  businessId: string,
  serviceId?: string
): Promise<StaffMember[]> {
  const supabase = createClient();

  // Get all active staff
  const { data: staff, error } = await supabase
    .from('staff')
    .select('id, name, role')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching staff:', error);
    return [];
  }

  if (!serviceId) {
    return (staff || []).map(s => ({ ...s, is_assigned: false }));
  }

  // Get staff assignments for this service
  const { data: assignments } = await supabase
    .from('staff_services')
    .select('staff_id')
    .eq('service_id', serviceId);

  const assignedIds = new Set((assignments || []).map(a => a.staff_id));

  return (staff || []).map(s => ({
    ...s,
    is_assigned: assignedIds.has(s.id),
  }));
}

// ============================================
// UPDATE STAFF SERVICE ASSIGNMENTS
// ============================================

export async function updateStaffServiceAssignments(
  serviceId: string,
  staffIds: string[]
): Promise<void> {
  const supabase = createClient();

  // Delete existing assignments
  const { error: deleteError } = await supabase
    .from('staff_services')
    .delete()
    .eq('service_id', serviceId);

  if (deleteError) {
    console.error('Error deleting staff assignments:', deleteError);
    throw deleteError;
  }

  // Insert new assignments
  if (staffIds.length > 0) {
    const assignments = staffIds.map(staffId => ({
      service_id: serviceId,
      staff_id: staffId,
    }));

    const { error: insertError } = await supabase
      .from('staff_services')
      .insert(assignments);

    if (insertError) {
      console.error('Error creating staff assignments:', insertError);
      throw insertError;
    }
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

// ============================================
// GET AVAILABILITY
// ============================================

export async function getAvailability(businessId: string): Promise<Availability[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('availability')
    .select('*')
    .eq('business_id', businessId)
    .is('branch_id', null)
    .is('staff_id', null)
    .order('day_of_week');

  if (error) {
    console.error('Error fetching availability:', error);
    throw error;
  }

  return data || [];
}

// ============================================
// SAVE AVAILABILITY
// ============================================

export async function saveAvailability(
  businessId: string,
  data: AvailabilityFormData[]
): Promise<void> {
  const supabase = createClient();

  // Delete existing business-level availability
  const { error: deleteError } = await supabase
    .from('availability')
    .delete()
    .eq('business_id', businessId)
    .is('branch_id', null)
    .is('staff_id', null);

  if (deleteError) {
    console.error('Error deleting availability:', deleteError);
    throw deleteError;
  }

  // Insert new records
  const records = data.map((item) => ({
    business_id: businessId,
    branch_id: null,
    staff_id: null,
    day_of_week: item.day_of_week,
    start_time: item.start_time,
    end_time: item.end_time,
    is_available: item.is_available,
  }));

  const { error: insertError } = await supabase
    .from('availability')
    .insert(records);

  if (insertError) {
    console.error('Error saving availability:', insertError);
    throw insertError;
  }
}

// ============================================
// GET BOOKINGS
// ============================================

export async function getBookings(
  businessId: string,
  date: string
): Promise<BookingWithDetails[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      service:services(*)
    `)
    .eq('business_id', businessId)
    .eq('booking_date', date)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }

  return (data || []) as BookingWithDetails[];
}

// ============================================
// UPDATE BOOKING STATUS
// ============================================

export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
  cancellationReason?: string
): Promise<void> {
  const supabase = createClient();

  const updateData: Record<string, unknown> = { status };

  if (status === 'cancelled') {
    updateData.cancelled_at = new Date().toISOString();
    if (cancellationReason) {
      updateData.cancellation_reason = cancellationReason;
    }
  }

  const { error } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
}

// ============================================
// CREATE BOOKING
// ============================================

interface CreateBookingData {
  business_id: string;
  service_id: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  staff_id: string | null;
  notes: string | null;
  status: BookingStatus;
}

export async function createBooking(data: CreateBookingData): Promise<BookingWithDetails> {
  const supabase = createClient();

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      business_id: data.business_id,
      service_id: data.service_id,
      customer_id: data.customer_id,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      customer_email: data.customer_email,
      booking_date: data.booking_date,
      start_time: data.start_time,
      end_time: data.end_time,
      staff_id: data.staff_id,
      notes: data.notes,
      status: data.status,
    })
    .select(`
      *,
      service:services(*)
    `)
    .single();

  if (error) {
    console.error('Error creating booking:', error);
    throw error;
  }

  return booking as BookingWithDetails;
}

// ============================================
// GET AVAILABLE TIME SLOTS
// ============================================

function formatTimeForDisplay(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function timesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const start1Min = timeToMinutes(start1);
  const end1Min = timeToMinutes(end1);
  const start2Min = timeToMinutes(start2);
  const end2Min = timeToMinutes(end2);

  return start1Min < end2Min && end1Min > start2Min;
}

export async function getAvailableTimeSlots(
  businessId: string,
  date: string,
  serviceDurationMinutes: number
): Promise<TimeSlot[]> {
  const supabase = createClient();

  // Get day of week (0 = Sunday, 6 = Saturday)
  const dayOfWeek = new Date(date).getDay();

  // Fetch availability for that day
  const { data: availabilityData } = await supabase
    .from('availability')
    .select('*')
    .eq('business_id', businessId)
    .eq('day_of_week', dayOfWeek)
    .is('branch_id', null)
    .is('staff_id', null)
    .single();

  if (!availabilityData || !availabilityData.is_available) {
    return [];
  }

  // Generate 30-minute slots within business hours
  const slots: TimeSlot[] = [];
  const startMinutes = timeToMinutes(availabilityData.start_time);
  const endMinutes = timeToMinutes(availabilityData.end_time);

  for (let minutes = startMinutes; minutes + serviceDurationMinutes <= endMinutes; minutes += 30) {
    const timeValue = minutesToTime(minutes);
    slots.push({
      value: timeValue,
      label: formatTimeForDisplay(timeValue),
      available: true,
    });
  }

  // Fetch existing bookings for that date (excluding cancelled)
  const { data: bookings } = await supabase
    .from('bookings')
    .select('start_time, end_time, status')
    .eq('business_id', businessId)
    .eq('booking_date', date)
    .neq('status', 'cancelled');

  if (!bookings || bookings.length === 0) {
    return slots;
  }

  // Mark slots that conflict with existing bookings
  return slots.map((slot) => {
    const slotEndTime = minutesToTime(timeToMinutes(slot.value) + serviceDurationMinutes);
    const hasConflict = bookings.some((booking) =>
      timesOverlap(slot.value, slotEndTime, booking.start_time, booking.end_time)
    );

    return {
      ...slot,
      available: !hasConflict,
    };
  });
}

// ============================================
// SEARCH CUSTOMERS
// ============================================

export async function searchCustomers(
  businessId: string,
  query: string
): Promise<CustomerSearchResult[]> {
  const supabase = createClient();

  const searchQuery = query.toLowerCase().trim();

  if (!searchQuery) {
    // Return recent customers
    const { data, error } = await supabase
      .from('customers')
      .select('id, full_name, phone, email')
      .eq('created_by_business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching customers:', error);
      return [];
    }

    // Map full_name to name for the interface
    return (data || []).map(c => ({
      id: c.id,
      name: c.full_name || '',
      phone: c.phone,
      email: c.email,
    }));
  }

  // Search by name or phone
  const { data, error } = await supabase
    .from('customers')
    .select('id, full_name, phone, email')
    .eq('created_by_business_id', businessId)
    .or(`full_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
    .limit(10);

  if (error) {
    console.error('Error searching customers:', error);
    return [];
  }

  // Map full_name to name for the interface
  return (data || []).map(c => ({
    id: c.id,
    name: c.full_name || '',
    phone: c.phone,
    email: c.email,
  }));
}

// ============================================
// DIVING ADDON MANAGEMENT
// ============================================

const DIVING_ADDON_CATEGORY = 'diving';

const DIVING_OPTIONS = [
  { name: 'Fun Dive', price_centavos: 250000, description: 'For certified divers' },
  { name: 'Discover Scuba Diving', price_centavos: 350000, description: 'Try diving for the first time' },
  { name: 'Open Water Course', price_centavos: 1800000, description: 'Get certified as a diver' },
];

/**
 * Creates a "Diving Experience" addon with options if it doesn't exist
 */
export async function ensureDivingAddonExists(businessId: string): Promise<void> {
  const supabase = createClient();

  // Check if diving addon already exists for this business
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingAddon } = await (supabase as any)
    .from('booking_addons')
    .select('id, is_active')
    .eq('business_id', businessId)
    .eq('category', DIVING_ADDON_CATEGORY)
    .single();

  if (existingAddon) {
    // Re-activate if it was deactivated
    if (!existingAddon.is_active) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('booking_addons')
        .update({ is_active: true })
        .eq('id', existingAddon.id);
    }
    return;
  }

  // Create the diving addon
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: addon, error: addonError } = await (supabase as any)
    .from('booking_addons')
    .insert({
      business_id: businessId,
      name: 'Diving Experience',
      description: 'Add a diving program to your stay',
      price_centavos: 0, // Price comes from options
      category: DIVING_ADDON_CATEGORY,
      is_active: true,
      sort_order: 0,
    })
    .select('id')
    .single();

  if (addonError) {
    console.error('Error creating diving addon:', addonError);
    throw addonError;
  }

  // Create the diving options
  const optionsToInsert = DIVING_OPTIONS.map((opt, idx) => ({
    addon_id: addon.id,
    name: opt.name,
    price_centavos: opt.price_centavos,
    description: opt.description,
    sort_order: idx,
    is_active: true,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: optionsError } = await (supabase as any)
    .from('booking_addon_options')
    .insert(optionsToInsert);

  if (optionsError) {
    console.error('Error creating diving addon options:', optionsError);
    throw optionsError;
  }
}

/**
 * Deactivates the diving addon for a business (soft delete)
 */
export async function removeDivingAddon(businessId: string): Promise<void> {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('booking_addons')
    .update({ is_active: false })
    .eq('business_id', businessId)
    .eq('category', DIVING_ADDON_CATEGORY);

  if (error) {
    console.error('Error removing diving addon:', error);
    // Don't throw - this is a soft failure
  }
}
