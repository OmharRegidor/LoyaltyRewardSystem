// apps/web/app/api/public/business/[slug]/booking-config/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { getBusinessBySlug } from '@/lib/services/public-business.service';
import { checkModuleAccess } from '@/lib/feature-gate';

// ============================================
// TYPES
// ============================================

interface ServiceAddon {
  id: string;
  name: string;
  description: string | null;
  price_centavos: number;
  price_type: 'fixed' | 'per_day' | 'per_person';
  service_id: string | null;
}

interface BookingService {
  id: string;
  name: string;
  description: string | null;
  price_centavos: number | null;
  duration_minutes: number;
  max_guests: number;
  requires_time_slot: boolean;
  price_type: 'per_night' | 'per_session' | 'per_hour';
}

interface BusinessHours {
  [key: string]: { open: string; close: string } | null;
}

interface BookingConfig {
  business: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    phone: string | null;
    address: string | null;
    points_per_purchase: number | null;
    pesos_per_point: number | null;
  };
  services: BookingService[];
  addons: ServiceAddon[];
  availability: {
    blocked_dates: string[];
    business_hours: BusinessHours;
  };
}

// ============================================
// GET: Fetch booking configuration
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // 1. Get business by slug
    const business = await getBusinessBySlug(slug);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // 1b. Check booking module access
    const { allowed: hasBooking } = await checkModuleAccess(business.id, 'booking');
    if (!hasBooking) {
      return NextResponse.json(
        { error: 'Booking is not available for this business.' },
        { status: 403 }
      );
    }

    const supabase = createServiceClient();

    // 2. Get services (using existing columns - max_guests and requires_time_slot may not exist yet)
    const { data: servicesData } = await supabase
      .from('services')
      .select('id, name, description, price_centavos, duration_minutes')
      .eq('business_id', business.id)
      .eq('is_active', true)
      .order('name');

    const services: BookingService[] = (servicesData || []).map((s) => {
      // Determine price type based on duration
      let priceType: 'per_night' | 'per_session' | 'per_hour' = 'per_session';
      if (s.duration_minutes >= 1440) {
        priceType = 'per_night';
      } else if (s.duration_minutes < 60) {
        priceType = 'per_hour';
      }

      // Use defaults since max_guests and requires_time_slot columns may not exist yet
      const serviceWithDefaults = s as typeof s & { max_guests?: number; requires_time_slot?: boolean };

      return {
        id: s.id,
        name: s.name,
        description: s.description,
        price_centavos: s.price_centavos,
        duration_minutes: s.duration_minutes,
        max_guests: serviceWithDefaults.max_guests || 1,
        requires_time_slot: serviceWithDefaults.requires_time_slot ?? (s.duration_minutes < 1440),
        price_type: priceType,
      };
    });

    // 3. Get addons - use booking_addons table (service_addons table may not exist yet)
    let addons: ServiceAddon[] = [];

    // Use booking_addons table which already exists
    const { data: bookingAddonsData } = await supabase
      .from('booking_addons')
      .select('id, name, description, price_centavos')
      .eq('business_id', business.id)
      .eq('is_active', true)
      .order('sort_order')
      .order('name');

    if (bookingAddonsData) {
      addons = bookingAddonsData.map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        price_centavos: a.price_centavos,
        price_type: 'fixed' as const,
        service_id: null,
      }));
    }

    // 4. Get availability (business hours)
    const { data: availabilityData } = await supabase
      .from('availability')
      .select('day_of_week, start_time, end_time, is_available')
      .eq('business_id', business.id)
      .is('branch_id', null)
      .is('staff_id', null)
      .order('day_of_week');

    // Build business hours map
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const businessHours: BusinessHours = {};

    for (const day of dayNames) {
      businessHours[day] = null;
    }

    if (availabilityData) {
      for (const av of availabilityData) {
        const dayName = dayNames[av.day_of_week];
        if (av.is_available) {
          businessHours[dayName] = {
            open: av.start_time,
            close: av.end_time,
          };
        }
      }
    }

    // 5. Get blocked dates (existing bookings for next 90 days for full-day services)
    // This is a simplified version - in production you might want to be more specific
    const today = new Date();
    const ninetyDaysLater = new Date(today);
    ninetyDaysLater.setDate(ninetyDaysLater.getDate() + 90);

    const blockedDates: string[] = [];

    // Note: For a more complete implementation, you'd check bookings against
    // specific services and their capacity. This is a placeholder.

    // 6. Build response
    const config: BookingConfig = {
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        logo_url: business.logo_url,
        phone: business.phone,
        address: business.address,
        points_per_purchase: business.points_per_purchase,
        pesos_per_point: business.pesos_per_point,
      },
      services,
      addons,
      availability: {
        blocked_dates: blockedDates,
        business_hours: businessHours,
      },
    };

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Booking config error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking configuration' },
      { status: 500 }
    );
  }
}
