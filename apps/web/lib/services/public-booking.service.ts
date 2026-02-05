// apps/web/lib/services/public-booking.service.ts

import { createServiceClient } from '@/lib/supabase-server';
import {
  generateQRToken,
  generateQRCodeUrl,
  generateCardToken,
} from '@/lib/qr-code';
import type { PublicBusiness, PublicService } from './public-business.service';

// ============================================
// TYPES
// ============================================

export interface AvailableSlotsResult {
  date: string;
  slots: string[];
  businessHours: { open: string; close: string } | null;
}

export interface FullDayAvailabilityResult {
  date: string;
  available: boolean;
}

export interface DateRangeAvailabilityResult {
  available: boolean;
  nights: number;
  totalPrice: number;
  unavailableDates: string[];
}

export interface AddonSelection {
  addonId: string;
  quantity: number;
}

export interface CreatePublicBookingData {
  businessId: string;
  serviceId: string;
  bookingDate: string;
  startTime?: string;
  endDate?: string;
  nights?: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
  addons?: AddonSelection[];
}

export interface PublicBookingResult {
  bookingId: string;
  confirmationCode: string;
  customerId: string;
  cardToken: string;
  pointsEarned: number;
  isNewCustomer: boolean;
  totalPriceCentavos: number;
}

export interface BookingAddonDetail {
  id: string;
  name: string;
  quantity: number;
  unitPriceCentavos: number;
}

export interface BookingDetails {
  id: string;
  confirmationCode: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  notes: string | null;
  createdAt: string;
  nights: number | null;
  totalPriceCentavos: number | null;
  service: {
    id: string;
    name: string;
    description: string | null;
    durationMinutes: number;
    priceCentavos: number | null;
  };
  business: {
    id: string;
    name: string;
    slug: string;
    phone: string | null;
    address: string | null;
  };
  addons: BookingAddonDetail[];
}

// ============================================
// UTILITY FUNCTIONS
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

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, '').replace(/[^0-9]/g, '');
}

// ============================================
// GET AVAILABLE TIME SLOTS
// ============================================

export async function getAvailableSlots(
  businessId: string,
  date: string,
  serviceId: string
): Promise<AvailableSlotsResult | FullDayAvailabilityResult> {
  const supabase = createServiceClient();

  // Get service to determine duration
  const { data: service } = await supabase
    .from('services')
    .select('duration_minutes')
    .eq('id', serviceId)
    .single();

  if (!service) {
    return { date, slots: [], businessHours: null };
  }

  const durationMinutes = service.duration_minutes;

  // For full-day services (>= 1440 min), check if date is available
  if (durationMinutes >= 1440) {
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('business_id', businessId)
      .eq('service_id', serviceId)
      .eq('booking_date', date)
      .neq('status', 'cancelled')
      .limit(1);

    return {
      date,
      available: !existingBookings || existingBookings.length === 0,
    };
  }

  // For time-based services, get available slots
  const dayOfWeek = new Date(date + 'T00:00:00').getDay();

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
    return { date, slots: [], businessHours: null };
  }

  // Generate 30-minute slots within business hours
  const slots: string[] = [];
  const startMinutes = timeToMinutes(availabilityData.start_time);
  const endMinutes = timeToMinutes(availabilityData.end_time);

  for (let minutes = startMinutes; minutes + durationMinutes <= endMinutes; minutes += 30) {
    slots.push(minutesToTime(minutes));
  }

  // Fetch existing bookings for that date (excluding cancelled)
  const { data: bookings } = await supabase
    .from('bookings')
    .select('start_time, end_time, status')
    .eq('business_id', businessId)
    .eq('booking_date', date)
    .neq('status', 'cancelled');

  if (!bookings || bookings.length === 0) {
    return {
      date,
      slots,
      businessHours: {
        open: availabilityData.start_time,
        close: availabilityData.end_time,
      },
    };
  }

  // Filter out slots that conflict with existing bookings
  const availableSlots = slots.filter((slot) => {
    const slotEndTime = minutesToTime(timeToMinutes(slot) + durationMinutes);
    const hasConflict = bookings.some((booking) =>
      timesOverlap(slot, slotEndTime, booking.start_time, booking.end_time)
    );
    return !hasConflict;
  });

  return {
    date,
    slots: availableSlots,
    businessHours: {
      open: availabilityData.start_time,
      close: availabilityData.end_time,
    },
  };
}

// ============================================
// CHECK DATE RANGE AVAILABILITY (MULTI-DAY)
// ============================================

export async function checkDateRangeAvailability(
  businessId: string,
  startDate: string,
  endDate: string,
  serviceId: string
): Promise<DateRangeAvailabilityResult> {
  const supabase = createServiceClient();

  // Get service to determine price
  const { data: service } = await supabase
    .from('services')
    .select('duration_minutes, price_centavos')
    .eq('id', serviceId)
    .single();

  if (!service) {
    return { available: false, nights: 0, totalPrice: 0, unavailableDates: [] };
  }

  // Calculate number of nights
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (nights <= 0) {
    return { available: false, nights: 0, totalPrice: 0, unavailableDates: [] };
  }

  // Get all dates in the range
  const dates: string[] = [];
  const current = new Date(start);
  while (current < end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  // Check for existing bookings in the range
  const { data: existingBookings } = await supabase
    .from('bookings')
    .select('booking_date')
    .eq('business_id', businessId)
    .eq('service_id', serviceId)
    .gte('booking_date', startDate)
    .lt('booking_date', endDate)
    .neq('status', 'cancelled');

  const bookedDates = existingBookings?.map((b) => b.booking_date) || [];
  const unavailableDates = dates.filter((d) => bookedDates.includes(d));

  // Check availability for each day of week
  const unavailableDaysOfWeek: string[] = [];
  for (const dateStr of dates) {
    const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay();

    const { data: availability } = await supabase
      .from('availability')
      .select('is_available')
      .eq('business_id', businessId)
      .eq('day_of_week', dayOfWeek)
      .is('branch_id', null)
      .is('staff_id', null)
      .single();

    if (!availability || !availability.is_available) {
      unavailableDaysOfWeek.push(dateStr);
    }
  }

  const allUnavailable = [...new Set([...unavailableDates, ...unavailableDaysOfWeek])];

  // Calculate total price (price per night * nights)
  const pricePerNight = service.price_centavos || 0;
  const totalPrice = pricePerNight * nights;

  return {
    available: allUnavailable.length === 0,
    nights,
    totalPrice,
    unavailableDates: allUnavailable,
  };
}

// ============================================
// CREATE PUBLIC BOOKING
// ============================================

export async function createPublicBooking(
  data: CreatePublicBookingData
): Promise<PublicBookingResult> {
  const supabase = createServiceClient();

  // 1. Get service details
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('duration_minutes, price_centavos')
    .eq('id', data.serviceId)
    .single();

  if (serviceError || !service) {
    throw new Error('Service not found');
  }

  // 2. Get business settings for points calculation
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('points_per_purchase, pesos_per_point')
    .eq('id', data.businessId)
    .single();

  if (businessError || !business) {
    throw new Error('Business not found');
  }

  // 3. Fetch and validate add-ons if provided
  interface AddonInfo {
    id: string;
    price_centavos: number;
  }
  const addonPrices = new Map<string, number>();

  if (data.addons && data.addons.length > 0) {
    const addonIds = data.addons.map((a) => a.addonId);
    const { data: addonsData } = await supabase
      .from('booking_addons')
      .select('id, price_centavos')
      .in('id', addonIds)
      .eq('business_id', data.businessId)
      .eq('is_active', true);

    if (addonsData) {
      for (const addon of addonsData as AddonInfo[]) {
        addonPrices.set(addon.id, addon.price_centavos);
      }
    }
  }

  // 4. Calculate total price
  const nights = data.nights || 1;
  const servicePriceCentavos = (service.price_centavos || 0) * nights;

  let addonsTotalCentavos = 0;
  if (data.addons) {
    for (const addon of data.addons) {
      const unitPrice = addonPrices.get(addon.addonId);
      if (unitPrice !== undefined) {
        addonsTotalCentavos += unitPrice * addon.quantity;
      }
    }
  }

  const totalPriceCentavos = servicePriceCentavos + addonsTotalCentavos;

  // 5. Normalize phone and find/create customer
  const normalizedPhone = normalizePhone(data.customerPhone);
  let customerId: string;
  let isNewCustomer = false;
  let cardToken: string;

  // Check if customer exists by phone (global lookup)
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id, card_token')
    .eq('phone', normalizedPhone)
    .maybeSingle();

  if (existingCustomer) {
    customerId = existingCustomer.id;
    cardToken = existingCustomer.card_token || '';

    // Ensure card_token exists
    if (!cardToken) {
      cardToken = generateCardToken(customerId);
      await supabase
        .from('customers')
        .update({
          card_token: cardToken,
          card_token_created_at: new Date().toISOString(),
        })
        .eq('id', customerId);
    }

    // Update email if provided and customer doesn't have one
    if (data.customerEmail) {
      const { data: customerWithEmail } = await supabase
        .from('customers')
        .select('email')
        .eq('id', customerId)
        .single();

      if (!customerWithEmail?.email) {
        await supabase
          .from('customers')
          .update({ email: data.customerEmail.toLowerCase().trim() })
          .eq('id', customerId);
      }
    }
  } else {
    // Create new customer
    isNewCustomer = true;
    const qrToken = generateQRToken();
    const qrCodeUrl = generateQRCodeUrl(qrToken);

    const { data: newCustomer, error: createError } = await supabase
      .from('customers')
      .insert({
        user_id: null,
        email: data.customerEmail?.toLowerCase().trim() || null,
        full_name: data.customerName,
        phone: normalizedPhone,
        total_points: 0,
        lifetime_points: 0,
        tier: 'bronze',
        qr_code_url: qrCodeUrl,
        created_by_staff_id: null,
        created_by_business_id: data.businessId,
      })
      .select('id')
      .single();

    if (createError || !newCustomer) {
      throw new Error('Failed to create customer');
    }

    customerId = newCustomer.id;
    cardToken = generateCardToken(customerId);

    await supabase
      .from('customers')
      .update({
        card_token: cardToken,
        card_token_created_at: new Date().toISOString(),
      })
      .eq('id', customerId);
  }

  // 6. Calculate booking times
  const durationMinutes = service.duration_minutes;
  let startTime = data.startTime || '00:00';
  let endTime: string;

  if (durationMinutes >= 1440) {
    // Full-day or multi-day: use full day times
    startTime = '00:00';
    endTime = '23:59';
  } else {
    // Time-based: calculate end time
    endTime = minutesToTime(timeToMinutes(startTime) + durationMinutes);
  }

  // 7. Create booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      business_id: data.businessId,
      service_id: data.serviceId,
      customer_id: customerId,
      customer_name: data.customerName,
      customer_phone: normalizedPhone,
      customer_email: data.customerEmail?.toLowerCase().trim() || null,
      booking_date: data.bookingDate,
      start_time: startTime,
      end_time: endTime,
      notes: data.notes || null,
      status: 'pending',
      total_price_centavos: totalPriceCentavos,
      nights: nights > 1 ? nights : null,
    })
    .select('id, confirmation_code')
    .single();

  if (bookingError || !booking) {
    throw new Error('Failed to create booking');
  }

  // 8. Create addon selections
  if (data.addons && data.addons.length > 0) {
    const addonSelections = data.addons
      .filter((addon) => addonPrices.has(addon.addonId))
      .map((addon) => ({
        booking_id: booking.id,
        addon_id: addon.addonId,
        quantity: addon.quantity,
        unit_price_centavos: addonPrices.get(addon.addonId)!,
      }));

    if (addonSelections.length > 0) {
      await supabase.from('booking_addon_selections').insert(addonSelections);
    }
  }

  // 9. Calculate and award points (based on total price)
  const pointsPerPurchase = business.points_per_purchase || 1;
  const pesosPerPoint = business.pesos_per_point || 100;
  const totalPricePesos = totalPriceCentavos / 100;
  const pointsEarned = Math.floor(totalPricePesos / pesosPerPoint) * pointsPerPurchase;

  if (pointsEarned > 0) {
    // Award points to customer
    await supabase.rpc('add_customer_points', {
      p_customer_id: customerId,
      p_points: pointsEarned,
    });

    // Create transaction record
    await supabase.from('transactions').insert({
      customer_id: customerId,
      business_id: data.businessId,
      type: 'earn',
      points: pointsEarned,
      description: `Booking: ${booking.confirmation_code}`,
    });
  }

  return {
    bookingId: booking.id,
    confirmationCode: booking.confirmation_code || '',
    customerId,
    cardToken,
    pointsEarned,
    isNewCustomer,
    totalPriceCentavos,
  };
}

// ============================================
// GET BOOKING BY CONFIRMATION CODE
// ============================================

export async function getBookingByCode(code: string): Promise<BookingDetails | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      confirmation_code,
      booking_date,
      start_time,
      end_time,
      status,
      customer_name,
      customer_phone,
      customer_email,
      notes,
      created_at,
      nights,
      total_price_centavos,
      service:services(
        id,
        name,
        description,
        duration_minutes,
        price_centavos
      ),
      business:businesses(
        id,
        name,
        slug,
        phone,
        address
      )
    `)
    .eq('confirmation_code', code.toUpperCase())
    .single();

  if (error || !data) {
    return null;
  }

  const service = Array.isArray(data.service) ? data.service[0] : data.service;
  const business = Array.isArray(data.business) ? data.business[0] : data.business;

  if (!service || !business) {
    return null;
  }

  // Fetch addon selections for this booking
  const { data: addonSelections } = await supabase
    .from('booking_addon_selections')
    .select(`
      quantity,
      unit_price_centavos,
      addon:booking_addons(
        id,
        name
      )
    `)
    .eq('booking_id', data.id);

  const addons: BookingAddonDetail[] = (addonSelections || []).map((sel) => {
    const addon = Array.isArray(sel.addon) ? sel.addon[0] : sel.addon;
    return {
      id: addon?.id || '',
      name: addon?.name || '',
      quantity: sel.quantity || 1,
      unitPriceCentavos: sel.unit_price_centavos,
    };
  }).filter((a) => a.id);

  return {
    id: data.id,
    confirmationCode: data.confirmation_code || '',
    bookingDate: data.booking_date,
    startTime: data.start_time,
    endTime: data.end_time,
    status: data.status,
    customerName: data.customer_name,
    customerPhone: data.customer_phone,
    customerEmail: data.customer_email,
    notes: data.notes,
    createdAt: data.created_at || '',
    nights: data.nights,
    totalPriceCentavos: data.total_price_centavos,
    service: {
      id: service.id,
      name: service.name,
      description: service.description,
      durationMinutes: service.duration_minutes,
      priceCentavos: service.price_centavos,
    },
    business: {
      id: business.id,
      name: business.name,
      slug: business.slug,
      phone: business.phone,
      address: business.address,
    },
    addons,
  };
}

// ============================================
// GET BOOKINGS BY PHONE
// ============================================

export interface CustomerBookingSummary {
  id: string;
  confirmationCode: string;
  bookingDate: string;
  startTime: string;
  status: string;
  nights: number | null;
  totalPriceCentavos: number | null;
  service: {
    name: string;
    durationMinutes: number;
    priceCentavos: number | null;
  };
  addonsCount: number;
}

export async function getBookingsByPhone(
  businessId: string,
  phone: string
): Promise<CustomerBookingSummary[]> {
  const supabase = createServiceClient();
  const normalizedPhone = phone.replace(/\s+/g, '').replace(/[^0-9]/g, '');

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      confirmation_code,
      booking_date,
      start_time,
      status,
      nights,
      total_price_centavos,
      service:services(
        name,
        duration_minutes,
        price_centavos
      )
    `)
    .eq('business_id', businessId)
    .eq('customer_phone', normalizedPhone)
    .order('booking_date', { ascending: false })
    .order('start_time', { ascending: false });

  if (error || !data) {
    return [];
  }

  // Get addon counts for each booking
  const bookingIds = data.map((b) => b.id);
  const { data: addonCounts } = await supabase
    .from('booking_addon_selections')
    .select('booking_id')
    .in('booking_id', bookingIds);

  const addonCountMap = new Map<string, number>();
  if (addonCounts) {
    for (const addon of addonCounts) {
      addonCountMap.set(
        addon.booking_id,
        (addonCountMap.get(addon.booking_id) || 0) + 1
      );
    }
  }

  return data.map((booking) => {
    const service = Array.isArray(booking.service)
      ? booking.service[0]
      : booking.service;
    return {
      id: booking.id,
      confirmationCode: booking.confirmation_code || '',
      bookingDate: booking.booking_date,
      startTime: booking.start_time,
      status: booking.status,
      nights: booking.nights,
      totalPriceCentavos: booking.total_price_centavos,
      service: {
        name: service?.name || '',
        durationMinutes: service?.duration_minutes || 0,
        priceCentavos: service?.price_centavos || null,
      },
      addonsCount: addonCountMap.get(booking.id) || 0,
    };
  });
}

// ============================================
// GENERATE ICS CALENDAR FILE
// ============================================

export function generateCalendarFile(booking: BookingDetails): string {
  const formatICSDate = (date: string, time: string): string => {
    const d = new Date(`${date}T${time}`);
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const startDateTime = formatICSDate(booking.bookingDate, booking.startTime);
  const endDateTime = formatICSDate(booking.bookingDate, booking.endTime);

  const escapeICS = (str: string): string => {
    return str.replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n');
  };

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NoxaLoyalty//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${booking.confirmationCode}@noxaloyalty.com`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    `DTSTART:${startDateTime}`,
    `DTEND:${endDateTime}`,
    `SUMMARY:${escapeICS(booking.service.name)} at ${escapeICS(booking.business.name)}`,
    `DESCRIPTION:${escapeICS(`Booking: ${booking.confirmationCode}\\n${booking.service.description || ''}`)}`,
    booking.business.address ? `LOCATION:${escapeICS(booking.business.address)}` : '',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.filter(Boolean).join('\r\n');
}
