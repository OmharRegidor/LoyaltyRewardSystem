// apps/web/hooks/useBookingForm.ts
'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { differenceInDays } from 'date-fns';

// ============================================
// TYPES
// ============================================

export interface PublicAvailability {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface BookingService {
  id: string;
  name: string;
  description: string | null;
  price_centavos: number | null;
  duration_minutes: number;
  max_guests: number;
  requires_time_slot: boolean;
  price_type: 'per_night' | 'per_session' | 'per_hour';
}

export interface AddonOption {
  id: string;
  name: string;
  price_centavos: number;
  description: string | null;
}

export interface BookingAddon {
  id: string;
  name: string;
  description: string | null;
  price_centavos: number;
  price_type: 'fixed' | 'per_day' | 'per_person';
  service_id: string | null;
  options?: AddonOption[];
}

export interface PriceVariant {
  id: string;
  name: string;
  price_centavos: number;
  description: string | null;
  capacity: number | null;
}

export interface SelectedAddon {
  id: string;
  name: string;
  priceCentavos: number;
  priceType: 'fixed' | 'per_day' | 'per_person';
  quantity: number;
  selectedOption?: {
    id: string;
    name: string;
    priceCentavos: number;
  };
}

export interface ContactInfo {
  phone: string;
  name: string;
  email: string;
}

export interface BookingFormState {
  // Service selection
  selectedService: BookingService | null;
  selectedVariant: PriceVariant | null;

  // Dates
  checkInDate: Date | null;
  checkOutDate: Date | null;
  selectedTime: string | null;

  // Guests
  adultsCount: number;
  childrenCount: number;
  partySize: number;

  // Add-ons
  selectedAddons: SelectedAddon[];

  // Contact
  contact: ContactInfo;
  specialRequests: string;

  // UI state
  isSubmitting: boolean;
  error: string | null;
}

export interface BookingPriceBreakdown {
  serviceSubtotal: number;
  addonsTotal: number;
  total: number;
  nights: number;
  pointsEstimate: number;
}

export type BusinessType = 'retail' | 'restaurant' | 'salon' | 'hotel';

// Service config from business form settings
export interface ServiceConfig {
  // Restaurant config
  party_size_min?: number;
  party_size_max?: number;
  time_interval_minutes?: number;
  slot_duration_minutes?: number;
  // Hotel config
  capacity_base?: number;
  capacity_max?: number;
  check_in_time?: string;
  check_out_time?: string;
  min_stay_nights?: number;
  max_stay_nights?: number;
  advance_booking_days?: number;
  // Allow additional properties from database
  [key: string]: unknown;
}

export interface UseBookingFormOptions {
  services: BookingService[];
  addons: BookingAddon[];
  pointsPerPurchase: number | null;
  pesosPerPoint: number | null;
  initialServiceId?: string | null;
  businessType?: BusinessType | null;
  priceVariants?: PriceVariant[];
  serviceConfig?: ServiceConfig | Record<string, unknown> | null;
}

export interface UseBookingFormReturn {
  state: BookingFormState;

  // Service actions
  selectService: (service: BookingService | null) => void;
  selectVariant: (variant: PriceVariant | null) => void;

  // Date actions
  setCheckInDate: (date: Date | null) => void;
  setCheckOutDate: (date: Date | null) => void;
  setSelectedTime: (time: string | null) => void;

  // Guest actions
  setAdultsCount: (count: number) => void;
  setChildrenCount: (count: number) => void;
  incrementAdults: () => void;
  decrementAdults: () => void;
  incrementChildren: () => void;
  decrementChildren: () => void;
  setPartySize: (size: number) => void;

  // Addon actions
  toggleAddon: (addon: BookingAddon) => void;
  setAddonQuantity: (addonId: string, quantity: number) => void;
  setAddonOption: (addonId: string, option: { id: string; name: string; priceCentavos: number } | null) => void;

  // Contact actions
  setPhone: (phone: string) => void;
  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setSpecialRequests: (requests: string) => void;

  // Form actions
  setError: (error: string | null) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  reset: () => void;

  // Computed values
  priceBreakdown: BookingPriceBreakdown;
  isValid: boolean;
  availableAddons: BookingAddon[];

  // Service type helpers
  isMultiDay: boolean;
  isTimeBased: boolean;
  requiresTimeSlot: boolean;
  maxGuests: number;
  businessType: BusinessType | null;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getServiceType(durationMinutes: number): 'multi-day' | 'full-day' | 'time-based' {
  if (durationMinutes >= 2880) return 'multi-day';
  if (durationMinutes >= 1440) return 'full-day';
  return 'time-based';
}

function calculateNights(checkIn: Date | null, checkOut: Date | null): number {
  if (!checkIn || !checkOut) return 1;
  const nights = differenceInDays(checkOut, checkIn);
  return nights > 0 ? nights : 1;
}

// ============================================
// HOOK
// ============================================

export function useBookingForm(options: UseBookingFormOptions): UseBookingFormReturn {
  const { services, addons, pointsPerPurchase, pesosPerPoint, initialServiceId, businessType: initialBusinessType, serviceConfig } = options;

  // Initial service from prop
  const initialService = initialServiceId
    ? services.find((s) => s.id === initialServiceId) || null
    : null;

  const businessType = initialBusinessType || null;

  // Cast config for type-safe access
  const config = serviceConfig as ServiceConfig | null;

  // Get initial values from config
  const getInitialAdultsCount = () => {
    if (businessType === 'hotel' && config?.capacity_base) {
      return config.capacity_base;
    }
    return 1;
  };

  const getInitialPartySize = () => {
    if (businessType === 'restaurant' && config?.party_size_min) {
      return config.party_size_min;
    }
    return 2;
  };

  // State
  const [selectedService, setSelectedService] = useState<BookingService | null>(initialService);
  const [selectedVariant, setSelectedVariant] = useState<PriceVariant | null>(null);
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [adultsCount, setAdultsCount] = useState(getInitialAdultsCount);
  const [childrenCount, setChildrenCount] = useState(0);
  const [partySize, setPartySize] = useState(getInitialPartySize);
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
  const [contact, setContact] = useState<ContactInfo>({ phone: '', name: '', email: '' });
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset dates and time when service changes
  useEffect(() => {
    setCheckInDate(null);
    setCheckOutDate(null);
    setSelectedTime(null);
    setSelectedAddons([]);
    setSelectedVariant(null);
  }, [selectedService?.id]);

  // Computed: Service type helpers
  const serviceType = selectedService
    ? getServiceType(selectedService.duration_minutes)
    : null;
  const isMultiDay = serviceType === 'multi-day';
  const isTimeBased = serviceType === 'time-based';
  const requiresTimeSlot = selectedService?.requires_time_slot ?? isTimeBased;
  // Use config capacity_max for hotels, otherwise fallback to service max_guests or default
  const maxGuests = config?.capacity_max || selectedService?.max_guests || 10;

  // Computed: Available addons for selected service
  const availableAddons = useMemo(() => {
    if (!selectedService) return [];
    return addons.filter(
      (addon) => addon.service_id === null || addon.service_id === selectedService.id
    );
  }, [addons, selectedService]);

  // Computed: Price breakdown
  const priceBreakdown = useMemo((): BookingPriceBreakdown => {
    if (!selectedService) {
      return { serviceSubtotal: 0, addonsTotal: 0, total: 0, nights: 1, pointsEstimate: 0 };
    }

    // For multi-day bookings (hotels), calculate nights from dates
    // Use 1 night as default when dates not yet selected to show base price
    const nights = isMultiDay
      ? (checkInDate && checkOutDate ? calculateNights(checkInDate, checkOutDate) : 1)
      : 1;
    const totalGuests = adultsCount + childrenCount;

    // Service subtotal - use variant price if selected, otherwise service price
    const servicePrice = selectedVariant?.price_centavos ?? selectedService.price_centavos ?? 0;
    const serviceSubtotal = servicePrice * nights;

    // Addons total
    let addonsTotal = 0;
    for (const addon of selectedAddons) {
      // Use selected option price if available, otherwise addon base price
      const unitPrice = addon.selectedOption?.priceCentavos ?? addon.priceCentavos;
      let addonPrice = unitPrice * addon.quantity;

      switch (addon.priceType) {
        case 'per_day':
          addonPrice *= nights;
          break;
        case 'per_person':
          addonPrice *= totalGuests;
          break;
        // 'fixed' stays as is
      }

      addonsTotal += addonPrice;
    }

    const total = serviceSubtotal + addonsTotal;

    // Points estimate
    const perPoint = pesosPerPoint || 100;
    const perPurchase = pointsPerPurchase || 1;
    const totalPesos = total / 100;
    const pointsEstimate = Math.floor(totalPesos / perPoint) * perPurchase;

    return {
      serviceSubtotal,
      addonsTotal,
      total,
      nights,
      pointsEstimate,
    };
  }, [
    selectedService,
    selectedVariant,
    isMultiDay,
    checkInDate,
    checkOutDate,
    adultsCount,
    childrenCount,
    selectedAddons,
    pointsPerPurchase,
    pesosPerPoint,
  ]);

  // Computed: Form validation
  const isValid = useMemo(() => {
    if (!selectedService) return false;
    if (!checkInDate) return false;
    if (isMultiDay && !checkOutDate) return false;
    if (requiresTimeSlot && !selectedTime) return false;
    if (!contact.phone || contact.phone.length < 10) return false;
    if (!contact.name || contact.name.trim().length < 2) return false;

    // Business-type specific validation
    if (businessType === 'restaurant') {
      if (partySize < 1) return false;
    }

    return true;
  }, [selectedService, checkInDate, checkOutDate, isMultiDay, requiresTimeSlot, selectedTime, contact, businessType, partySize]);

  // Actions
  const selectService = useCallback((service: BookingService | null) => {
    setSelectedService(service);
    setSelectedVariant(null);
    setError(null);
  }, []);

  const selectVariant = useCallback((variant: PriceVariant | null) => {
    setSelectedVariant(variant);
  }, []);

  const incrementAdults = useCallback(() => {
    setAdultsCount((prev) => Math.min(prev + 1, maxGuests));
  }, [maxGuests]);

  const decrementAdults = useCallback(() => {
    setAdultsCount((prev) => Math.max(1, prev - 1));
  }, []);

  const incrementChildren = useCallback(() => {
    const total = adultsCount + childrenCount;
    if (total < maxGuests) {
      setChildrenCount((prev) => prev + 1);
    }
  }, [adultsCount, childrenCount, maxGuests]);

  const decrementChildren = useCallback(() => {
    setChildrenCount((prev) => Math.max(0, prev - 1));
  }, []);

  const toggleAddon = useCallback((addon: BookingAddon) => {
    setSelectedAddons((prev) => {
      const exists = prev.find((a) => a.id === addon.id);
      if (exists) {
        return prev.filter((a) => a.id !== addon.id);
      }
      return [
        ...prev,
        {
          id: addon.id,
          name: addon.name,
          priceCentavos: addon.price_centavos,
          priceType: addon.price_type,
          quantity: 1,
        },
      ];
    });
  }, []);

  const setAddonQuantity = useCallback((addonId: string, quantity: number) => {
    setSelectedAddons((prev) =>
      prev.map((a) =>
        a.id === addonId ? { ...a, quantity: Math.max(1, Math.min(99, quantity)) } : a
      )
    );
  }, []);

  const setAddonOption = useCallback(
    (addonId: string, option: { id: string; name: string; priceCentavos: number } | null) => {
      setSelectedAddons((prev) =>
        prev.map((a) =>
          a.id === addonId ? { ...a, selectedOption: option || undefined } : a
        )
      );
    },
    []
  );

  const setPhone = useCallback((phone: string) => {
    setContact((prev) => ({ ...prev, phone }));
  }, []);

  const setName = useCallback((name: string) => {
    setContact((prev) => ({ ...prev, name }));
  }, []);

  const setEmail = useCallback((email: string) => {
    setContact((prev) => ({ ...prev, email }));
  }, []);

  const reset = useCallback(() => {
    setSelectedService(initialService);
    setSelectedVariant(null);
    setCheckInDate(null);
    setCheckOutDate(null);
    setSelectedTime(null);
    setAdultsCount(getInitialAdultsCount());
    setChildrenCount(0);
    setPartySize(getInitialPartySize());
    setSelectedAddons([]);
    setContact({ phone: '', name: '', email: '' });
    setSpecialRequests('');
    setIsSubmitting(false);
    setError(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialService, serviceConfig]);

  // Build state object
  const state: BookingFormState = {
    selectedService,
    selectedVariant,
    checkInDate,
    checkOutDate,
    selectedTime,
    adultsCount,
    childrenCount,
    partySize,
    selectedAddons,
    contact,
    specialRequests,
    isSubmitting,
    error,
  };

  return {
    state,

    // Service actions
    selectService,
    selectVariant,

    // Date actions
    setCheckInDate,
    setCheckOutDate,
    setSelectedTime,

    // Guest actions
    setAdultsCount,
    setChildrenCount,
    incrementAdults,
    decrementAdults,
    incrementChildren,
    decrementChildren,
    setPartySize,

    // Addon actions
    toggleAddon,
    setAddonQuantity,
    setAddonOption,

    // Contact actions
    setPhone,
    setName,
    setEmail,
    setSpecialRequests,

    // Form actions
    setError,
    setIsSubmitting,
    reset,

    // Computed values
    priceBreakdown,
    isValid,
    availableAddons,

    // Service type helpers
    isMultiDay,
    isTimeBased,
    requiresTimeSlot,
    maxGuests,
    businessType,
  };
}
