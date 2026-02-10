'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CashPaymentInputProps {
  totalCentavos: number;
  onTenderedChange: (amountCentavos: number) => void;
  disabled?: boolean;
}

function formatPrice(centavos: number): string {
  return `₱${(centavos / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

const quickAmounts = [20, 50, 100, 200, 500, 1000];

export function CashPaymentInput({ totalCentavos, onTenderedChange, disabled }: CashPaymentInputProps) {
  const [tenderedPesos, setTenderedPesos] = useState('');
  const totalPesos = totalCentavos / 100;

  const tenderedCentavos = parseFloat(tenderedPesos) * 100 || 0;
  const changeCentavos = tenderedCentavos - totalCentavos;

  useEffect(() => {
    onTenderedChange(tenderedCentavos);
  }, [tenderedCentavos, onTenderedChange]);

  const handleQuickAmount = (amount: number) => {
    setTenderedPesos(amount.toString());
  };

  const handleExactAmount = () => {
    setTenderedPesos(totalPesos.toFixed(2));
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium">Amount Tendered</label>
        <div className="relative mt-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₱</span>
          <Input
            type="number"
            placeholder="0.00"
            value={tenderedPesos}
            onChange={(e) => setTenderedPesos(e.target.value)}
            disabled={disabled}
            className="pl-7 text-lg"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {quickAmounts.map((amount) => (
          <Button
            key={amount}
            variant="outline"
            size="sm"
            onClick={() => handleQuickAmount(amount)}
            disabled={disabled || amount * 100 < totalCentavos}
          >
            ₱{amount}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExactAmount}
          disabled={disabled}
        >
          Exact
        </Button>
      </div>

      {tenderedCentavos > 0 && (
        <div className={`p-3 rounded-lg ${changeCentavos >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          <div className="flex justify-between">
            <span className="font-medium">Change</span>
            <span className="text-lg font-bold">
              {changeCentavos >= 0 ? formatPrice(changeCentavos) : `Short ${formatPrice(Math.abs(changeCentavos))}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
