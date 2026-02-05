// apps/web/components/booking/PriceSummary.tsx
'use client';

import { format } from 'date-fns';
import {
  CalendarDays,
  Users,
  Gift,
  ChevronDown,
  ChevronUp,
  Phone,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface SelectedAddonOption {
  id: string;
  name: string;
  priceCentavos: number;
}

interface SelectedAddon {
  id: string;
  name: string;
  priceCentavos: number;
  priceType: 'fixed' | 'per_day' | 'per_person';
  quantity: number;
  selectedOption?: SelectedAddonOption;
}

interface PriceVariant {
  id: string;
  name: string;
  price_centavos: number;
  description: string | null;
  capacity: number | null;
}

type BusinessType = 'retail' | 'restaurant' | 'salon' | 'hotel';

interface PriceSummaryProps {
  businessType?: BusinessType | null;
  serviceName: string | null;
  selectedVariant?: PriceVariant | null;
  checkInDate: Date | null;
  checkOutDate: Date | null;
  selectedTime: string | null;
  nights: number;
  adultsCount: number;
  childrenCount: number;
  partySize?: number;
  serviceSubtotal: number;
  selectedAddons: SelectedAddon[];
  addonsTotal: number;
  total: number;
  pointsEstimate: number;
  isMultiDay: boolean;
  isValid: boolean;
  isSubmitting: boolean;
  onConfirm: () => void;
  businessPhone?: string | null;
  className?: string;
}

function formatPrice(centavos: number): string {
  const pesos = centavos / 100;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(pesos);
}

function formatTimeForDisplay(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export function PriceSummary({
  businessType,
  serviceName,
  selectedVariant,
  checkInDate,
  checkOutDate,
  selectedTime,
  nights,
  adultsCount,
  childrenCount,
  partySize,
  serviceSubtotal,
  selectedAddons,
  addonsTotal,
  total,
  pointsEstimate,
  isMultiDay,
  isValid,
  isSubmitting,
  onConfirm,
  businessPhone,
  className,
}: PriceSummaryProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const totalGuests = adultsCount + childrenCount;

  // Display name: variant name for hotels, service name for others
  const displayName = selectedVariant?.name || serviceName;

  return (
    <div
      className={cn(
        'bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg text-gray-900">Booking Summary</h3>
          {/* Mobile collapse toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Content - collapsible on mobile */}
      <div
        className={cn(
          'transition-all duration-300 overflow-hidden',
          isCollapsed ? 'max-h-0 md:max-h-none' : 'max-h-[2000px]'
        )}
      >
        <div className="p-4 space-y-4">
          {/* Service & Date Summary */}
          {displayName && (
            <div className="space-y-2">
              <p className="font-medium text-gray-900">{displayName}</p>

              {/* Show service name if variant is selected */}
              {selectedVariant && serviceName && (
                <p className="text-sm text-gray-500">
                  {serviceName}
                </p>
              )}

              {checkInDate && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CalendarDays className="h-4 w-4" />
                  <span>
                    {format(checkInDate, 'MMM d')}
                    {isMultiDay && checkOutDate && (
                      <> - {format(checkOutDate, 'MMM d, yyyy')}</>
                    )}
                    {!isMultiDay && <>, {format(checkInDate, 'yyyy')}</>}
                  </span>
                </div>
              )}

              {selectedTime && (
                <Badge variant="outline" className="text-xs">
                  {formatTimeForDisplay(selectedTime)}
                </Badge>
              )}

              {isMultiDay && nights > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {nights} night{nights !== 1 ? 's' : ''}
                </Badge>
              )}

              {/* Hotel guests */}
              {businessType === 'hotel' && totalGuests > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users className="h-4 w-4" />
                  <span>
                    {adultsCount} adult{adultsCount !== 1 ? 's' : ''}
                    {childrenCount > 0 && (
                      <>, {childrenCount} child{childrenCount !== 1 ? 'ren' : ''}</>
                    )}
                  </span>
                </div>
              )}

              {/* Restaurant party size */}
              {businessType === 'restaurant' && partySize && partySize > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users className="h-4 w-4" />
                  <span>Party of {partySize}</span>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Price Breakdown */}
          <div className="space-y-2">
            {/* Service price */}
            {serviceSubtotal > 0 && (
              <div className="flex justify-between text-sm">
                <span>
                  {selectedVariant?.name || serviceName}
                  {nights > 1 && ` (${nights} nights)`}
                </span>
                <span>{formatPrice(serviceSubtotal)}</span>
              </div>
            )}

            {/* Add-ons */}
            {selectedAddons.length > 0 && (
              <div className="space-y-1">
                {selectedAddons.map((addon) => {
                  const displayOption = addon.selectedOption;
                  const displayPrice = displayOption?.priceCentavos ?? addon.priceCentavos;
                  const displayName = displayOption
                    ? `${addon.name} - ${displayOption.name}`
                    : addon.name;

                  return (
                    <div
                      key={addon.id}
                      className="flex justify-between text-sm text-gray-500"
                    >
                      <span>
                        {displayName}
                        {!displayOption && addon.quantity > 1 && ` x${addon.quantity}`}
                      </span>
                      <span>
                        {formatPrice(displayOption ? displayPrice : displayPrice * addon.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add-ons subtotal if there are add-ons */}
            {addonsTotal > 0 && (
              <div className="flex justify-between text-sm pt-1">
                <span className="text-gray-500">Add-ons subtotal</span>
                <span>{formatPrice(addonsTotal)}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="font-semibold text-lg text-gray-900">Total</span>
            <span className="font-bold text-xl text-gray-900">
              {formatPrice(total)}
            </span>
          </div>

          {/* Points earned preview */}
          {pointsEstimate > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <Gift className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-gray-700">
                You&apos;ll earn{' '}
                <span className="font-semibold text-gray-900">
                  {pointsEstimate} point{pointsEstimate !== 1 ? 's' : ''}
                </span>
              </span>
            </div>
          )}

          {/* Confirmation note */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200">
            <Info className="h-4 w-4 text-gray-500 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500">
              This is a reservation request. We&apos;ll confirm your booking within 24 hours.
            </p>
          </div>

          {/* Business contact */}
          {businessPhone && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Phone className="h-3 w-3" />
              <span>Questions? Call {businessPhone}</span>
            </div>
          )}
        </div>

        {/* Confirm Button */}
        <div className="p-4 pt-0">
          <Button
            onClick={onConfirm}
            disabled={!isValid || isSubmitting}
            className="w-full h-12 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-base border border-gray-900"
          >
            {isSubmitting ? 'Confirming...' : 'Confirm Booking'}
          </Button>

          <p className="text-xs text-center text-gray-500 mt-3">
            By booking, you agree to our terms & conditions
          </p>
        </div>
      </div>

      {/* Collapsed state shows total on mobile */}
      {isCollapsed && (
        <div className="p-4 md:hidden flex items-center justify-between">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="font-bold text-lg text-gray-900">
            {formatPrice(total)}
          </span>
        </div>
      )}
    </div>
  );
}
