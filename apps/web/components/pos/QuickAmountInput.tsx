'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface QuickAmountInputProps {
  onAdd: (name: string, priceCentavos: number) => void;
  disabled?: boolean;
}

export function QuickAmountInput({ onAdd, disabled }: QuickAmountInputProps) {
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');

  const handleAdd = () => {
    const pricePesos = parseFloat(amount);
    if (isNaN(pricePesos) || pricePesos <= 0) return;

    const priceCentavos = Math.round(pricePesos * 100);
    const itemName = name.trim() || 'Quick Sale';

    onAdd(itemName, priceCentavos);
    setAmount('');
    setName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Quick Amount</label>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Item name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="flex-1"
        />
        <div className="relative w-32">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₱</span>
          <Input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="pl-7"
            min="0"
            step="0.01"
          />
        </div>
        <Button
          onClick={handleAdd}
          disabled={disabled || !amount || parseFloat(amount) <= 0}
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>
    </div>
  );
}
