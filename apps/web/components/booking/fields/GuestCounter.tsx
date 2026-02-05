// apps/web/components/booking/fields/GuestCounter.tsx
'use client';

import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface GuestCounterProps {
  adultsCount: number;
  childrenCount: number;
  maxGuests: number;
  onAdultsChange: (count: number) => void;
  onChildrenChange: (count: number) => void;
  onIncrementAdults: () => void;
  onDecrementAdults: () => void;
  onIncrementChildren: () => void;
  onDecrementChildren: () => void;
  disabled?: boolean;
  className?: string;
}

export function GuestCounter({
  adultsCount,
  childrenCount,
  maxGuests,
  onIncrementAdults,
  onDecrementAdults,
  onIncrementChildren,
  onDecrementChildren,
  disabled = false,
  className,
}: GuestCounterProps) {
  const totalGuests = adultsCount + childrenCount;
  const canAddMoreGuests = totalGuests < maxGuests;

  return (
    <div className={cn('space-y-1', className)}>
      <Label className="text-xs text-gray-500">Guests</Label>

      <div className="flex items-center gap-4">
        {/* Adults */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-700">Adults:</span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={onDecrementAdults}
              disabled={disabled || adultsCount <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-6 text-center text-sm text-gray-900">{adultsCount}</span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={onIncrementAdults}
              disabled={disabled || !canAddMoreGuests}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Children */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-700">Children:</span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={onDecrementChildren}
              disabled={disabled || childrenCount <= 0}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-6 text-center text-sm text-gray-900">{childrenCount}</span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={onIncrementChildren}
              disabled={disabled || !canAddMoreGuests}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Max {maxGuests} guest{maxGuests !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
