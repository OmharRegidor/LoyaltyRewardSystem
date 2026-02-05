// apps/web/components/booking/fields/GuestCounter.tsx
'use client';

import { Users, Minus, Plus } from 'lucide-react';
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
  className,
}: GuestCounterProps) {
  const totalGuests = adultsCount + childrenCount;
  const canAddMoreGuests = totalGuests < maxGuests;

  return (
    <div className={cn('space-y-3', className)}>
      <Label className="flex items-center gap-2 text-sm font-medium">
        <Users className="h-4 w-4 text-muted-foreground" />
        Guests
        <span className="text-xs text-muted-foreground font-normal ml-auto">
          Max {maxGuests} guest{maxGuests !== 1 ? 's' : ''}
        </span>
      </Label>

      <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
        {/* Adults */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Adults</p>
            <p className="text-xs text-muted-foreground">Ages 13+</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={onDecrementAdults}
              disabled={adultsCount <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center font-medium">{adultsCount}</span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={onIncrementAdults}
              disabled={!canAddMoreGuests}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Children */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Children</p>
            <p className="text-xs text-muted-foreground">Ages 0-12</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={onDecrementChildren}
              disabled={childrenCount <= 0}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center font-medium">{childrenCount}</span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={onIncrementChildren}
              disabled={!canAddMoreGuests}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Total summary */}
        <div className="pt-2 border-t text-xs text-muted-foreground">
          Total: {totalGuests} guest{totalGuests !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
