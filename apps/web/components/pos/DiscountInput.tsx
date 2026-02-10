'use client';

import { useState, useEffect } from 'react';
import { Percent, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { DiscountType } from '@/types/pos.types';

interface DiscountInputProps {
  subtotalCentavos: number;
  onDiscountChange: (centavos: number, type: DiscountType, reason?: string) => void;
  disabled?: boolean;
}

export function DiscountInput({ subtotalCentavos, onDiscountChange, disabled }: DiscountInputProps) {
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [reason, setReason] = useState('');

  // Calculate actual discount in centavos
  useEffect(() => {
    const value = parseFloat(discountValue) || 0;
    let discountCentavos = 0;

    if (discountType === 'percentage') {
      // Cap percentage at 100%
      const percentage = Math.min(value, 100);
      discountCentavos = Math.round((subtotalCentavos * percentage) / 100);
    } else {
      // Fixed amount in pesos, convert to centavos
      discountCentavos = Math.round(value * 100);
      // Cap at subtotal
      discountCentavos = Math.min(discountCentavos, subtotalCentavos);
    }

    onDiscountChange(discountCentavos, discountType, reason || undefined);
  }, [discountValue, discountType, subtotalCentavos, reason, onDiscountChange]);

  const handleClear = () => {
    setDiscountValue('');
    setReason('');
  };

  return (
    <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Discount</Label>
        {discountValue && (
          <Button variant="ghost" size="sm" onClick={handleClear} disabled={disabled}>
            Clear
          </Button>
        )}
      </div>

      {/* Discount Type Toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={discountType === 'percentage' ? 'default' : 'outline'}
          size="sm"
          className="flex-1"
          onClick={() => setDiscountType('percentage')}
          disabled={disabled}
        >
          <Percent className="h-4 w-4 mr-1" />
          Percentage
        </Button>
        <Button
          type="button"
          variant={discountType === 'fixed' ? 'default' : 'outline'}
          size="sm"
          className="flex-1"
          onClick={() => setDiscountType('fixed')}
          disabled={disabled}
        >
          <DollarSign className="h-4 w-4 mr-1" />
          Fixed (₱)
        </Button>
      </div>

      {/* Discount Value Input */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {discountType === 'percentage' ? '%' : '₱'}
        </span>
        <Input
          type="number"
          placeholder={discountType === 'percentage' ? '0' : '0.00'}
          value={discountValue}
          onChange={(e) => setDiscountValue(e.target.value)}
          disabled={disabled}
          className="pl-8"
          min="0"
          max={discountType === 'percentage' ? 100 : undefined}
          step={discountType === 'percentage' ? 1 : 0.01}
        />
      </div>

      {/* Reason (optional) */}
      <Input
        placeholder="Reason (optional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        disabled={disabled}
        className="text-sm"
      />
    </div>
  );
}
