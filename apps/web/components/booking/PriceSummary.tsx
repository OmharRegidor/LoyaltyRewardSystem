// apps/web/components/booking/PriceSummary.tsx
'use client';

import { format } from 'date-fns';
import {
  CalendarDays,
  Users,
  Gift,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface SelectedAddon {
  id: string;
  name: string;
  priceCentavos: number;
  priceType: 'fixed' | 'per_day' | 'per_person';
  quantity: number;
}

interface PriceSummaryProps {
  serviceName: string | null;
  checkInDate: Date | null;
  checkOutDate: Date | null;
  selectedTime: string | null;
  nights: number;
  adultsCount: number;
  childrenCount: number;
  serviceSubtotal: number;
  selectedAddons: SelectedAddon[];
  addonsTotal: number;
  total: number;
  pointsEstimate: number;
  isMultiDay: boolean;
  isValid: boolean;
  isSubmitting: boolean;
  onConfirm: () => void;
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
  serviceName,
  checkInDate,
  checkOutDate,
  selectedTime,
  nights,
  adultsCount,
  childrenCount,
  serviceSubtotal,
  selectedAddons,
  addonsTotal,
  total,
  pointsEstimate,
  isMultiDay,
  isValid,
  isSubmitting,
  onConfirm,
  className,
}: PriceSummaryProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const totalGuests = adultsCount + childrenCount;

  return (
    <div
      className={cn(
        'bg-card border rounded-xl shadow-sm overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Booking Summary</h3>
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
          {serviceName && (
            <div className="space-y-2">
              <p className="font-medium">{serviceName}</p>

              {checkInDate && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
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

              {totalGuests > 1 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>
                    {adultsCount} adult{adultsCount !== 1 ? 's' : ''}
                    {childrenCount > 0 && (
                      <>, {childrenCount} child{childrenCount !== 1 ? 'ren' : ''}</>
                    )}
                  </span>
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
                  {serviceName}
                  {nights > 1 && ` (${nights} nights)`}
                </span>
                <span>{formatPrice(serviceSubtotal)}</span>
              </div>
            )}

            {/* Add-ons */}
            {selectedAddons.length > 0 && (
              <div className="space-y-1">
                {selectedAddons.map((addon) => (
                  <div
                    key={addon.id}
                    className="flex justify-between text-sm text-muted-foreground"
                  >
                    <span>
                      {addon.name}
                      {addon.quantity > 1 && ` x${addon.quantity}`}
                    </span>
                    <span>
                      {formatPrice(addon.priceCentavos * addon.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Add-ons subtotal if there are add-ons */}
            {addonsTotal > 0 && (
              <div className="flex justify-between text-sm pt-1">
                <span className="text-muted-foreground">Add-ons subtotal</span>
                <span>{formatPrice(addonsTotal)}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="font-semibold text-lg">Total</span>
            <span className="font-bold text-xl text-primary">
              {formatPrice(total)}
            </span>
          </div>

          {/* Points earned preview */}
          {pointsEstimate > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <Gift className="h-4 w-4 text-primary" />
              <span className="text-sm">
                You&apos;ll earn{' '}
                <span className="font-semibold text-primary">
                  {pointsEstimate} point{pointsEstimate !== 1 ? 's' : ''}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Confirm Button */}
        <div className="p-4 pt-0">
          <Button
            onClick={onConfirm}
            disabled={!isValid || isSubmitting}
            className="w-full h-12 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold text-base"
          >
            {isSubmitting ? 'Confirming...' : 'Confirm Booking'}
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-3">
            By booking, you agree to our terms & conditions
          </p>
        </div>
      </div>

      {/* Collapsed state shows total on mobile */}
      {isCollapsed && (
        <div className="p-4 md:hidden flex items-center justify-between">
          <span className="font-semibold">Total</span>
          <span className="font-bold text-lg text-primary">
            {formatPrice(total)}
          </span>
        </div>
      )}
    </div>
  );
}
