'use client';

import { Star } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { CartItem } from '@/types/pos.types';

interface SaleSummaryProps {
  items: CartItem[];
  discountCentavos: number;
  pointsEarned: number;
  hasCustomer: boolean;
}

function formatPrice(centavos: number): string {
  return `₱${(centavos / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

export function SaleSummary({ items, discountCentavos, pointsEarned, hasCustomer }: SaleSummaryProps) {
  const subtotalCentavos = items.reduce(
    (sum, item) => sum + item.unit_price_centavos * item.quantity,
    0
  );
  const totalCentavos = Math.max(0, subtotalCentavos - discountCentavos);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
        <span>{formatPrice(subtotalCentavos)}</span>
      </div>

      {discountCentavos > 0 && (
        <div className="flex justify-between text-sm text-green-600">
          <span>Discount</span>
          <span>-{formatPrice(discountCentavos)}</span>
        </div>
      )}

      <Separator />

      <div className="flex justify-between text-lg font-bold">
        <span>Total</span>
        <span>{formatPrice(totalCentavos)}</span>
      </div>

      {hasCustomer && pointsEarned > 0 && (
        <div className="flex items-center justify-between text-sm bg-primary/10 text-primary p-2 rounded-md">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4" />
            <span>Points to earn</span>
          </div>
          <span className="font-medium">+{pointsEarned}</span>
        </div>
      )}

      {hasCustomer && pointsEarned === 0 && subtotalCentavos > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Minimum purchase not met for points
        </p>
      )}

      {!hasCustomer && subtotalCentavos > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Link a customer to earn points
        </p>
      )}
    </div>
  );
}
