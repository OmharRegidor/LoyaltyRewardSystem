'use client';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

import { BookingForm } from '@/components/booking/BookingForm';

import type {
  ServiceFormData,
  BusinessType,
  HotelConfig,
  RestaurantConfig,
} from '@/types/booking.types';

interface PreviewPanelProps {
  formData: ServiceFormData;
  businessType: BusinessType | null;
}

function formatPrice(pesos: number | null): string {
  if (pesos === null || pesos === 0) return 'Free';
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(pesos);
}

// No-op handlers for disabled preview mode
const noop = () => {};

export function PreviewPanel({ formData, businessType }: PreviewPanelProps) {
  // Extract config values for preview
  const serviceConfig = formData.config || null;
  const hotelConfig = businessType === 'hotel' ? (serviceConfig as HotelConfig) : null;
  const restaurantConfig = businessType === 'restaurant' ? (serviceConfig as RestaurantConfig) : null;

  // Convert price_variants to the format BookingForm expects
  const variants = (formData.price_variants || [])
    .filter((v) => v.name)
    .map((v, index) => ({
      id: v.id || `preview-variant-${index}`,
      name: v.name,
      price_centavos: v.price_centavos,
      description: v.description,
      capacity: v.capacity,
    }));

  // Calculate max guests from config
  const maxGuests = hotelConfig?.capacity_max || 4;

  // Party size defaults
  const minPartySize = restaurantConfig?.party_size_min || 1;
  const maxPartySize = restaurantConfig?.party_size_max || 20;
  const defaultPartySize = Math.max(2, minPartySize);

  return (
    <div className="sticky top-4 h-fit rounded-lg border border-gray-900 bg-white shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-900">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Customer Preview</h3>
          <Badge className="text-xs bg-yellow-400 text-gray-900 hover:bg-yellow-500">
            Live Preview
          </Badge>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          This is what customers will see when booking
        </p>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Use the actual BookingForm component in disabled mode */}
        <BookingForm
          disabled={true}
          businessType={businessType}
          serviceConfig={serviceConfig}
          serviceId={null}
          variants={variants}
          selectedVariant={null}
          onVariantSelect={noop}
          checkInDate={null}
          checkOutDate={null}
          selectedTime={null}
          onCheckInChange={noop}
          onCheckOutChange={noop}
          onTimeChange={noop}
          adultsCount={2}
          childrenCount={0}
          maxGuests={maxGuests}
          onAdultsChange={noop}
          onChildrenChange={noop}
          onIncrementAdults={noop}
          onDecrementAdults={noop}
          onIncrementChildren={noop}
          onDecrementChildren={noop}
          partySize={defaultPartySize}
          onPartySizeChange={noop}
          addons={[]}
          selectedAddons={[]}
          onAddonToggle={noop}
          onAddonQuantityChange={noop}
          phone=""
          name=""
          email=""
          specialRequests=""
          onPhoneChange={noop}
          onNameChange={noop}
          onEmailChange={noop}
          onSpecialRequestsChange={noop}
          businessSlug=""
          closedDaysOfWeek={[]}
          className="preview-form"
        />

        {/* Price Summary Preview */}
        {formData.price !== null && formData.price > 0 && (
          <>
            <Separator className="bg-gray-900" />
            <div className="p-3 rounded-lg bg-yellow-50 border border-gray-900">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Estimated Total</span>
                <span className="font-bold text-gray-900">{formatPrice(formData.price)}</span>
              </div>
            </div>
          </>
        )}

        {/* Book Button (Disabled Preview) */}
        <Button
          className="w-full bg-yellow-400 text-gray-900 font-semibold hover:bg-yellow-500 border border-gray-900"
          disabled
        >
          Book Now
        </Button>
      </div>
    </div>
  );
}
