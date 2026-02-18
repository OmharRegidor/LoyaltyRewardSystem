'use client';

import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CartItem } from '@/types/pos.types';

interface SaleItemListProps {
  items: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  disabled?: boolean;
}

function formatPrice(centavos: number): string {
  return `₱${(centavos / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

export function SaleItemList({ items, onUpdateQuantity, onRemoveItem, disabled }: SaleItemListProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <ShoppingCart className="h-12 w-12 mb-2" />
        <p>No items in sale</p>
        <p className="text-sm">Add products or enter a quick amount</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="p-3 bg-muted/30 rounded-lg space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium truncate">{item.name}</p>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onRemoveItem(item.id)}
              disabled={disabled}
              className="text-destructive hover:text-destructive shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          {item.description && (
            <p className="text-xs text-muted-foreground truncate">{item.description}</p>
          )}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {formatPrice(item.unit_price_centavos)} each
            </p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  disabled={disabled || item.quantity <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-6 text-center font-medium">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  disabled={disabled}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <span className="text-sm font-medium">
                {formatPrice(item.unit_price_centavos * item.quantity)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
