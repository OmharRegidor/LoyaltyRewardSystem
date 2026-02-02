// apps/web/lib/services/public-business.service.ts

import { createClient } from '@/lib/supabase';
import type { BookingStatus, TimeSlot, Availability } from '@/types/booking.types';

// ============================================
// TYPES
// ============================================

export interface PublicBusiness {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  logo_url: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
}

export interface PublicBusinessWithBranches extends PublicBusiness {
  branches: PublicBranch[];
}

export interface PublicBranch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  city: string | null;
  is_active: boolean;
}

export interface PublicService {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_centavos: number | null;
  is_active: boolean;
}

export interface ServiceWithBusiness extends PublicService {
  business: PublicBusiness;
}

export interface BookedSlot {
  start_time: string;
  end_time: string;
}

export interface CreatePublicBookingData {
  business_id: string;
  service_id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
}

export interface PublicCustomer {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  total_points: number | null;
  lifetime_points: number | null;
  tier: string | null;
  card_token: string | null;
  qr_code_url: string | null;
}

export interface FindOrCreateCustomerData {
  business_id: string;
  full_name: string;
  phone: string;
  email: string | null;
}

export interface LoyaltySignupData {
  business_id: string;
  full_name: string;
  phone: string;
  email: string | null;
}

export interface LoyaltySignupResult {
  customer: PublicCustomer;
  isNew: boolean;
  alreadyLinked: boolean;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function formatTimeForDisplay(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function generateCardToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// ============================================
// BUSINESS FUNCTIONS
// ============================================

export async function getBusinessBySlug(
  slug: string
): Promise<PublicBusinessWithBranches | null> {
  const supabase = createClient();

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id, name, slug, description, logo_url, phone, address, city')
    .eq('slug', slug)
    .maybeSingle();

  if (businessError) {
    console.error('Error fetching business:', businessError);
    throw businessError;
  }

  if (!business) {
    return null;
  }

  const { data: branches, error: branchesError } = await supabase
    .from('branches')
    .select('id, name, address, phone, city, is_active')
    .eq('business_id', business.id)
    .eq('is_active', true)
    .order('name');

  if (branchesError) {
    console.error('Error fetching branches:', branchesError);
    throw branchesError;
  }

  return {
    ...business,
    branches: branches || [],
  };
}

// ============================================
// SERVICE FUNCTIONS
// ============================================

export async function getPublicServices(businessId: string): Promise<PublicService[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('services')
    .select('id, name, description, duration_minutes, price_centavos, is_active')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching public services:', error);
    throw error;
  }

  return data || [];
}

export async function getServiceDetails(
  serviceId: string
): Promise<ServiceWithBusiness | null> {
  const supabase = createClient();

  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('id, name, description, duration_minutes, price_centavos, is_active, business_id')
    .eq('id', serviceId)
    .eq('is_active', true)
    .maybeSingle();

  if (serviceError) {
    console.error('Error fetching service:', serviceError);
    throw serviceError;
  }

  if (!service) {
    return null;
  }

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id, name, slug, description, logo_url, phone, address, city')
    .eq('id', service.business_id)
    .single();

  if (businessError) {
    console.error('Error fetching business for service:', businessError);
    throw businessError;
  }

  return {
    id: service.id,
    name: service.name,
    description: service.description,
    duration_minutes: service.duration_minutes,
    price_centavos: service.price_centavos,
    is_active: service.is_active,
    business,
  };
}

// ============================================
// AVAILABILITY FUNCTIONS
// ============================================

export async function getAvailabilityForDate(
  businessId: string,
  date: string
): Promise<Availability | null> {
  const supabase = createClient();

  const dayOfWeek = new Date(date).getDay();

  const { data, error } = await supabase
    .from('availability')
    .select('*')
    .eq('business_id', businessId)
    .eq('day_of_week', dayOfWeek)
    .is('branch_id', null)
    .is('staff_id', null)
    .maybeSingle();

  if (error) {
    console.error('Error fetching availability:', error);
    throw error;
  }

  return data as Availability | null;
}

export async function getBookedSlots(
  businessId: string,
  date: string
): Promise<BookedSlot[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('bookings')
    .select('start_time, end_time')
    .eq('business_id', businessId)
    .eq('booking_date', date)
    .neq('status', 'cancelled');

  if (error) {
    console.error('Error fetching booked slots:', error);
    throw error;
  }

  return data || [];
}

export function generateAvailableSlots(
  availability: Availability | null,
  bookedSlots: BookedSlot[],
  durationMinutes: number
): TimeSlot[] {
  if (!availability || !availability.is_available) {
    return [];
  }

  const slots: TimeSlot[] = [];
  const startMinutes = timeToMinutes(availability.start_time);
  const endMinutes = timeToMinutes(availability.end_time);

  for (let minutes = startMinutes; minutes + durationMinutes <= endMinutes; minutes += 30) {
    const timeValue = minutesToTime(minutes);
    const slotEndMinutes = minutes + durationMinutes;

    const hasConflict = bookedSlots.some((booking) => {
      const bookingStart = timeToMinutes(booking.start_time);
      const bookingEnd = timeToMinutes(booking.end_time);
      return minutes < bookingEnd && slotEndMinutes > bookingStart;
    });

    slots.push({
      value: timeValue,
      label: formatTimeForDisplay(timeValue),
      available: !hasConflict,
    });
  }

  return slots;
}

// ============================================
// BOOKING FUNCTIONS
// ============================================

export async function createPublicBooking(
  data: CreatePublicBookingData
): Promise<{ id: string }> {
  const supabase = createClient();

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      business_id: data.business_id,
      service_id: data.service_id,
      customer_id: null,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      customer_email: data.customer_email,
      booking_date: data.booking_date,
      start_time: data.start_time,
      end_time: data.end_time,
      staff_id: null,
      notes: data.notes,
      status: 'pending' as BookingStatus,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating public booking:', error);
    throw error;
  }

  return booking;
}

// ============================================
// CUSTOMER FUNCTIONS
// ============================================

export async function findOrCreateCustomer(
  data: FindOrCreateCustomerData
): Promise<{ customer: PublicCustomer; isNew: boolean }> {
  const supabase = createClient();

  // Check if customer exists by email
  if (data.email) {
    const { data: byEmail } = await supabase
      .from('customers')
      .select('id, full_name, phone, email, total_points, lifetime_points, tier, card_token, qr_code_url')
      .eq('email', data.email)
      .maybeSingle();

    if (byEmail) {
      return { customer: byEmail as PublicCustomer, isNew: false };
    }
  }

  // Check if customer exists by phone
  const { data: byPhone } = await supabase
    .from('customers')
    .select('id, full_name, phone, email, total_points, lifetime_points, tier, card_token, qr_code_url')
    .eq('phone', data.phone)
    .maybeSingle();

  if (byPhone) {
    return { customer: byPhone as PublicCustomer, isNew: false };
  }

  // Create new customer
  const cardToken = generateCardToken();
  const { data: newCustomer, error } = await supabase
    .from('customers')
    .insert({
      full_name: data.full_name,
      phone: data.phone,
      email: data.email,
      card_token: cardToken,
      card_token_created_at: new Date().toISOString(),
      total_points: 0,
      lifetime_points: 0,
      tier: 'bronze',
      created_by_business_id: data.business_id,
    })
    .select('id, full_name, phone, email, total_points, lifetime_points, tier, card_token, qr_code_url')
    .single();

  if (error) {
    console.error('Error creating customer:', error);
    throw error;
  }

  return { customer: newCustomer as PublicCustomer, isNew: true };
}

export async function signUpForLoyaltyCard(
  data: LoyaltySignupData
): Promise<LoyaltySignupResult> {
  const supabase = createClient();

  // Find or create the customer
  const { customer, isNew } = await findOrCreateCustomer({
    business_id: data.business_id,
    full_name: data.full_name,
    phone: data.phone,
    email: data.email,
  });

  // Check if already linked to this business
  const { data: existingLink } = await supabase
    .from('customer_businesses')
    .select('id')
    .eq('customer_id', customer.id)
    .eq('business_id', data.business_id)
    .maybeSingle();

  if (existingLink) {
    return { customer, isNew: false, alreadyLinked: true };
  }

  // Link customer to business
  const { error: linkError } = await supabase.from('customer_businesses').insert({
    customer_id: customer.id,
    business_id: data.business_id,
    followed_at: new Date().toISOString(),
  });

  if (linkError) {
    console.error('Error linking customer to business:', linkError);
    throw linkError;
  }

  return { customer, isNew, alreadyLinked: false };
}

export async function getCustomerByCardToken(
  cardToken: string
): Promise<PublicCustomer | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('customers')
    .select('id, full_name, phone, email, total_points, lifetime_points, tier, card_token, qr_code_url')
    .eq('card_token', cardToken)
    .maybeSingle();

  if (error) {
    console.error('Error fetching customer by card token:', error);
    throw error;
  }

  return data as PublicCustomer | null;
}

export async function isCustomerLinkedToBusiness(
  customerId: string,
  businessId: string
): Promise<boolean> {
  const supabase = createClient();

  const { data } = await supabase
    .from('customer_businesses')
    .select('id')
    .eq('customer_id', customerId)
    .eq('business_id', businessId)
    .maybeSingle();

  return !!data;
}
